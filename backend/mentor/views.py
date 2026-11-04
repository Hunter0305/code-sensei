"""
Mentor Views — Conversation management + Ollama-powered chat
"""
import logging
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message, AgentFacultyNote
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    CreateConversationSerializer,
    SendMessageSerializer,
    FacultyNoteSerializer,
)
from .agents import (
    list_agents,
    get_agent,
    build_system_message,
    build_mastery_context,
)
from .ollama_client import (
    chat_completion,
    chat_completion_stream,
    is_ollama_available,
)

logger = logging.getLogger(__name__)


# ── Agent list ────────────────────────────────────────────────

class AgentListView(APIView):
    """Return the four available AI mentor agents."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        agents = list_agents()
        ollama_up = is_ollama_available()
        return Response({
            'agents':        agents,
            'ollama_online': ollama_up,
            'model':         getattr(settings, 'OLLAMA_MODEL', 'llama3'),
        })


# ── Conversation CRUD ─────────────────────────────────────────

class ConversationListCreateView(generics.ListCreateAPIView):
    """List all conversations or start a new one."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateConversationSerializer
        return ConversationListSerializer

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(user=self.request.user)
            .prefetch_related('messages')
            .order_by('-updated_at')
        )

    def create(self, request, *args, **kwargs):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        agent_id = serializer.validated_data.get('agent_id', 'professor')
        if not get_agent(agent_id):
            return Response(
                {'error': f'Unknown agent: {agent_id}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conversation = serializer.save(user=request.user)
        return Response(
            ConversationDetailSerializer(conversation).data,
            status=status.HTTP_201_CREATED
        )


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    """Get or delete a specific conversation."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ConversationDetailSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        conv = self.get_object()
        conv.messages.all().delete()
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Chat ──────────────────────────────────────────────────────

class SendMessageView(APIView):
    """
    POST a user message and get an AI mentor response.
    Supports streaming (SSE) when ?stream=true is passed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_content = serializer.validated_data['content']
        code_ctx     = serializer.validated_data.get('code_context', '')

        # Update code context on conversation if provided
        if code_ctx:
            conversation.code_context = code_ctx
            conversation.save(update_fields=['code_context', 'updated_at'])

        # Build message content (include code if provided)
        full_content = user_content
        if code_ctx and code_ctx.strip() not in user_content:
            full_content = f'{user_content}\n\n```{conversation.language}\n{code_ctx}\n```'

        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            role='user',
            content=full_content,
            hint_level_at_send=conversation.hint_level,
        )

        # Auto-set title from first message
        if not conversation.title:
            conversation.title = conversation.auto_title()
            conversation.save(update_fields=['title'])

        # Build rich student intelligence dossier for system prompt
        mastery_ctx = build_mastery_context(request.user, current_agent_id=conversation.agent_id)

        # Build full message list for Ollama with active hint scaffolding
        system_msg = build_system_message(conversation.agent_id, mastery_ctx, hint_level=conversation.hint_level)
        history    = conversation.get_message_history()
        messages   = [system_msg] + history

        # ── Streaming response ──
        if request.query_params.get('stream') == 'true':
            return self._stream_response(conversation, messages, user_content)

        # ── Synchronous response ──
        return self._sync_response(conversation, messages, user_content)

    def _sync_response(self, conversation: Conversation, messages: list, user_content: str = '') -> Response:
        """Full blocking response — waits for Ollama to finish."""
        try:
            ai_content = chat_completion(messages)
        except (ConnectionError, ValueError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        ai_msg = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=ai_content,
            hint_level_at_send=conversation.hint_level,
        )
        conversation.save(update_fields=['updated_at'])

        # Save progress, award XP and log collaborative note between mentors
        record_learning_progress_and_faculty_notes(
            user=conversation.user,
            conversation=conversation,
            user_text=user_content,
            ai_text=ai_content,
        )

        return Response({
            'message': {
                'id':         ai_msg.id,
                'role':       'assistant',
                'content':    ai_content,
                'created_at': ai_msg.created_at,
            },
            'conversation_id': conversation.id,
            'hint_level':      conversation.hint_level,
        })

    def _stream_response(self, conversation: Conversation, messages: list, user_content: str = '') -> StreamingHttpResponse:
        """Server-Sent Events streaming response."""
        collected = []

        def generate():
            import json
            try:
                for chunk in chat_completion_stream(messages):
                    collected.append(chunk)
                    # SSE format
                    yield f'data: {json.dumps({"chunk": chunk})}\n\n'
            finally:
                # Save full assembled message after streaming completes
                full_content = ''.join(collected)
                if full_content:
                    Message.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=full_content,
                        hint_level_at_send=conversation.hint_level,
                    )
                    conversation.save(update_fields=['updated_at'])

                    # Save student progress, XP and generate shared faculty note
                    record_learning_progress_and_faculty_notes(
                        user=conversation.user,
                        conversation=conversation,
                        user_text=user_content,
                        ai_text=full_content,
                    )
                yield 'data: [DONE]\n\n'

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control']               = 'no-cache'
        response['X-Accel-Buffering']           = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        return response


# ── Hint escalation ───────────────────────────────────────────

