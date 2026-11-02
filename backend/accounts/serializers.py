"""
Accounts Serializers — Register, Login, Profile
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import StudentProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for new user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name']

    def validate(self, attrs):
        pw = attrs.get('password')
        pw_confirm = attrs.get('password_confirm') or self.initial_data.get('password2') or self.initial_data.get('password_confirm')
        if not pw_confirm or pw != pw_confirm:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Auto-create a StudentProfile
        StudentProfile.objects.create(user=user)
        return user


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for the student profile."""

    class Meta:
        model = StudentProfile
        fields = [
            'level', 'learning_goal', 'preferred_language',
            'streak', 'longest_streak', 'total_xp', 'last_active', 'created_at'
        ]
        read_only_fields = ['streak', 'longest_streak', 'total_xp', 'last_active', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile including student profile."""
    profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'date_joined', 'profile'
        ]
        read_only_fields = ['id', 'date_joined']


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user + student profile."""
    profile = StudentProfileSerializer()

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Update profile fields
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance
