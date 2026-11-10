"""Serializer for EPUB upload via MyNovels API.
Title is optional – if omitted, derived from uploaded filename.
"""
from rest_framework import serializers

class EpubUploadSerializer(serializers.Serializer):
    epub_file = serializers.FileField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
