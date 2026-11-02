"""
Learning Models — Concept Graph + Mastery Tracking

Core data structures for the Learning Memory Graph:
  - Concept: a programming concept node in the knowledge graph
  - ConceptMastery: per-student mastery state for each concept
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Concept(models.Model):
    """
    A programming concept / skill node in the knowledge graph.
    Concepts form a prerequisite tree — e.g. 'Recursion' requires 'Functions'.
    """

    CATEGORY_CHOICES = [
        ('fundamentals',    'Fundamentals'),
        ('data_structures', 'Data Structures'),
        ('algorithms',      'Algorithms'),
        ('oop',             'Object-Oriented Programming'),
        ('functional',      'Functional Programming'),
        ('concurrency',     'Concurrency'),
        ('patterns',        'Design Patterns'),
        ('testing',         'Testing'),
        ('web',             'Web Development'),
        ('databases',       'Databases'),
        ('devops',          'DevOps'),
        ('other',           'Other'),
    ]

    DIFFICULTY_CHOICES = [(i, i) for i in range(1, 6)]

    name        = models.CharField(max_length=100, unique=True)
    language    = models.CharField(max_length=50, default='python')
    category    = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='fundamentals')
    description = models.TextField(blank=True, default='')
    difficulty  = models.IntegerField(choices=DIFFICULTY_CHOICES, default=1)

    # Self-referential M2M for prerequisite relationships
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='unlocks'
    )

    # Position hints for the graph layout (stored as float 0-1)
    graph_x = models.FloatField(default=0.5)
    graph_y = models.FloatField(default=0.5)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'learning_concept'
        ordering  = ['difficulty', 'name']
        verbose_name = 'Concept'

    def __str__(self):
        return f'{self.name} ({self.language})'


class ConceptMastery(models.Model):
    """
    Tracks one student's mastery of one concept.
    Updated automatically after every problem submission, quiz, and project analysis.
    """

    MASTERY_STATE_CHOICES = [
        ('not_started', 'Not Started'),
        ('developing',  'Developing'),
        ('weak',        'Weak'),
        ('strong',      'Strong'),
        ('critical',    'Critical'),   # many repeated mistakes
    ]

    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='masteries')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='masteries')

    # Core scoring
    mastery_score = models.FloatField(default=0.0)       # 0-100
    confidence    = models.FloatField(default=0.0)       # 0-100

    # Attempt tracking
    attempts            = models.IntegerField(default=0)
    successful_attempts = models.IntegerField(default=0)
    mistakes            = models.IntegerField(default=0)
    repeated_mistakes   = models.IntegerField(default=0)  # same mistake >1x

    # Derived flags
    needs_revision = models.BooleanField(default=False)
    mastery_state  = models.CharField(
        max_length=20,
        choices=MASTERY_STATE_CHOICES,
        default='not_started'
    )

    # Recent mistake tags for the AI mentor
    recent_mistake_tags = models.JSONField(default=list, blank=True)

    last_studied = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table         = 'learning_concept_mastery'
        unique_together  = ('user', 'concept')
        verbose_name     = 'Concept Mastery'
        verbose_name_plural = 'Concept Masteries'

    def __str__(self):
        return f'{self.user.email} → {self.concept.name} ({self.mastery_state})'

    def compute_mastery_state(self) -> str:
        """Derive the mastery state from raw scores."""
        if self.attempts == 0:
            return 'not_started'
        if self.repeated_mistakes >= 3:
            return 'critical'
        if self.mastery_score >= 75:
            return 'strong'
        if self.mastery_score >= 45:
            return 'developing'
        return 'weak'

    def record_attempt(self, success: bool, mistake_tags: list[str] | None = None) -> None:
        """
        Record the result of one attempt and update all derived fields.
        Called from the assessment submission pipeline.
        """
        from django.utils import timezone

        self.attempts += 1
        if success:
            self.successful_attempts += 1
            # Increase mastery score (diminishing returns)
            gain = max(5.0, (100 - self.mastery_score) * 0.15)
            self.mastery_score = min(100.0, self.mastery_score + gain)
            self.confidence = min(100.0, self.confidence + 5.0)
        else:
            self.mistakes += 1
            # Detect repeated mistake
            if mistake_tags:
                overlap = set(mistake_tags) & set(self.recent_mistake_tags)
                if overlap:
                    self.repeated_mistakes += len(overlap)
                self.recent_mistake_tags = list(set(self.recent_mistake_tags) | set(mistake_tags))[-10:]

            loss = min(15.0, self.mastery_score * 0.10)
            self.mastery_score = max(0.0, self.mastery_score - loss)
            self.confidence = max(0.0, self.confidence - 8.0)

        self.mastery_state = self.compute_mastery_state()
        self.needs_revision = self.mastery_state in ('weak', 'critical')
        self.last_studied = timezone.now()
        self.save()
