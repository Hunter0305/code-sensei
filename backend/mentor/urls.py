"""Mentor app URL routes."""
from django.urls import path
from .views import (
    AgentListView,
    ConversationListCreateView,
    ConversationDetailView,
    SendMessageView,
    EscalateHintView,
    OllamaHealthView,
    FacultyNoteListCreateView,
)

urlpatterns = [
    # Agents
    path('agents/',                              AgentListView.as_view(),             name='agent-list'),

    # Faculty Notes (Inter-Agent Collaborative Memory)
    path('faculty-notes/',                       FacultyNoteListCreateView.as_view(),  name='faculty-notes'),

    # Conversations
    path('conversations/',                       ConversationListCreateView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/',              ConversationDetailView.as_view(),     name='conversation-detail'),

    # Chat
    path('conversations/<int:pk>/message/',      SendMessageView.as_view(),            name='send-message'),

    # Hint escalation
    path('conversations/<int:pk>/hint/',         EscalateHintView.as_view(),           name='escalate-hint'),

    # Health
    path('health/',                              OllamaHealthView.as_view(),           name='ollama-health'),
]
