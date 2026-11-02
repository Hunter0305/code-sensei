"""
Accounts URLs — Auth + Profile endpoints
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView

from .views import LoginView, RegisterView, ProfileView, DashboardSummaryView

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='auth-logout'),

    # Profile
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('dashboard/', DashboardSummaryView.as_view(), name='auth-dashboard'),
]
