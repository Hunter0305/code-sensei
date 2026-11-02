"""
Learning Views — Concept Graph + Mastery API
"""
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Concept, ConceptMastery
from .serializers import (
    ConceptSerializer,
    ConceptMasterySerializer,
    GraphNodeSerializer,
    GraphEdgeSerializer,
    RecordAttemptSerializer,
    UpdateMasterySerializer,
)


class ConceptListView(generics.ListAPIView):
    """List all available concepts (optionally filtered by language)."""
    serializer_class   = ConceptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Concept.objects.prefetch_related('prerequisites').all()
        language = self.request.query_params.get('language')
        if language:
            qs = qs.filter(language=language)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class LearningGraphView(APIView):
    """
    Full graph payload for the Learning Memory Graph page.
    Returns nodes (concepts + mastery overlay) and edges (prerequisite links).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        language = request.query_params.get('language', 'python')
        concepts = (
            Concept.objects
            .filter(language=language)
            .prefetch_related('prerequisites')
        )

        # Pre-fetch all mastery records for this user in one query
        mastery_qs = ConceptMastery.objects.filter(
            user=request.user,
            concept__language=language
        )
        mastery_map = {m.concept_id: m for m in mastery_qs}

        # Build node list
        nodes = GraphNodeSerializer(
            concepts,
            many=True,
            context={'mastery_map': mastery_map, 'request': request}
        ).data

        # Build edge list from prerequisite relationships
        edges = []
        for concept in concepts:
            for prereq in concept.prerequisites.all():
                edges.append({'source': prereq.id, 'target': concept.id})

        # Aggregate stats
        total     = len(nodes)
        mastered  = sum(1 for n in nodes if n['mastery_state'] == 'strong')
        developing = sum(1 for n in nodes if n['mastery_state'] == 'developing')
        weak      = sum(1 for n in nodes if n['mastery_state'] in ('weak', 'critical'))
        not_started = sum(1 for n in nodes if n['mastery_state'] == 'not_started')

        return Response({
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total':       total,
                'mastered':    mastered,
                'developing':  developing,
                'weak':        weak,
                'not_started': not_started,
                'overall_mastery': round(
                    sum(n['mastery_score'] for n in nodes) / total, 1
                ) if total else 0.0,
            },
            'language': language,
        })


class MasteryListView(generics.ListAPIView):
    """List all concept masteries for the current user."""
    serializer_class   = ConceptMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ConceptMastery.objects
            .filter(user=self.request.user)
            .select_related('concept')
            .order_by('-updated_at')
        )


class MasteryDetailView(APIView):
    """Get or update mastery for a specific concept."""
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create(self, user, concept_id):
        try:
            concept = Concept.objects.get(pk=concept_id)
        except Concept.DoesNotExist:
            return None, None
        mastery, _ = ConceptMastery.objects.get_or_create(
            user=user, concept=concept
        )
        return concept, mastery

    def get(self, request, concept_id):
        _, mastery = self._get_or_create(request.user, concept_id)
        if mastery is None:
            return Response({'error': 'Concept not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ConceptMasterySerializer(mastery).data)

    def patch(self, request, concept_id):
        """Direct score override (tutor/system use)."""
        _, mastery = self._get_or_create(request.user, concept_id)
        if mastery is None:
            return Response({'error': 'Concept not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UpdateMasterySerializer(mastery, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        mastery = serializer.save()
        mastery.mastery_state = mastery.compute_mastery_state()
        mastery.needs_revision = mastery.mastery_state in ('weak', 'critical')
        mastery.save()
        return Response(ConceptMasterySerializer(mastery).data)


class RecordAttemptView(APIView):
    """
    Record the result of a problem attempt for a concept.
    Updates mastery score automatically using the scoring algorithm.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, concept_id):
        serializer = RecordAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            concept = Concept.objects.get(pk=concept_id)
        except Concept.DoesNotExist:
            return Response({'error': 'Concept not found.'}, status=status.HTTP_404_NOT_FOUND)

        mastery, _ = ConceptMastery.objects.get_or_create(
            user=request.user, concept=concept
        )
        mastery.record_attempt(
            success=serializer.validated_data['success'],
            mistake_tags=serializer.validated_data.get('mistake_tags', []),
        )

        return Response({
            'mastery': ConceptMasterySerializer(mastery).data,
            'message': (
                f"Mastery updated: {mastery.mastery_state} "
                f"({round(mastery.mastery_score, 1)}%)"
            ),
        })


