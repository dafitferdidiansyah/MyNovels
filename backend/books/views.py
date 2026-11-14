import os
import urllib.parse
from django.conf import settings
from django.db.models import F, Count, Sum
from django.http import FileResponse, HttpResponse, Http404
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import EpubBook, Genre, ReaderApp
from .serializers import (
    EpubBookListSerializer,
    EpubBookDetailSerializer,
    GenreSerializer,
    ReaderAppSerializer,
)
from .scanner import scan_epub_directory


class EpubBookFilter(django_filters.FilterSet):
    genre = django_filters.CharFilter(method="filter_multi_genres")
    genres = django_filters.CharFilter(method="filter_multi_genres")
    exclude_genres = django_filters.CharFilter(method="filter_exclude_genres")
    author = django_filters.CharFilter(field_name="author", lookup_expr="icontains")
    status = django_filters.CharFilter(method="filter_multi_status")
    language = django_filters.CharFilter(method="filter_multi_language")

    def filter_multi_genres(self, queryset, name, value):
        if not value:
            return queryset
        slugs = [s.strip().lower() for s in value.split(",") if s.strip()]
        if not slugs:
            return queryset
        for slug in slugs:
            queryset = queryset.filter(genres__slug=slug)
        return queryset.distinct()

    def filter_exclude_genres(self, queryset, name, value):
        if not value:
            return queryset
        slugs = [s.strip().lower() for s in value.split(",") if s.strip()]
        if not slugs:
            return queryset
        return queryset.exclude(genres__slug__in=slugs).distinct()

    def filter_multi_status(self, queryset, name, value):
        if not value:
            return queryset
        raw_statuses = [s.strip() for s in value.split(",") if s.strip()]
        if not raw_statuses:
            return queryset
        from django.db.models import Q
        q = Q()
        for st in raw_statuses:
            q |= Q(status__iexact=st)
        return queryset.filter(q)

    def filter_multi_language(self, queryset, name, value):
        if not value:
            return queryset
        langs = [s.strip().lower() for s in value.split(",") if s.strip()]
        if not langs:
            return queryset
        return queryset.filter(language__in=langs)

    class Meta:
        model = EpubBook
        fields = ["genre", "genres", "exclude_genres", "author", "status", "language"]


class EpubBookListView(generics.ListAPIView):
    """List EPUB books with search, genre filter, and ordering."""
    queryset = EpubBook.objects.prefetch_related("genres").all()
    serializer_class = EpubBookListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EpubBookFilter
    search_fields = ["title", "author", "description"]
    ordering_fields = ["created_at", "download_count", "title", "file_size_bytes", "total_chapters"]
    ordering = ["-created_at"]


class EpubBookDetailView(generics.RetrieveAPIView):
    """Retrieve single EPUB book detail."""
    queryset = EpubBook.objects.prefetch_related("genres").all()
    serializer_class = EpubBookDetailSerializer


