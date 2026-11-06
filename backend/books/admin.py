import os
from django.contrib import admin
from django.core.files.base import ContentFile
from .models import EpubBook, Genre, ReaderApp
from .scanner import parse_epub


@admin.register(ReaderApp)
class ReaderAppAdmin(admin.ModelAdmin):
    list_display = ["name", "version", "file_size_mb", "is_active", "download_count", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "version", "description"]
    fields = [
        "name",
        "version",
        "description",
        "apk_file",
        "external_url",
        "icon",
        "is_active",
        "download_count",
    ]


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(EpubBook)
class EpubBookAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "language", "total_chapters", "file_size_mb", "download_count", "created_at"]
    search_fields = ["title", "author", "description", "original_title"]
    list_filter = ["language", "genres", "created_at"]
    readonly_fields = ["file_size_bytes", "created_at", "updated_at"]
    filter_horizontal = ["genres"]
    actions = ["reparse_selected_epubs"]
    autocomplete_fields = []
    fields = [
        "epub_file",
        "title",
        "original_title",
        "author",
        "description",
        "language",
        "status",
        "genres",
        "source_url",
        "identifier",
        "cover_image",
        "total_chapters",
        "total_characters",
        "file_size_bytes",
        "created_at",
        "updated_at",
    ]

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        return initial

    def save_model(self, request, obj, form, change):
        # Pre-fill title from filename before save if title is empty or default
        if obj.epub_file and (not obj.title or obj.title == "New Book"):
            from pathlib import Path
            stem_name = Path(obj.epub_file.name).stem
            if " - " in stem_name:
                obj.title = stem_name.rsplit(" - ", 1)[0].strip()
            else:
                obj.title = stem_name

        super().save_model(request, obj, form, change)

        # Jika file epub diupload lewat form admin, auto-parse metadata & cover otomatis!
        if obj.epub_file and (not obj.total_chapters or "epub_file" in form.changed_data):
            try:
                target_path = None
                try:
                    target_path = obj.epub_file.path
                except Exception:
                    pass
                if not target_path and obj.file_path and os.path.exists(obj.file_path):
                    target_path = obj.file_path

                if target_path and os.path.exists(target_path):
                    parsed = parse_epub(target_path)
                    # Filename-derived title takes priority if title is blank or default/stem
                    filename_title = Path(target_path).stem
                    if " - " in filename_title:
                        filename_title = filename_title.rsplit(" - ", 1)[0].strip()

                    if not obj.title or obj.title in ["New Book", "Unknown", filename_title]:
                        obj.title = filename_title if filename_title else (parsed.get("title") or obj.title)
                    
                    if not obj.original_title and parsed.get("original_title"):
                        obj.original_title = parsed.get("original_title", "")
                    if not obj.author or obj.author == "Unknown":
                        obj.author = parsed.get("author") or obj.author
                    if not obj.description and parsed.get("description"):
                        obj.description = parsed.get("description", "")
                    if not obj.source_url and parsed.get("source_url"):
                        obj.source_url = parsed.get("source_url", "")
                    if not obj.identifier and parsed.get("identifier"):
                        obj.identifier = parsed.get("identifier", "")
                    if not obj.language or obj.language == "en":
                        obj.language = parsed.get("language", obj.language or "en")
                    
                    obj.total_chapters = parsed.get("total_chapters", 1)
                    obj.total_characters = parsed.get("total_characters", 0)
                    obj.file_size_bytes = parsed.get("file_size", obj.epub_file.size if obj.epub_file else 0)
                    obj.file_path = target_path

                    # Auto save cover from EPUB if not provided
                    if not obj.cover_image and parsed.get("cover_bytes"):
                        cover_name = f"cover_{obj.id}_{parsed.get('cover_filename', 'cover.jpg')}"
                        obj.cover_image.save(cover_name, ContentFile(parsed["cover_bytes"]), save=False)

                    obj.save()

                    # Sync genres/tags
                    for g_name in parsed.get("genres", []):
                        g, _ = Genre.objects.get_or_create(name=g_name)
                        obj.genres.add(g)
            except Exception as e:
                self.message_user(request, f"Notice: Error auto-parsing EPUB metadata: {e}", level="warning")

    @admin.action(description="🔄 Re-parse metadata & cover from EPUB file")
    def reparse_selected_epubs(self, request, queryset):
        success = 0
        failed = 0
        from pathlib import Path
        for obj in queryset:
            target_path = None
            if obj.epub_file:
                try:
                    target_path = obj.epub_file.path
                except Exception:
                    pass
            if not target_path and obj.file_path and os.path.exists(obj.file_path):
                target_path = obj.file_path

            if not target_path or not os.path.exists(target_path):
                failed += 1
                continue

            try:
                parsed = parse_epub(target_path)
                filename_title = Path(target_path).stem
                if " - " in filename_title:
                    filename_title = filename_title.rsplit(" - ", 1)[0].strip()

                if not obj.title or obj.title in ["New Book", "Unknown", filename_title]:
                    obj.title = filename_title if filename_title else (parsed.get("title") or obj.title)

                if parsed.get("original_title"):
                    obj.original_title = parsed.get("original_title")
                if parsed.get("author") and parsed.get("author") != "Unknown":
                    obj.author = parsed.get("author")
                if parsed.get("description"):
                    obj.description = parsed.get("description")
                if parsed.get("source_url"):
                    obj.source_url = parsed.get("source_url")
                if parsed.get("identifier"):
                    obj.identifier = parsed.get("identifier")
                if parsed.get("language"):
                    obj.language = parsed.get("language")

                obj.total_chapters = parsed.get("total_chapters", 1)
                obj.total_characters = parsed.get("total_characters", 0)
                obj.file_size_bytes = parsed.get("file_size", obj.file_size_bytes or 0)
                obj.file_path = target_path

                if parsed.get("cover_bytes"):
                    cover_name = f"cover_{obj.id}_{parsed.get('cover_filename', 'cover.jpg')}"
                    obj.cover_image.save(cover_name, ContentFile(parsed["cover_bytes"]), save=False)

                obj.save()

                for g_name in parsed.get("genres", []):
                    g, _ = Genre.objects.get_or_create(name=g_name)
                    obj.genres.add(g)

                success += 1
            except Exception as e:
                failed += 1

        self.message_user(request, f"Successfully re-parsed {success} books. Failed: {failed}.")

