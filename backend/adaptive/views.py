import json
import logging
import re
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LearningRoadmap, RoadmapNode
from .serializers import LearningRoadmapSerializer, RoadmapNodeSerializer
from learning.models import ConceptMastery, Concept
from mentor.ollama_client import chat_completion, is_ollama_available

logger = logging.getLogger(__name__)


class ActiveRoadmapView(generics.RetrieveAPIView):
    """Get the currently active roadmap for the user."""
    serializer_class = LearningRoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return LearningRoadmap.objects.filter(user=self.request.user, is_active=True).first()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response(
                {
                    'message': 'No active roadmap found.',
                    'nodes': [],
                    'steps': [],
                    'total_steps': 0,
                    'completed_steps': 0,
                    'progress_percentage': 0,
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class GenerateRoadmapView(APIView):
    """
    Generate a new personalized roadmap based on ConceptMastery and curriculum prerequisites.
    Uses Ollama to determine the optimal learning path and rationale.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        raw_goal = request.data.get('goal', 'Improve general programming skills')
        goal = raw_goal.strip() if isinstance(raw_goal, str) and raw_goal.strip() else 'Improve general programming skills'

        # 1. Gather Weak/Not Started Concepts
        masteries = ConceptMastery.objects.filter(
            user=user, 
            needs_revision=True
        ).select_related('concept')
        weak_concepts = [m.concept for m in masteries]
        
        # If no weak concepts, get not started ones
        if not weak_concepts:
            masteries = ConceptMastery.objects.filter(
                user=user,
                mastery_state='not_started'
            ).select_related('concept')[:6]
            weak_concepts = [m.concept for m in masteries]

        # If still empty, find concepts user hasn't mastered yet
        if not weak_concepts:
            mastered_ids = ConceptMastery.objects.filter(
                user=user, 
                mastery_state='mastered'
            ).values_list('concept_id', flat=True)
            weak_concepts = list(Concept.objects.exclude(id__in=mastered_ids).order_by('difficulty')[:6])

        # Final fallback to foundational concepts
        if not weak_concepts:
            weak_concepts = list(Concept.objects.all().order_by('difficulty')[:6])

        concept_names = [c.name for c in weak_concepts]

        # 2. Try Ollama for AI generation
        roadmap_plan = []
        if is_ollama_available():
            prompt = f"""You are an expert programming mentor creating a customized learning roadmap.
The student's target goal is: "{goal}"
They need to study these concepts in logical pedagogical order: {', '.join(concept_names)}

Create a step-by-step learning progression ordered from foundational prerequisites to advanced application.
For each concept, write a short, encouraging 1-2 sentence rationale explaining why this step is vital for their goal.

Output MUST be a JSON array of objects with keys "concept", "rationale", and "estimated_hours".
Do NOT output any markdown commentary or text outside the JSON array.
Example:
[
  {{"concept": "{concept_names[0]}", "rationale": "Essential foundation for building clean code and data pipelines.", "estimated_hours": 1.5}}
]
"""
            try:
                response_text = chat_completion([{'role': 'user', 'content': prompt}])
                roadmap_plan = self._extract_json_plan(response_text)
                if not roadmap_plan or not isinstance(roadmap_plan, list):
                    logger.warning("AI did not return a valid list, falling back to heuristic plan.")
                    roadmap_plan = self._fallback_plan(weak_concepts, goal)
            except Exception as e:
                logger.error(f"Failed to generate roadmap with AI: {e}")
                roadmap_plan = self._fallback_plan(weak_concepts, goal)
        else:
            roadmap_plan = self._fallback_plan(weak_concepts, goal)

        # 3. Save to DB
        roadmap = LearningRoadmap.objects.create(
            user=user,
            title=f"Roadmap to {goal}"[:200],
            goal=goal,
            is_active=True
        )
        roadmap.disable_others()

        # Create nodes
        for idx, step in enumerate(roadmap_plan):
            if not isinstance(step, dict):
                continue
            concept_name = step.get('concept', '')
            concept = None
            try:
                concept = Concept.objects.get(name__iexact=concept_name)
            except Concept.DoesNotExist:
                # Partial match or fallback
                concept = Concept.objects.filter(name__icontains=concept_name).first()
                if not concept and idx < len(weak_concepts):
                    concept = weak_concepts[idx]
            
            if not concept:
                continue

            # First node is in_progress by default, subsequent are pending
            initial_status = 'in_progress' if idx == 0 else 'pending'

            try:
                est_hours = float(step.get('estimated_hours', 1.5))
            except (ValueError, TypeError):
                est_hours = 1.5

            RoadmapNode.objects.create(
                roadmap=roadmap,
                concept=concept,
                order=idx + 1,
                ai_rationale=step.get('rationale', f'Mastering {concept.name} is a key milestone.'),
                estimated_hours=est_hours,
                status=initial_status
            )

        serializer = LearningRoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _extract_json_plan(self, text):
        clean = text.strip()
        # Look for markdown code fence
        fence_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', clean, re.DOTALL)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except Exception:
                pass
        
        # Look for raw array brackets
        start = clean.find('[')
        end = clean.rfind(']')
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(clean[start:end+1])
            except Exception:
                pass

        return json.loads(clean)

    def _fallback_plan(self, concepts, goal):
        """Heuristic curriculum fallback if AI fails or Ollama is offline."""
        concepts.sort(key=lambda x: x.difficulty)
        tailored_reasons = {
            "Variables & Data Types": f"Understanding variables and data types is the fundamental baseline to {goal}.",
            "Control Flow": f"Conditional branching and decision logic control execution flow required for {goal}.",
            "Loops": f"Iterative patterns and sequence traversal empower efficient computation.",
            "Functions": f"Modular, reusable functions keep your codebase scalable and clean as you pursue {goal}.",
            "Lists": f"Sequential collection storage and slice operations allow dynamic data manipulation.",
            "Dictionaries & Sets": f"Fast O(1) key-value mapping and uniqueness sets are vital for real-world projects.",
            "Object-Oriented Programming": f"Designing scalable domain models using classes, encapsulation, and methods.",
            "Recursion": f"Thinking inductively to decompose complex divide-and-conquer problems.",
            "Stacks & Queues": f"Fundamental linear buffers used across parsing, graph search, and async pipelines.",
            "Linked Lists": f"Understanding pointer-based node references and dynamic memory chaining.",
            "Trees & Binary Search Trees": f"Hierarchical data structures, recursive traversals, and logarithmic lookups.",
            "Sorting Algorithms": f"Understanding comparative analysis, divide-and-conquer, and Big-O efficiency.",
            "Searching Algorithms": f"Binary search and logarithmic search space optimization.",
            "Graphs & Graph Algorithms": f"Modeling relational networks, shortest paths, and topological dependencies.",
            "Dynamic Programming": f"Mastering memoization and optimal substructure for advanced competitive problems."
        }
        plan = []
        for c in concepts[:6]:
            rationale = tailored_reasons.get(
                c.name,
                f"Mastering {c.name} unlocks core prerequisite competencies needed to achieve: {goal}."
            )
            plan.append({
                'concept': c.name,
                'rationale': rationale,
                'estimated_hours': max(1.0, float(c.difficulty * 0.8))
            })
        return plan


class RoadmapRootView(APIView):
    """
    Combined root endpoint for `/api/adaptive/roadmap/`:
    - GET: Returns active roadmap or 404 message
    - POST: Generates a new roadmap
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmap = LearningRoadmap.objects.filter(user=request.user, is_active=True).first()
        if not roadmap:
            return Response(
                {
                    'message': 'No active roadmap found.',
                    'nodes': [],
                    'steps': [],
                    'total_steps': 0,
                    'completed_steps': 0,
                    'progress_percentage': 0,
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = LearningRoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        gen_view = GenerateRoadmapView()
        return gen_view.post(request)


class RoadmapNodeUpdateView(APIView):
    """
    Update the status of a specific RoadmapNode.
    Status can be: 'pending' | 'in_progress' | 'completed'
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        return self._update_node(request, pk)

    def post(self, request, pk):
        return self._update_node(request, pk)

    def _update_node(self, request, pk):
        try:
            node = RoadmapNode.objects.select_related('roadmap', 'concept').get(
                pk=pk, 
                roadmap__user=request.user
            )
        except RoadmapNode.DoesNotExist:
            return Response({'error': 'Roadmap step not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['pending', 'in_progress', 'completed']:
            return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

        node.status = new_status
        node.save(update_fields=['status'])

        # Auto-unlock next node if this one was completed
        if new_status == 'completed':
            next_node = RoadmapNode.objects.filter(
                roadmap=node.roadmap,
                order__gt=node.order,
                status='pending'
            ).order_by('order').first()
            if next_node:
                next_node.status = 'in_progress'
                next_node.save(update_fields=['status'])

        serializer = LearningRoadmapSerializer(node.roadmap)
        return Response(serializer.data, status=status.HTTP_200_OK)

