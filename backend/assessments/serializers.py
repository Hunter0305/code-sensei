from rest_framework import serializers
from .models import Problem, TestCase, Submission


class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ['id', 'input_data', 'expected_output', 'is_hidden', 'order']


class ProblemListSerializer(serializers.ModelSerializer):
    concept_name = serializers.CharField(source='concept.name', read_only=True)
    
    class Meta:
        model = Problem
        fields = ['id', 'title', 'slug', 'difficulty', 'concept_name']


class ProblemDetailSerializer(serializers.ModelSerializer):
    concept_name = serializers.CharField(source='concept.name', read_only=True)
    test_cases   = serializers.SerializerMethodField()
    
    class Meta:
        model = Problem
        fields = [
            'id', 'title', 'slug', 'description', 'difficulty',
            'concept', 'concept_name', 'starter_code', 'test_cases'
        ]

    def get_test_cases(self, obj):
        """Only return non-hidden test cases to the frontend."""
        cases = obj.test_cases.filter(is_hidden=False)
        return TestCaseSerializer(cases, many=True).data


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'problem', 'code', 'passed', 'execution_time_ms', 'error_message', 'created_at']
        read_only_fields = ['id', 'created_at']
