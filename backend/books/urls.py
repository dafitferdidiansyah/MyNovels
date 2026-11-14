from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from . import views
from .models import TranslationGlossary
from .upload_view import EpubUploadView

class TranslationGlossaryView(APIView):
    """API endpoint to fetch active glossaries for translation pipelines."""
    def get(self, request):
        ncode = request.query_params.get("ncode", "").strip().lower()
        target_lang = request.query_params.get("lang", "id").strip().lower()
        qs = TranslationGlossary.objects.filter(is_active=True).order_by("priority", "-created_at")
        
        # Filter language: matching target_lang or 'all'
        qs = qs.filter(target_lang__in=["all", target_lang])

        # Pre-MT non-regex terms
        pre_qs = qs.filter(apply_stage__in=["pre_mt", "both"], is_regex=False)
        global_terms = {item.original_term: item.replacement_term for item in pre_qs.filter(ncode="")}
        novel_terms = {}
        if ncode:
            novel_terms = {item.original_term: item.replacement_term for item in pre_qs.filter(ncode=ncode)}
        
        combined = dict(global_terms)
        combined.update(novel_terms)

        # Post-MT cleanups
        post_terms = {
            item.original_term: item.replacement_term 
            for item in qs.filter(apply_stage__in=["post_mt", "both"], is_regex=False)
            if not item.ncode or item.ncode == ncode
        }

        # Regex rules (for title cleaning or custom patterns)
        regex_rules = [
            {
                "pattern": item.original_term,
                "replacement": item.replacement_term,
                "category": item.category,
                "apply_stage": item.apply_stage,
                "priority": item.priority,
                "ncode": item.ncode
            }
            for item in qs.filter(is_regex=True)
            if not item.ncode or item.ncode == ncode
        ]

        return Response({
            "target_lang": target_lang,
            "global": global_terms,
            "novel": novel_terms,
            "terms": combined,
            "post_terms": post_terms,
            "regex_rules": regex_rules
        })


urlpatterns = [
    path("books/", views.EpubBookListView.as_view(), name="book-list"),
    path("upload/", EpubUploadView.as_view(), name="epub-upload"),
    path("books/<int:pk>/", views.EpubBookDetailView.as_view(), name="book-detail"),
    path("books/<int:pk>/download/", views.EpubDownloadView.as_view(), name="book-download"),
    path("genres/", views.GenreListView.as_view(), name="genre-list"),
    path("scan/", views.TriggerScanView.as_view(), name="trigger-scan"),
    path("stats/", views.StatsView.as_view(), name="stats"),
    path("apps/", views.ReaderAppListView.as_view(), name="app-list"),
    path("apps/<int:pk>/download/", views.ReaderAppDownloadView.as_view(), name="app-download"),
    path("glossary/", TranslationGlossaryView.as_view(), name="glossary-list"),
]
