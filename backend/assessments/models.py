"""
Assessments Models — Coding problems, test cases, and submissions
"""
from django.db import models
from django.contrib.auth import get_user_model
from learning.models import Concept

User = get_user_model()


class Problem(models.Model):
    """A coding problem/challenge."""
    DIFFICULTY_CHOICES = [
        ('easy',   'Easy'),
        ('medium', 'Medium'),
        ('hard',   'Hard'),
    ]

    title       = models.CharField(max_length=200)
    slug        = models.SlugField(unique=True)
    description = models.TextField()
    difficulty  = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    
    # The primary concept this problem teaches/tests
    concept     = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='problems')
    
    # Base code provided to the student
    starter_code = models.TextField(blank=True, default='')
    
    # Hidden solution for reference
    solution_code = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessment_problem'
        ordering = ['concept', 'difficulty', 'title']

    def __str__(self):
        return f'{self.title} ({self.difficulty})'


class TestCase(models.Model):
    """A single test case for a problem."""
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='test_cases')
    
    # e.g., "two_sum([2, 7, 11, 15], 9)"
    input_data = models.TextField()
    
    # e.g., "[0, 1]"
    expected_output = models.TextField()
    
    is_hidden = models.BooleanField(default=False)
    order     = models.IntegerField(default=0)

    class Meta:
        db_table = 'assessment_testcase'
        ordering = ['order']

    def __str__(self):
        return f'{self.problem.slug} test {self.order}'


class Submission(models.Model):
    """A student\'s code submission."""
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions')
    
    code    = models.TextField()
    passed  = models.BooleanField(default=False)
    
    # Optional execution metrics
    execution_time_ms = models.FloatField(null=True, blank=True)
    error_message     = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assessment_submission'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} -> {self.problem.slug} ({"Pass" if self.passed else "Fail"})'
