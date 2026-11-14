from rest_framework import serializers
from .models import EpubBook, Genre, ReaderApp


class ReaderAppSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.FloatField(read_only=True)
    download_url = serializers.SerializerMethodField()
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = ReaderApp
        fields = [
            "id",
            "name",
            "version",
            "description",
            "download_url",
            "icon_url",
            "file_size_mb",
            "download_count",
            "created_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        if obj.apk_file:
            url = f"/api/apps/{obj.id}/download/"
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return obj.external_url

    def get_icon_url(self, obj):
        request = self.context.get("request")
        if obj.icon:
            if request is not None:
                return request.build_absolute_uri(obj.icon.url)
            return obj.icon.url
        return ""


class GenreSerializer(serializers.ModelSerializer):
    books_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Genre
        fields = ["id", "name", "slug", "books_count"]


class EpubBookListSerializer(serializers.ModelSerializer):
    genres = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    file_size_mb = serializers.FloatField(read_only=True)
    cover = serializers.SerializerMethodField()
    chars_display = serializers.CharField(read_only=True)
    download_url = serializers.SerializerMethodField()

    def get_cover(self, obj):
        cover_path = obj.display_cover
        if not cover_path:
            return ""
        if "/media/" in cover_path:
            return cover_path[cover_path.index("/media/"):]
        return cover_path

    class Meta:
        model = EpubBook
        fields = [
            "id",
            "title",
            "original_title",
            "author",
            "description",
            "language",
            "genres",
            "status",
            "source_url",
            "identifier",
            "file_size_bytes",
            "file_size_mb",
            "total_chapters",
            "total_characters",
            "chars_display",
            "cover",
            "download_count",
            "views_count",
            "rating",
            "download_url",
            "created_at",
            "updated_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/books/{obj.id}/download/"
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class EpubBookDetailSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    file_size_mb = serializers.FloatField(read_only=True)
    cover = serializers.SerializerMethodField()
    chars_display = serializers.CharField(read_only=True)
    download_url = serializers.SerializerMethodField()

    def get_cover(self, obj):
        cover_path = obj.display_cover
        if not cover_path:
            return ""
        if "/media/" in cover_path:
            return cover_path[cover_path.index("/media/"):]
        return cover_path

    class Meta:
        model = EpubBook
        fields = [
            "id",
            "title",
            "original_title",
            "author",
            "description",
            "language",
            "genres",
            "status",
            "source_url",
            "identifier",
            "file_size_bytes",
            "file_size_mb",
            "total_chapters",
            "total_characters",
            "chars_display",
            "cover",
            "download_count",
            "views_count",
            "rating",
            "download_url",
            "created_at",
            "updated_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/books/{obj.id}/download/"
        if request is not None:
            return request.build_absolute_uri(url)
        return url
