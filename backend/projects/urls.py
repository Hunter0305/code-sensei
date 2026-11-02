from django.urls import path
from .views import (
    ProjectListView,
    ProjectDetailView,
    ProjectAnalyzeView,
    UploadProjectVersionView,
)

urlpatterns = [
    path('', ProjectListView.as_view(), name='project-list'),
    path('<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:pk>/analyze/', ProjectAnalyzeView.as_view(), name='project-analyze'),
    path('<int:project_id>/versions/', UploadProjectVersionView.as_view(), name='project-version-upload'),
]

