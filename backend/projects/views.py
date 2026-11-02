import os
import zipfile
import tempfile
import logging
import json
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Project, ProjectVersion, FileAnalysis
from .serializers import ProjectSerializer, ProjectDetailSerializer, ProjectVersionSerializer
from mentor.ollama_client import chat_completion, is_ollama_available

logger = logging.getLogger(__name__)


class ProjectListView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class ProjectAnalyzeView(APIView):
    """
    Analyzes project code using Ollama or heuristic analysis,
    generating quality score, summary, issues, and actionable suggestions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk, user=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        submitted_code = request.data.get('code')
        if submitted_code is not None:
            project.code = submitted_code
            project.save(update_fields=['code'])

        code_to_review = project.code or ''
        lang = project.language or 'python'

        analysis_data = {
            'summary': '',
            'issues': [],
            'suggestions': [],
            'score': 80
        }

        if is_ollama_available() and code_to_review.strip():
            prompt = f"""You are a senior code reviewer analyzing a student's {lang} software project.
Review the following code for architecture, performance, error handling, and best practices.

```{lang}
{code_to_review[:3500]}
```

Provide your feedback ONLY in pure JSON with keys:
- "summary": string (2-3 sentences assessing overall quality)
- "issues": array of strings (specific bugs, anti-patterns, or edge cases)
- "suggestions": array of strings (actionable refactoring steps)
- "score": number from 0 to 100

Do not wrap with commentary. Output valid JSON only.
"""
            try:
                response = chat_completion([{'role': 'user', 'content': prompt}])
                clean = response.strip()
                import re
                fence = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', clean, re.DOTALL)
                if fence:
                    parsed = json.loads(fence.group(1))
                else:
                    start = clean.find('{')
                    end = clean.rfind('}')
                    if start != -1 and end != -1:
                        parsed = json.loads(clean[start:end+1])
                    else:
                        parsed = json.loads(clean)

                analysis_data['summary'] = parsed.get('summary', 'Code analyzed successfully.')
                analysis_data['issues'] = parsed.get('issues', [])
                analysis_data['suggestions'] = parsed.get('suggestions', [])
                analysis_data['score'] = int(parsed.get('score', 80))
            except Exception as e:
                logger.error(f"AI project analysis failed: {e}")
                analysis_data = self._fallback_analysis(code_to_review, lang)
        else:
            analysis_data = self._fallback_analysis(code_to_review, lang)

        # Record a project version milestone if quality score was determined
        try:
            version = ProjectVersion.objects.create(
                project=project,
                quality_score=analysis_data['score'],
                summary_feedback=analysis_data['summary']
            )
            analysis_data['version_num'] = version.version_num
        except Exception as e:
            logger.warning(f"Could not record version: {e}")

        return Response(analysis_data, status=status.HTTP_200_OK)

    def _fallback_analysis(self, code, lang):
        issues = []
        suggestions = []
        lines = code.splitlines()
        score = 85

        if len(lines) < 5:
            issues.append("Project codebase is very minimal. Add core functionality.")
            suggestions.append("Structure the program into modular functions or classes.")
            score = 65
        else:
            if 'try:' not in code and 'except' not in code:
                issues.append("Lack of error handling or defensive exception blocks.")
                suggestions.append("Wrap external I/O and user input in try-except blocks.")
                score -= 10
            if 'def ' not in code and 'class ' not in code:
                issues.append("Procedural script without reusable functions or abstractions.")
                suggestions.append("Decompose routines into single-responsibility functions.")
                score -= 10
            if 'print(' in code and len([l for l in lines if 'print(' in l]) > 4:
                suggestions.append("Consider replacing repetitive print statements with proper logging.")
            if not suggestions:
                suggestions.append("Add unit tests and docstrings to document module behavior.")

        return {
            'summary': f"Clean initial {lang} implementation with room for modular architecture and error handling.",
            'issues': issues if issues else ["No major syntax blockers detected."],
            'suggestions': suggestions if suggestions else ["Maintain consistent naming conventions and modularity."],
            'score': max(50, score)
        }



class UploadProjectVersionView(APIView):
    """
    Accepts a ZIP file, extracts it, analyzes the Python code using Ollama,
    and saves the AI feedback.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        zip_obj = request.FILES.get('file')
        if not zip_obj or not zip_obj.name.endswith('.zip'):
            return Response({'error': 'Please upload a valid .zip file.'}, status=status.HTTP_400_BAD_REQUEST)

        version = ProjectVersion.objects.create(project=project, zip_file=zip_obj)

        if not is_ollama_available():
            version.summary_feedback = "AI Review unavailable. Ollama is offline."
            version.save()
            return Response(ProjectVersionSerializer(version).data, status=status.HTTP_201_CREATED)

        # Process the ZIP file
        files_to_analyze = []
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                with zipfile.ZipFile(zip_obj, 'r') as zip_ref:
                    zip_ref.extractall(tmpdir)
                    
                    for root, _, files in os.walk(tmpdir):
                        for file in files:
                            if file.endswith('.py') and not file.startswith('__'):
                                file_path = os.path.join(root, file)
                                rel_path = os.path.relpath(file_path, tmpdir)
                                
                                # Skip common ignored directories
                                if any(x in rel_path for x in ['venv', 'env', '.git', 'migrations']):
                                    continue
                                    
                                with open(file_path, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    if content.strip():
                                        files_to_analyze.append({'path': rel_path, 'content': content})
            except zipfile.BadZipFile:
                return Response({'error': 'Corrupt zip file.'}, status=status.HTTP_400_BAD_REQUEST)

        # Analyze files (limit to 5 for speed in prototype)
        files_to_analyze = files_to_analyze[:5]
        total_score = 0

        for f_data in files_to_analyze:
            prompt = f"""Review this Python file for code quality, readability, and performance.
File: {f_data['path']}

Code:
```python
{f_data['content'][:2000]}  # Trucated to avoid context limit
```

Provide your feedback in pure JSON format:
{{
  "score": 85,
  "feedback": "Your concise feedback here..."
}}
"""
            try:
                response = chat_completion([{'role': 'user', 'content': prompt}])
                
                # Parse JSON
                clean_text = response.strip()
                if clean_text.startswith('```json'):
                    clean_text = clean_text[7:]
                if clean_text.endswith('```'):
                    clean_text = clean_text[:-3]
                    
                result = json.loads(clean_text)
                score = float(result.get('score', 50))
                feedback = result.get('feedback', 'No feedback provided.')
            except Exception as e:
                logger.error(f"Failed to analyze file: {e}")
                score = 50.0
                feedback = "Failed to generate AI feedback."

            total_score += score
            FileAnalysis.objects.create(
                version=version,
                file_path=f_data['path'],
                content=f_data['content'],
                feedback=feedback,
                score=score
            )

        if files_to_analyze:
            version.quality_score = total_score / len(files_to_analyze)
            if version.quality_score > 80:
                version.summary_feedback = "Great job! Code quality is high overall."
            elif version.quality_score > 60:
                version.summary_feedback = "Good work, but there is room for improvement in some areas."
            else:
                version.summary_feedback = "Several files need refactoring. Review the file-specific feedback."
        else:
            version.summary_feedback = "No valid Python files found to analyze."

        version.save()
        return Response(ProjectVersionSerializer(version).data, status=status.HTTP_201_CREATED)
