from rest_framework import serializers
from .models import Project, ProjectVersion, FileAnalysis


class FileAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileAnalysis
        fields = ['id', 'file_path', 'content', 'feedback', 'score']


class ProjectVersionSerializer(serializers.ModelSerializer):
    file_analyses = FileAnalysisSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectVersion
        fields = ['id', 'version_num', 'quality_score', 'summary_feedback', 'created_at', 'file_analyses']


class ProjectSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', required=False)
    latest_version = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'title', 'description', 'language', 'status', 'code',
            'created_at', 'updated_at', 'latest_version', 'version_count'
        ]
        extra_kwargs = {
            'name': {'required': False},
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'title' in data and 'name' not in data:
            data['name'] = data['title']
        elif 'name' in data and 'title' not in data:
            data['title'] = data['name']
        return super().to_internal_value(data)

    def validate(self, attrs):
        if not attrs.get('name'):
            raise serializers.ValidationError({'title': 'Project name is required.'})
        return attrs

    def get_latest_version(self, obj):
        latest = obj.versions.order_by('-version_num').first()
        if latest:
            return ProjectVersionSerializer(latest).data
        return None

    def get_version_count(self, obj):
        return obj.versions.count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', read_only=True)
    versions = ProjectVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'title', 'description', 'language', 'status', 'code',
            'created_at', 'updated_at', 'versions'
        ]

