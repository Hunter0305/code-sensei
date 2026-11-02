"""Learning app admin registration."""
from django.contrib import admin
from .models import Concept, ConceptMastery


@admin.register(Concept)
class ConceptAdmin(admin.ModelAdmin):
    list_display  = ['name', 'language', 'category', 'difficulty']
    list_filter   = ['language', 'category', 'difficulty']
    search_fields = ['name', 'description']
    filter_horizontal = ['prerequisites']


@admin.register(ConceptMastery)
class ConceptMasteryAdmin(admin.ModelAdmin):
    list_display  = ['user', 'concept', 'mastery_state', 'mastery_score', 'attempts', 'updated_at']
    list_filter   = ['mastery_state', 'needs_revision', 'concept__language']
    search_fields = ['user__email', 'concept__name']
    readonly_fields = ['created_at', 'updated_at']
