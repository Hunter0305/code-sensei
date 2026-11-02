from rest_framework import serializers
from .models import LearningRoadmap, RoadmapNode


class RoadmapNodeSerializer(serializers.ModelSerializer):
    concept_name = serializers.CharField(source='concept.name', read_only=True)
    concept_id = serializers.IntegerField(source='concept.id', read_only=True)
    concept_difficulty = serializers.IntegerField(source='concept.difficulty', read_only=True)
    title = serializers.CharField(source='concept.name', read_only=True)
    description = serializers.CharField(source='ai_rationale', read_only=True)
    estimated_time = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapNode
        fields = [
            'id', 'concept_id', 'concept_name', 'concept_difficulty',
            'order', 'ai_rationale', 'estimated_hours', 'status',
            'title', 'description', 'estimated_time'
        ]

    def get_estimated_time(self, obj):
        hours = obj.estimated_hours
        if hours == 1.0:
            return "1 hr"
        elif hours.is_integer():
            return f"{int(hours)} hrs"
        return f"{hours} hrs"


class LearningRoadmapSerializer(serializers.ModelSerializer):
    nodes = RoadmapNodeSerializer(many=True, read_only=True)
    steps = RoadmapNodeSerializer(source='nodes', many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    total_steps = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()

    class Meta:
        model = LearningRoadmap
        fields = [
            'id', 'title', 'goal', 'is_active', 'created_at',
            'nodes', 'steps', 'progress_percentage', 'total_steps', 'completed_steps'
        ]

    def get_progress_percentage(self, obj):
        total = obj.nodes.count()
        if total == 0:
            return 0
        completed = obj.nodes.filter(status='completed').count()
        return round((completed / total) * 100)

    def get_total_steps(self, obj):
        return obj.nodes.count()

    def get_completed_steps(self, obj):
        return obj.nodes.filter(status='completed').count()

