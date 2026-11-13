"""EPUB upload endpoint.
POST /api/upload/
Fields: epub_file (required), title (optional).
If title missing, derived from filename (strip ' - author' part).
Parses metadata via scanner.parse_epub, populates EpubBook, genres, cover.
"""
import os
import re
from pathlib import Path

from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .models import EpubBook, Genre
from .scanner import parse_epub


class EpubUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        epub_file = request.FILES.get("epub_file")
        if not epub_file:
            return Response({"error": "epub_file is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Optional title – fallback to filename stem (strip author part after ' - ')
        title = request.data.get("title", "").strip()
        stem = Path(epub_file.name).stem
        orig_title = request.data.get("original_title", "").strip()
        lang_param = request.data.get("language", "").strip()

        # If title from request matches raw author name or is empty, derive from stem
        if " - " in stem:
            stem_title = stem.rsplit(" - ", 1)[0].strip()
        else:
            stem_title = stem
        stem_title = re.sub(r"^\[(?:EN|ID|JA)\]\s*", "", stem_title, flags=re.IGNORECASE).strip()

        if not title:
            title = stem_title

        # Create model instance with uploaded file
        book = EpubBook()
        book.epub_file = epub_file
        orig_title = request.data.get("original_title", "").strip()
        if orig_title:
            book.original_title = orig_title
        lang_param = request.data.get("language", "").strip()
        if lang_param:
            book.language = lang_param
        # Temporary title until parsed from epub or request
        book.title = title or "Novel"
        book.save()  # store file, obtain PK

        # Path to saved file on disk
        try:
            epub_path = book.epub_file.path
        except Exception:
            epub_path = None

        if epub_path and os.path.exists(epub_path):
            try:
                meta = parse_epub(epub_path)
                # Prefer rich metadata title if upload title was fallback/stem or identical to author
                parsed_title = meta.get("title")
                author_val = meta.get("author") or ""
                if parsed_title:
                    # If request provided title was missing, matched stem fallback, or was accidentally author
                    if not request.data.get("title") or title == stem or title == stem_title or (author_val and title.lower() == author_val.lower()):
                        book.title = parsed_title
                    else:
                        book.title = title
                elif title:
                    book.title = title

                if not book.original_title and meta.get("original_title"):
                    book.original_title = meta["original_title"]
                if not book.author or book.author == "Unknown":
                    book.author = meta.get("author") or "Unknown"
                if not book.description and meta.get("description"):
                    book.description = meta["description"]
                if not book.source_url and meta.get("source_url"):
                    book.source_url = meta["source_url"]
                if not book.identifier and meta.get("identifier"):
                    book.identifier = meta["identifier"]
                if not book.language:
                    book.language = meta.get("language", "en")

                book.total_chapters = meta.get("total_chapters", 1)
                book.total_characters = meta.get("total_characters", 0)
                book.file_size_bytes = meta.get("file_size", epub_file.size if epub_file else 0)
                book.file_path = epub_path

                book.save()

                # Cover handling
                if not book.cover_image and meta.get("cover_bytes"):
                    cover_name = f"cover_{book.id}_{meta.get('cover_filename', 'cover.jpg')}"
                    book.cover_image.save(
                        cover_name, ContentFile(meta["cover_bytes"]), save=False
                    )
                    book.save(update_fields=["cover_image"])

                # Genres association
                for g_name in meta.get("genres", []):
                    g, _ = Genre.objects.get_or_create(name=g_name)
                    book.genres.add(g)
            except Exception as e:
                return Response(
                    {"id": book.id, "title": book.title, "warning": f"Metadata parse failed: {e}"},
                    status=status.HTTP_201_CREATED,
                )

        return Response(
            {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "language": book.language,
                "total_chapters": book.total_chapters,
            },
            status=status.HTTP_201_CREATED,
        )