class EpubDownloadView(APIView):
    """Direct secure download endpoint with X-Accel-Redirect offloading to Nginx.
    Supports MeGaneBuk-style batch chapter slicing (?start=1&end=50).
    """

    def get(self, request, pk):
        try:
            book = EpubBook.objects.get(pk=pk)
        except EpubBook.DoesNotExist:
            raise Http404("Buku ePub tidak ditemukan.")

        target_path = book.absolute_file_path
        if not target_path or not os.path.exists(target_path):
            raise Http404("File ePub pada storage server tidak ditemukan.")

        # Check for range batch download parameters (start & end)
        start_param = request.query_params.get("start")
        end_param = request.query_params.get("end")
        if start_param and end_param:
            try:
                start_ch = int(start_param)
                end_ch = int(end_param)
                if 1 <= start_ch <= end_ch:
                    range_epub_path = self._build_range_epub(book, target_path, start_ch, end_ch)
                    if range_epub_path and os.path.exists(range_epub_path):
                        target_path = range_epub_path
            except Exception as e:
                import logging
                logging.getLogger("books").warning(f"Failed to generate range epub: {e}")

        # Increment atomic download counter
        EpubBook.objects.filter(pk=pk).update(download_count=F("download_count") + 1)

        filename = os.path.basename(target_path)
        # RFC 6266 / RFC 5987 standard for safe utf-8 filename in HTTP header
        ascii_fallback = filename.encode("ascii", "ignore").decode().strip() or "novel.epub"
        quoted_filename = urllib.parse.quote(filename)
        content_disposition = f'attachment; filename="{ascii_fallback}"; filename*=UTF-8\'\'{quoted_filename}'

        # Offload file transfer to Nginx via X-Accel-Redirect when running on Linux / production
        media_root = str(settings.MEDIA_ROOT).replace("\\", "/").rstrip("/")
        norm_target = str(target_path).replace("\\", "/")

        if (os.name != "nt" or getattr(settings, "USE_X_ACCEL", False)) and norm_target.startswith(media_root):
            rel_path = norm_target[len(media_root):].lstrip("/")
            quoted_rel_path = urllib.parse.quote(rel_path)
            response = HttpResponse(content_type="application/epub+zip")
            response["X-Accel-Redirect"] = f"/protected_media/{quoted_rel_path}"
            response["Content-Disposition"] = content_disposition
            response["Access-Control-Expose-Headers"] = "Content-Disposition"
            return response

        # Local fallback
        response = FileResponse(open(target_path, "rb"), content_type="application/epub+zip")
        response["Content-Disposition"] = content_disposition
        response["Access-Control-Expose-Headers"] = "Content-Disposition"
        return response

    def _build_range_epub(self, book, source_path, start_ch, end_ch):
        """Extracts and repacks a valid subset of chapters from existing EPUB into a batch EPUB."""
        import zipfile
        import tempfile
        import re
        from pathlib import Path

        range_label = f"Ch {start_ch:03d}-{end_ch:03d}"
        stem = Path(source_path).stem
        batch_filename = f"{stem} ({range_label}).epub"

        # Check in media/batches cache directory
        batches_dir = Path(settings.MEDIA_ROOT) / "batches"
        batches_dir.mkdir(parents=True, exist_ok=True)
        cached_batch_file = batches_dir / batch_filename
        if cached_batch_file.is_file() and cached_batch_file.stat().st_size > 5000:
            return str(cached_batch_file)

        # Inspect and slice EPUB chapters
        with zipfile.ZipFile(source_path, "r") as src_zip:
            namelist = src_zip.namelist()
            
            # Find chapter files (e.g., OEBPS/chapter_001.xhtml or chapter-1.xhtml)
            chapter_entries = []
            for name in namelist:
                m = re.search(r'(?:chapter|ch)[-_]?(\d+)', name, re.IGNORECASE)
                if m and name.endswith(('.xhtml', '.html', '.htm')):
                    ep_num = int(m.group(1))
                    chapter_entries.append((ep_num, name))
            
            if not chapter_entries:
                return source_path

            chapter_entries.sort(key=lambda x: x[0])
            matched_names = {name for ep, name in chapter_entries if start_ch <= ep <= end_ch}
            excluded_names = {name for ep, name in chapter_entries if name not in matched_names}

            if not matched_names:
                return source_path

            # Create partial EPUB in memory or temp file
            temp_out = batches_dir / f"tmp_{batch_filename}"
            with zipfile.ZipFile(temp_out, "w", compression=zipfile.ZIP_DEFLATED) as dst_zip:
                for item in src_zip.infolist():
                    if item.filename in excluded_names:
                        continue
                    
                    data = src_zip.read(item.filename)
                    # Filter spine / manifest references in content.opf
                    if item.filename.endswith(".opf"):
                        opf_str = data.decode("utf-8", errors="replace")
                        for ex in excluded_names:
                            ex_base = os.path.basename(ex)
                            # Remove itemref & item definitions for excluded chapters
                            opf_str = re.sub(rf'<item\b[^>]*href=["\'][^"\']*{re.escape(ex_base)}["\'][^>]*/>\s*', '', opf_str)
                            opf_str = re.sub(rf'<itemref\b[^>]*idref=["\'][^"\']*{re.escape(Path(ex_base).stem)}["\'][^>]*/>\s*', '', opf_str)
                        data = opf_str.encode("utf-8")
                    
                    # Filter nav / toc.ncx references
                    elif item.filename.endswith(".ncx"):
                        ncx_str = data.decode("utf-8", errors="replace")
                        for ex in excluded_names:
                            ex_base = os.path.basename(ex)
                            ncx_str = re.sub(rf'<navPoint\b[^>]*>.*?<content\b[^>]*src=["\'][^"\']*{re.escape(ex_base)}["\'][^>]*/>.*?</navPoint>\s*', '', ncx_str, flags=re.DOTALL)
                        data = ncx_str.encode("utf-8")

                    dst_zip.writestr(item, data)

            if temp_out.is_file():
                temp_out.replace(cached_batch_file)
                return str(cached_batch_file)

        return source_path


class TriggerScanView(APIView):
    """Trigger scanning of local ePub directory."""

    def post(self, request):
        default_folder = r"C:\Users\Dafit Fernandus\Downloads"
        folder_path = request.data.get("folder_path") or default_folder
        force_update = bool(request.data.get("force_update", False))

        result = scan_epub_directory(folder_path, force_update=force_update)
        if result["status"] == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class GenreListView(generics.ListAPIView):
    """List all genres with count of books."""
    queryset = Genre.objects.annotate(books_count=Count("books")).filter(books_count__gt=0).order_by("-books_count")
    serializer_class = GenreSerializer
    pagination_class = None


class StatsView(APIView):
    """Overall statistics for dashboard / header badge."""

    def get(self, request):
        total_books = EpubBook.objects.count()
        total_downloads = EpubBook.objects.aggregate(total=Sum("download_count"))["total"] or 0
        total_bytes = EpubBook.objects.aggregate(total=Sum("file_size_bytes"))["total"] or 0
        total_genres = Genre.objects.filter(books__isnull=False).distinct().count()

        return Response({
            "total_books": total_books,
            "total_downloads": total_downloads,
            "total_size_mb": round(total_bytes / (1024 * 1024), 2),
            "total_genres": total_genres,
        })


class ReaderAppListView(generics.ListAPIView):
    """List active reader APKs / apps for users to download."""
    queryset = ReaderApp.objects.filter(is_active=True)
    serializer_class = ReaderAppSerializer
    pagination_class = None


class ReaderAppDownloadView(APIView):
    """Serve APK file download and increment count."""

    def get(self, request, pk):
        try:
            app = ReaderApp.objects.get(pk=pk, is_active=True)
        except ReaderApp.DoesNotExist:
            raise Http404("Aplikasi tidak ditemukan.")

        if not app.apk_file or not os.path.exists(app.apk_file.path):
            if app.external_url:
                from django.shortcuts import redirect
                ReaderApp.objects.filter(pk=pk).update(download_count=F("download_count") + 1)
                return redirect(app.external_url)
            raise Http404("File APK tidak ditemukan di server.")

        ReaderApp.objects.filter(pk=pk).update(download_count=F("download_count") + 1)
        filename = os.path.basename(app.apk_file.path)
        response = FileResponse(open(app.apk_file.path, "rb"), content_type="application/vnd.android.package-archive")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Access-Control-Expose-Headers"] = "Content-Disposition"
        return response
