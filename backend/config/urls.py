"""
Code Sensei – Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/auth/', include('accounts.urls')),
    path('api/learning/', include('learning.urls')),
    path('api/mentor/', include('mentor.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/adaptive/', include('adaptive.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
