import uuid
import os
from pathlib import Path
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils.text import slugify


class Genre(models.Model):
    """Genre or tag categorized from EPUB subject metadata."""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            if not base_slug:
                base_slug = f"tag-{uuid.uuid4().hex[:8]}"
            candidate = base_slug
            idx = 1
            while Genre.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{idx}"
                idx += 1
            self.slug = candidate
        super().save(*args, **kwargs)


class ReaderApp(models.Model):
    """Reader APK/App for reading EPUBs (e.g. Moon+ Reader Pro)."""
    name = models.CharField(max_length=150, help_text="e.g. Moon+ Reader Pro")
    version = models.CharField(max_length=50, blank=True, default="", help_text="e.g. v9.3")
    description = models.TextField(blank=True, default="Aplikasi pembaca EPUB/e-book terbaik untuk Android dengan dukungan kustomisasi font, tema, dan TTS.")
    apk_file = models.FileField(upload_to="apps/", blank=True, null=True, help_text="Upload .apk file")
    external_url = models.URLField(blank=True, default="", help_text="Alternatif link download jika file di-host eksternal (Google Drive / Direct link)")
    icon = models.ImageField(upload_to="app_icons/", blank=True, null=True, help_text="Icon aplikasi")
    is_active = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} {self.version}".strip()

    @property
    def file_size_mb(self):
        if self.apk_file and hasattr(self.apk_file, "size"):
            try:
                return round(self.apk_file.size / (1024 * 1024), 2)
            except Exception:
                return 0.0
        return 0.0

    @property
    def download_url(self):
        if self.apk_file:
            return self.apk_file.url
        return self.external_url


class EpubBook(models.Model):
    def save(self, *args, **kwargs):
        # Auto‑populate title from uploaded file name if missing or placeholder
        if self.epub_file and (not self.title or self.title in ["New Book", "Unknown"]):
            stem = Path(self.epub_file.name).stem
            if " - " in stem:
                stem = stem.rsplit(" - ", 1)[0].strip()
            self.title = stem
        super().save(*args, **kwargs)
    """Metadata and local path tracking for an EPUB file."""
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=500, db_index=True)
    original_title = models.CharField(max_length=500, blank=True, default="")
    author = models.CharField(max_length=255, default="Unknown", db_index=True)
    description = models.TextField(blank=True, default="")
    language = models.CharField(max_length=50, default="en", db_index=True)
    genres = models.ManyToManyField(Genre, blank=True, related_name="books")

    status = models.CharField(max_length=50, default="Completed")
    source_url = models.CharField(max_length=500, blank=True, default="")
    identifier = models.CharField(max_length=255, blank=True, default="")

    file_path = models.CharField(max_length=1000, blank=True, db_index=True)
    epub_file = models.FileField(upload_to="epubs/", blank=True, null=True, help_text="Upload .epub directly via admin")
    file_size_bytes = models.BigIntegerField(default=0)
    total_chapters = models.PositiveIntegerField(default=0)
    total_characters = models.PositiveIntegerField(default=0)
    
    cover_image = models.ImageField(upload_to="covers/", blank=True, null=True)
    cover_url = models.CharField(max_length=500, blank=True, default="")

    download_count = models.PositiveIntegerField(default=0, db_index=True)
    views_count = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=4.8)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.author})"


class TranslationGlossary(models.Model):
    """Glossary term mapping for automated translation."""
    CATEGORY_CHOICES = [
        ("general", "General / Universal Term"),
        ("name", "Character Name (Nama Karakter)"),
        ("honorific", "Honorific / Panggilan (-san, -kun, Senpai)"),
        ("skill", "Skill / Magic / Ability"),
        ("place", "Location / Kingdom / Place"),
        ("title_rule", "Chapter Title Regex / Rule"),
    ]

    STAGE_CHOICES = [
        ("pre_mt", "Pre-MT (Lindungi kata sebelum kirim ke Google Translate)"),
        ("post_mt", "Post-MT (Perbaiki hasil terjemahan Google Translate)"),
        ("both", "Both Stages (Pre & Post MT)"),
    ]

    LANG_CHOICES = [
        ("all", "All Languages (Semua Bahasa)"),
        ("id", "Indonesian (id)"),
        ("en", "English (en)"),
    ]

    original_term = models.CharField(max_length=150, help_text="Kata/frasa asli Jepang atau regex (e.g. 先輩, 田中, ^Episode)")
    replacement_term = models.CharField(max_length=150, help_text="Target terjemahan atau format pengganti (e.g. Senior, Tanaka, Chapter)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="general", db_index=True)
    target_lang = models.CharField(max_length=10, choices=LANG_CHOICES, default="all", db_index=True, help_text="Bahasa target terjemahan")
    apply_stage = models.CharField(max_length=10, choices=STAGE_CHOICES, default="pre_mt", help_text="Tahap penerapan istilah")
    priority = models.PositiveIntegerField(default=100, help_text="Prioritas eksekusi (angka lebih kecil = dieksekusi lebih dulu)")
    case_sensitive = models.BooleanField(default=True, help_text="Sensitif terhadap huruf kapital/kecil")
    ncode = models.CharField(
        max_length=20, 
        blank=True, 
        default="", 
        db_index=True,
        help_text="Optional novel ncode (e.g. n3353dl). Kosongkan jika berlaku global untuk SEMUA novel."
    )
    is_regex = models.BooleanField(default=False, help_text="Centang jika frasa asli berupa pola Regex.")
    notes = models.CharField(max_length=255, blank=True, default="", help_text="Catatan / keterangan tambahan (opsional)")
    hit_count = models.PositiveIntegerField(default=0, help_text="Berapa kali istilah ini terpakai saat crawling/TL")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority", "-created_at"]
        verbose_name = "Translation Glossary"
        verbose_name_plural = "Translation Glossaries"

    def __str__(self):
        scope = f"[{self.ncode}]" if self.ncode else "[GLOBAL]"
        return f"{scope} [{self.category}][{self.target_lang}] {self.original_term} -> {self.replacement_term}"

    @property
    def absolute_file_path(self):
        if self.epub_file:
            return self.epub_file.path
        return self.file_path

    @property
    def file_size_mb(self):
        if not self.file_size_bytes:
            return 0.0
        return round(self.file_size_bytes / (1024 * 1024), 2)

    @property
    def display_cover(self):
        if self.cover_image:
            return self.cover_image.url
        if self.cover_url:
            return self.cover_url
        return "/assets/cover_placeholder.svg"

    @property
    def chars_display(self):
        if not self.total_characters:
            return "120K"
        if self.total_characters >= 1000000:
            return f"{round(self.total_characters / 1000000, 1)}M"
        if self.total_characters >= 1000:
            return f"{round(self.total_characters / 1000, 1)}K"
        return str(self.total_characters)


@receiver(post_delete, sender=EpubBook)
def auto_delete_book_files(sender, instance, **kwargs):
    """Clean up actual EPUB and cover files on disk when a book is deleted from DB."""
    # Delete uploaded .epub file
    if instance.epub_file:
        try:
            if instance.epub_file.storage.exists(instance.epub_file.name):
                instance.epub_file.delete(save=False)
        except Exception:
            pass

    # Delete cover image
    if instance.cover_image:
        try:
            if instance.cover_image.storage.exists(instance.cover_image.name):
                instance.cover_image.delete(save=False)
        except Exception:
            pass

    # Delete local scanned file_path if stored
    if instance.file_path and os.path.isfile(instance.file_path):
        try:
            os.remove(instance.file_path)
        except Exception:
            pass