class EscalateHintView(APIView):
    """Set or increase the hint level for a conversation (1 to 5)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_level = request.data.get('hint_level')
        if target_level is not None:
            try:
                target_level = int(target_level)
                if 1 <= target_level <= 5:
                    conversation.hint_level = target_level
                else:
                    return Response({'error': 'Hint level must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid hint level.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if conversation.hint_level < 5:
                conversation.hint_level += 1

        conversation.save(update_fields=['hint_level', 'updated_at'])

        # Build a hint escalation message automatically
        hint_prompts = {
            1: 'Can you guide me with conceptual analogies? Please do not write solution code yet.',
            2: 'Give me a small nudge — just a hint about what direction to think in or what data structure to use.',
            3: 'I need a bigger hint — outline the step-by-step algorithmic logic or pseudocode.',
            4: 'I am still stuck. Give me a code skeleton or scaffolding with placeholders.',
            5: 'Please walk me through the complete working solution and explain each part thoroughly.',
        }
        hint_text = hint_prompts.get(conversation.hint_level, 'Please give me more help.')

        level_labels = {
            1: 'Socratic Nudge',
            2: 'Directional Hint',
            3: 'Pseudocode / Logic',
            4: 'Code Skeleton',
            5: 'Full Solution',
        }

        return Response({
            'hint_level': conversation.hint_level,
            'hint_label': level_labels.get(conversation.hint_level, f'Level {conversation.hint_level}'),
            'hint_prompt': hint_text,
            'message': f'Hint level set to {conversation.hint_level}/5 ({level_labels.get(conversation.hint_level)}).',
        })


# ── Ollama health ─────────────────────────────────────────────

class OllamaHealthView(APIView):
    """Check if the local Ollama server is reachable."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        online = is_ollama_available()
        return Response({
            'ollama_online': online,
            'message': 'Ollama is running.' if online else 'Ollama is not reachable. Run `ollama serve` locally.',
        })


# ── Faculty Notes (Cross-Mentor Blackboard) ──────────────────

class FacultyNoteListCreateView(generics.ListCreateAPIView):
    """
    List all faculty notes written by AI mentors about the current student,
    or manually create a note.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FacultyNoteSerializer

    def get_queryset(self):
        return AgentFacultyNote.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def record_learning_progress_and_faculty_notes(user, conversation: Conversation, user_text: str, ai_text: str):
    """
    Persists student learning progress, awards XP, updates streaks,
    and logs collaborative mentor faculty notes when milestones or insights occur.
    """
    from django.utils import timezone
    from accounts.models import StudentProfile
    from learning.models import Concept, ConceptMastery
    from .models import AgentFacultyNote

    # 1. Update Student Profile (XP & Activity timestamp)
    try:
        profile, _ = StudentProfile.objects.get_or_create(user=user)
        profile.total_xp += 10
        profile.last_active = timezone.now()
        profile.save(update_fields=['total_xp', 'last_active'])
    except Exception as e:
        logger.warning('Failed to update student profile progress: %s', e)

    # 2. Check concept link in learning knowledge graph
    try:
        query_text = f"{conversation.topic} {user_text}".lower()
        matched_concept = None
        for concept in Concept.objects.all():
            if concept.name.lower() in query_text:
                matched_concept = concept
                break

        if matched_concept:
            mastery, _ = ConceptMastery.objects.get_or_create(user=user, concept=matched_concept)
            mastery.attempts += 1
            mastery.mastery_score = min(100.0, mastery.mastery_score + 4.0)
            mastery.confidence = min(100.0, mastery.confidence + 3.0)
            mastery.last_studied = timezone.now()
            mastery.mastery_state = mastery.compute_mastery_state()
            mastery.save()
    except Exception as e:
        logger.warning('Failed to update concept mastery from mentor chat: %s', e)

    # 3. Create or update collaborative Faculty Note between agents
    try:
        recent_note = AgentFacultyNote.objects.filter(
            user=user,
            author_agent=conversation.agent_id,
            created_at__gte=timezone.now() - timezone.timedelta(minutes=10)
        ).first()

        if not recent_note and len(user_text.strip()) > 3:
            agent_id = conversation.agent_id
            topic = conversation.topic or conversation.title or 'Core Programming'
            user_sample = user_text.strip().replace('\n', ' ')[:70]

            note_content = ""
            note_type = "observation"
            target = ""

            if agent_id == 'professor':
                note_content = f"Guided {user.first_name or user.username} through foundations of '{topic}'. Student asked: \"{user_sample}\". Grasped conceptual intuition well."
                target = "senior_engineer"
                note_type = "recommendation"
            elif agent_id == 'senior_engineer':
                note_content = f"Code review on '{topic}'. Advised on clean architecture, readability, and DRY principles."
                target = "interviewer"
                note_type = "observation"
            elif agent_id == 'debug_specialist':
                note_content = f"Troubleshooting session on '{topic}'. Explored bug diagnosis around: \"{user_sample}\"."
                target = "professor"
                note_type = "alert"
            elif agent_id == 'interviewer':
                note_content = f"Technical problem drill on '{topic}'. Evaluated algorithmic approach and complexity analysis."
                target = "senior_engineer"
                note_type = "praise"
            else:
                note_content = f"Mentored student on '{topic}'."

            AgentFacultyNote.objects.create(
                user=user,
                author_agent=agent_id,
                target_agent=target,
                topic=topic[:100],
                note_type=note_type,
                content=note_content,
            )
    except Exception as e:
        logger.warning('Failed to record faculty note: %s', e)
