from django.urls import path
from .views import (
    ActiveRoadmapView,
    GenerateRoadmapView,
    RoadmapRootView,
    RoadmapNodeUpdateView,
)

urlpatterns = [
    path('roadmap/', RoadmapRootView.as_view(), name='roadmap-root'),
    path('roadmap/active/', ActiveRoadmapView.as_view(), name='roadmap-active'),
    path('roadmap/generate/', GenerateRoadmapView.as_view(), name='roadmap-generate'),
    path('roadmap/nodes/<int:pk>/status/', RoadmapNodeUpdateView.as_view(), name='roadmap-node-status'),
    path('roadmap/nodes/<int:pk>/', RoadmapNodeUpdateView.as_view(), name='roadmap-node-update'),
]