class WeakConceptsView(generics.ListAPIView):
    """Return concepts that need the most attention for the current user."""
    serializer_class   = ConceptMasterySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ConceptMastery.objects
            .filter(
                user=self.request.user,
                needs_revision=True
            )
            .select_related('concept')
            .order_by('mastery_score')[:10]
        )


class ProgressAnalyticsView(APIView):
    """
    Returns rich learning progress analytics including:
    - Mastery counts (mastered, developing, weak, critical, not_started)
    - Average score and confidence
    - Category breakdown
    - Accuracy and total attempts
    - Recommended focus concepts
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        language = request.query_params.get('language', 'python')

        concepts = list(Concept.objects.filter(language=language))
        total_concepts = len(concepts)
        if total_concepts == 0:
            concepts = list(Concept.objects.all())
            total_concepts = len(concepts)

        masteries = ConceptMastery.objects.filter(user=user).select_related('concept')
        mastery_map = {m.concept_id: m for m in masteries}

        state_counts = {
            'mastered': 0,
            'developing': 0,
            'weak': 0,
            'critical': 0,
            'not_started': 0,
        }

        total_score = 0.0
        total_confidence = 0.0
        total_attempts = 0
        total_successes = 0
        total_repeated_mistakes = 0

        # Tier buckets
        tiers = {
            'Foundations': {'total': 0, 'mastered': 0, 'score_sum': 0},
            'Core Collections & Loops': {'total': 0, 'mastered': 0, 'score_sum': 0},
            'OOP & Architecture': {'total': 0, 'mastered': 0, 'score_sum': 0},
            'Data Structures & Algorithms': {'total': 0, 'mastered': 0, 'score_sum': 0},
        }

        for c in concepts:
            diff = c.difficulty
            if diff <= 1:
                tier_key = 'Foundations'
            elif diff == 2:
                tier_key = 'Core Collections & Loops'
            elif diff == 3:
                tier_key = 'OOP & Architecture'
            else:
                tier_key = 'Data Structures & Algorithms'

            tiers[tier_key]['total'] += 1

            m = mastery_map.get(c.id)
            if m:
                state = m.mastery_state
                state_counts[state] = state_counts.get(state, 0) + 1
                total_score += m.mastery_score
                total_confidence += m.confidence_score
                total_attempts += m.attempts_count
                total_successes += m.successful_attempts
                total_repeated_mistakes += m.repeated_mistakes_count
                tiers[tier_key]['score_sum'] += m.mastery_score
                if state == 'mastered':
                    tiers[tier_key]['mastered'] += 1
            else:
                state_counts['not_started'] += 1

        avg_mastery = round(total_score / total_concepts, 1) if total_concepts else 0
        avg_confidence = round(total_confidence / total_concepts, 1) if total_concepts else 0
        accuracy_rate = round((total_successes / total_attempts) * 100, 1) if total_attempts > 0 else 0

        tier_list = []
        for name, data in tiers.items():
            tot = data['total']
            tier_avg = round(data['score_sum'] / tot, 1) if tot > 0 else 0
            tier_list.append({
                'name': name,
                'total': tot,
                'mastered': data['mastered'],
                'average_score': tier_avg,
                'completion_pct': round((data['mastered'] / tot) * 100) if tot > 0 else 0,
            })

        needs_review = []
        for m in sorted(masteries, key=lambda x: x.mastery_score)[:4]:
            if m.mastery_state in ['weak', 'critical', 'developing']:
                needs_review.append({
                    'id': m.concept.id,
                    'name': m.concept.name,
                    'difficulty': m.concept.difficulty,
                    'state': m.mastery_state,
                    'score': round(m.mastery_score, 1),
                    'attempts': m.attempts_count,
                })

        return Response({
            'overview': {
                'total_concepts': total_concepts,
                'mastered_count': state_counts['mastered'],
                'developing_count': state_counts['developing'],
                'weak_count': state_counts['weak'],
                'critical_count': state_counts['critical'],
                'not_started_count': state_counts['not_started'],
                'average_mastery': avg_mastery,
                'average_confidence': avg_confidence,
                'total_attempts': total_attempts,
                'accuracy_rate': accuracy_rate,
                'repeated_mistakes': total_repeated_mistakes,
            },
            'tiers': tier_list,
            'needs_review': needs_review,
        })

