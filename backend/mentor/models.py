"""
Mentor Models — Conversation and Message history
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

AGENT_CHOICES = [
    ('professor',       'Professor'),
    ('senior_engineer', 'Senior Engineer'),
    ('debug_specialist','Debug Specialist'),
    ('interviewer',     'Interviewer'),
]

HINT_LEVEL_CHOICES = [(i, f'Level {i}') for i in range(1, 6)]


class Conversation(models.Model):
    """A persistent chat session between a student and one AI agent."""

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    agent_id   = models.CharField(max_length=30, choices=AGENT_CHOICES, default='professor')
    title      = models.CharField(max_length=200, blank=True, default='')
    topic      = models.CharField(max_length=200, blank=True, default='')

    # Hint progression
    hint_level = models.IntegerField(default=1, choices=HINT_LEVEL_CHOICES)

    # Code context (the code being discussed in this session)
    code_context = models.TextField(blank=True, default='')
    language     = models.CharField(max_length=50, default='python')

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'mentor_conversation'
        ordering  = ['-updated_at']

    def __str__(self):
        return f'{self.user.email} → {self.agent_id} ({self.title or "Untitled"})'

    def get_message_history(self) -> list[dict]:
        """Return the conversation as a list of Ollama-compatible message dicts."""
        return [
            {'role': msg.role, 'content': msg.content}
            for msg in self.messages.order_by('created_at')
        ]

    def auto_title(self) -> str:
        """Generate a title from the first user message if none set."""
        first = self.messages.filter(role='user').first()
        if first:
            return first.content[:80] + ('…' if len(first.content) > 80 else '')
        return 'New conversation'


class Message(models.Model):
    """A single message in a conversation (user or assistant)."""

    ROLE_CHOICES = [
        ('user',      'User'),
        ('assistant', 'Assistant'),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    role    = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()

    # Metadata
    hint_level_at_send = models.IntegerField(default=1)
    tokens_used        = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mentor_message'
        ordering = ['created_at']

    def __str__(self):
        return f'[{self.role}] {self.content[:60]}'


class AgentFacultyNote(models.Model):
    """
    Shared memory / faculty board between the 4 AI mentors about a student.
    When one mentor notices a strength, weakness, or milestone, they leave a note
    for the other mentors to read, reference, and collaborate on.
    """
    NOTE_TYPE_CHOICES = [
        ('observation',    'Observation'),
        ('recommendation', 'Recommendation'),
        ('praise',         'Praise'),
        ('alert',          'Needs Attention'),
    ]

    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='faculty_notes')
    author_agent = models.CharField(max_length=30, choices=AGENT_CHOICES)
    target_agent = models.CharField(max_length=30, blank=True, default='')
    topic        = models.CharField(max_length=200, blank=True, default='')
    note_type    = models.CharField(max_length=30, choices=NOTE_TYPE_CHOICES, default='observation')
    content      = models.TextField()

    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mentor_faculty_note'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.author_agent}] {self.content[:60]}'

    def get_author_emoji(self) -> str:
        from .agents import MENTOR_AGENTS
        return MENTOR_AGENTS.get(self.author_agent, {}).get('emoji', '🤖')

    def get_author_name(self) -> str:
        from .agents import MENTOR_AGENTS
        return MENTOR_AGENTS.get(self.author_agent, {}).get('name', self.author_agent)
