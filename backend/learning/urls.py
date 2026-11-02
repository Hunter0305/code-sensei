"""Learning app URL routes."""
from django.urls import path
from .views import (
    ConceptListView,
    LearningGraphView,
    MasteryListView,
    MasteryDetailView,
    RecordAttemptView,
    WeakConceptsView,
    ProgressAnalyticsView,
)

urlpatterns = [
    # Concepts
    path('concepts/',                            ConceptListView.as_view(),     name='concept-list'),

    # Graph payload
    path('graph/',                               LearningGraphView.as_view(),   name='learning-graph'),

    # Mastery
    path('mastery/',                             MasteryListView.as_view(),     name='mastery-list'),
    path('mastery/<int:concept_id>/',            MasteryDetailView.as_view(),   name='mastery-detail'),
    path('mastery/<int:concept_id>/attempt/',    RecordAttemptView.as_view(),   name='mastery-attempt'),

    # Smart recommendations & Progress Analytics
    path('weak-concepts/',                       WeakConceptsView.as_view(),    name='weak-concepts'),
    path('progress/analytics/',                  ProgressAnalyticsView.as_view(), name='learning-progress-analytics'),
]

