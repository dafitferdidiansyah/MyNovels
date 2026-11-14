from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_status_view(request):
    return JsonResponse({
        "service": "MyNovels API",
        "status": "online",
        "version": "1.0.0"
    })

urlpatterns = [
    path('', root_status_view, name='api-root-status'),
    path('admin/', admin.site.urls),
    path('api/', include('books.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
