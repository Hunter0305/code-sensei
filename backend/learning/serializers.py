"""
Learning Serializers — Concept graph and mastery data
"""
from rest_framework import serializers
from .models import Concept, ConceptMastery


class ConceptSerializer(serializers.ModelSerializer):
    """Full concept info for the graph."""
    prerequisite_ids = serializers.PrimaryKeyRelatedField(
        source='prerequisites', many=True, read_only=True
    )

    class Meta:
        model  = Concept
        fields = [
            'id', 'name', 'language', 'category', 'description',
            'difficulty', 'prerequisite_ids', 'graph_x', 'graph_y',
        ]


class ConceptMasterySerializer(serializers.ModelSerializer):
    """Mastery state for one concept."""
    concept_id   = serializers.IntegerField(source='concept.id',   read_only=True)
    concept_name = serializers.CharField(source='concept.name',    read_only=True)
    category     = serializers.CharField(source='concept.category', read_only=True)
    difficulty   = serializers.IntegerField(source='concept.difficulty', read_only=True)

    class Meta:
        model  = ConceptMastery
        fields = [
            'id', 'concept_id', 'concept_name', 'category', 'difficulty',
            'mastery_score', 'confidence', 'mastery_state',
            'attempts', 'successful_attempts', 'mistakes', 'repeated_mistakes',
            'needs_revision', 'recent_mistake_tags', 'last_studied', 'updated_at',
        ]
        read_only_fields = [
            'id', 'concept_id', 'concept_name', 'category', 'difficulty',
            'mastery_state', 'needs_revision', 'updated_at',
        ]


class GraphNodeSerializer(serializers.ModelSerializer):
    """
    Concept node enriched with the requesting user's mastery data.
    Used for the /graph/ endpoint.
    """
    prerequisites  = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    mastery_score  = serializers.SerializerMethodField()
    confidence     = serializers.SerializerMethodField()
    mastery_state  = serializers.SerializerMethodField()
    needs_revision = serializers.SerializerMethodField()
    attempts       = serializers.SerializerMethodField()

    class Meta:
        model  = Concept
        fields = [
            'id', 'name', 'language', 'category', 'description', 'difficulty',
            'prerequisites', 'graph_x', 'graph_y',
            # Mastery overlay
            'mastery_score', 'confidence', 'mastery_state', 'needs_revision', 'attempts',
        ]

    def _mastery(self, obj):
        """Get the mastery record from context (pre-fetched)."""
        mastery_map = self.context.get('mastery_map', {})
        return mastery_map.get(obj.id)

    def get_mastery_score(self, obj):
        m = self._mastery(obj)
        return round(m.mastery_score, 1) if m else 0.0

    def get_confidence(self, obj):
        m = self._mastery(obj)
        return round(m.confidence, 1) if m else 0.0

    def get_mastery_state(self, obj):
        m = self._mastery(obj)
        return m.mastery_state if m else 'not_started'

    def get_needs_revision(self, obj):
        m = self._mastery(obj)
        return m.needs_revision if m else False

    def get_attempts(self, obj):
        m = self._mastery(obj)
        return m.attempts if m else 0


class GraphEdgeSerializer(serializers.Serializer):
    """An edge (prerequisite relationship) between two concept nodes."""
    source = serializers.IntegerField()
    target = serializers.IntegerField()


class RecordAttemptSerializer(serializers.Serializer):
    """Payload for recording a problem attempt."""
    success      = serializers.BooleanField()
    mistake_tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list
    )


class UpdateMasterySerializer(serializers.ModelSerializer):
    """Directly update mastery score (admin / tutor override)."""

    class Meta:
        model  = ConceptMastery
        fields = ['mastery_score', 'confidence']
