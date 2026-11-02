"""
Accounts Views — Register, Profile, Dashboard Summary
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
)

User = get_user_model()


class CodeSenseiTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that also returns user info."""

    def validate(self, attrs):
        data = super().validate(attrs)
        # Append user info to the token response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        # Append profile info if it exists
        try:
            profile = self.user.profile
            data['user']['level'] = profile.level
            data['user']['streak'] = profile.streak
            data['user']['total_xp'] = profile.total_xp
        except Exception:
            pass
        return data


class LoginView(TokenObtainPairView):
    """Login endpoint — returns JWT access + refresh tokens + user info."""
    serializer_class = CodeSenseiTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    """Register a new student account."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Account created successfully. Please log in.',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                }
            },
            status=status.HTTP_201_CREATED
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user


class DashboardSummaryView(APIView):
    """Return a quick summary of the student's dashboard stats."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = user.profile
            streak = profile.streak
            total_xp = profile.total_xp
            level = profile.level
        except Exception:
            streak = 0
            total_xp = 0
            level = 'beginner'

        return Response({
            'greeting': f'Welcome back, {user.first_name or user.username}!',
            'streak': streak,
            'total_xp': total_xp,
            'level': level,
            # These will be populated in later phases
            'overall_mastery': 0,
            'weak_concepts_count': 0,
            'recent_activity_count': 0,
        })
