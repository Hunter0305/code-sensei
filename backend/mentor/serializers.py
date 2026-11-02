"""Mentor serializers."""
from rest_framework import serializers
from .models import Conversation, Message, AgentFacultyNote


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Message
        fields = ['id', 'role', 'content', 'hint_level_at_send', 'created_at']
        read_only_fields = fields


class ConversationListSerializer(serializers.ModelSerializer):
    last_message    = serializers.SerializerMethodField()
    message_count   = serializers.SerializerMethodField()
    agent_name      = serializers.SerializerMethodField()
    agent_emoji     = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = [
            'id', 'agent_id', 'agent_name', 'agent_emoji', 'title', 'topic',
            'hint_level', 'language', 'is_active',
            'created_at', 'updated_at', 'last_message', 'message_count',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'role': msg.role, 'content': msg.content[:120], 'created_at': msg.created_at}
        return None

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_agent_name(self, obj):
        from .agents import MENTOR_AGENTS
        return MENTOR_AGENTS.get(obj.agent_id, {}).get('name', obj.agent_id)

    def get_agent_emoji(self, obj):
        from .agents import MENTOR_AGENTS
        return MENTOR_AGENTS.get(obj.agent_id, {}).get('emoji', '🤖')


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages  = MessageSerializer(many=True, read_only=True)
    agent_info = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = [
            'id', 'agent_id', 'agent_info', 'title', 'topic',
            'hint_level', 'code_context', 'language',
            'is_active', 'created_at', 'updated_at', 'messages',
        ]

    def get_agent_info(self, obj):
        from .agents import MENTOR_AGENTS
        agent = MENTOR_AGENTS.get(obj.agent_id, {})
        return {k: v for k, v in agent.items() if k != 'system_prompt'}


class CreateConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Conversation
        fields = ['agent_id', 'topic', 'code_context', 'language']


class SendMessageSerializer(serializers.Serializer):
    content      = serializers.CharField(max_length=100000)
    code_context = serializers.CharField(required=False, allow_blank=True, default='', max_length=100000)


class FacultyNoteSerializer(serializers.ModelSerializer):
    author_name  = serializers.CharField(source='get_author_name', read_only=True)
    author_emoji = serializers.CharField(source='get_author_emoji', read_only=True)

    class Meta:
        model = AgentFacultyNote
        fields = [
            'id', 'author_agent', 'author_name', 'author_emoji',
            'target_agent', 'topic', 'note_type', 'content', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
