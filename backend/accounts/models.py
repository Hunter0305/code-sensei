"""
Accounts Models — Custom User + StudentProfile
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model for Code Sensei students."""
    email = models.EmailField(unique=True)

    # Use email as the login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email


class StudentProfile(models.Model):
    """Extended profile for a Code Sensei student."""

    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='beginner'
    )
    learning_goal = models.TextField(blank=True, default='')
    preferred_language = models.CharField(max_length=50, default='python')
    streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_student_profile'
        verbose_name = 'Student Profile'

    def __str__(self):
        return f'{self.user.email} – {self.level}'
