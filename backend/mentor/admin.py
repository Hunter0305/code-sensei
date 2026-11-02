"""Mentor app admin."""
from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model  = Message
    extra  = 0
    fields = ['role', 'content', 'hint_level_at_send', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['user', 'agent_id', 'title', 'hint_level', 'updated_at']
    list_filter   = ['agent_id', 'is_active']
    search_fields = ['user__email', 'title', 'topic']
    inlines       = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['conversation', 'role', 'hint_level_at_send', 'created_at']
    list_filter   = ['role']
