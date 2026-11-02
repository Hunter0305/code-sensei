from django.urls import path
from .views import (
    ProblemListView,
    ProblemDetailView,
    SubmitCodeView,
    RunCodeView,
)

urlpatterns = [
    path('problems/', ProblemListView.as_view(), name='problem-list'),
    path('problems/<int:id>/', ProblemDetailView.as_view(), name='problem-detail'),
    path('problems/<int:id>/submit/', SubmitCodeView.as_view(), name='problem-submit'),
    path('problems/<int:id>/run/', RunCodeView.as_view(), name='problem-run'),
    path('submissions/', SubmitCodeView.as_view(), name='submissions-root'),
]
