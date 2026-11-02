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
    Generate a new personalized roadmap based on ConceptMastery, stated student goal,
    and curriculum prerequisites. Uses Ollama or heuristic domain planning to guarantee
    a comprehensive 6-to-8 step milestone roadmap.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        raw_goal = request.data.get('goal', 'Improve general programming skills')
        goal = raw_goal.strip() if isinstance(raw_goal, str) and raw_goal.strip() else 'Improve general programming skills'

        # 1. Select a rich, goal-oriented candidate concept pool (6-10 concepts)
        candidate_concepts, weak_concepts = self._select_candidate_concepts(user, goal)
        candidate_names = [c.name for c in candidate_concepts]

        # 2. Determine default clean title
        default_title = self._clean_roadmap_title(goal)
        ai_title = None

        # 3. Generate Roadmap via Ollama or Fallback
        roadmap_plan = []
        if is_ollama_available():
            prompt = f"""You are an expert programming mentor creating a customized learning roadmap.
The student's target goal is: "{goal}"
Weak concepts needing review: {', '.join([c.name for c in weak_concepts]) if weak_concepts else 'None'}

Available concepts in curriculum (ordered from prerequisites to advanced):
{', '.join(candidate_names)}

Instructions:
1. Provide a professional, concise roadmap title (3-6 words, e.g. "1-Month DSA Interview Sprint").
2. Select between 6 and 8 concepts from the available concepts list above in optimal pedagogical order.
3. For each concept, write an encouraging 1-2 sentence rationale explaining why this step is vital for their target goal ("{goal}").
4. Assign realistic estimated study hours (between 1.5 and 4.0).

Output MUST be valid JSON only with keys "title" and "steps":
{{
  "title": "{default_title}",
  "steps": [
    {{"concept": "{candidate_names[0]}", "rationale": "Clear pedagogical explanation...", "estimated_hours": 2.0}}
  ]
}}
Do NOT output any markdown commentary or text outside the JSON.
"""
            try:
                response_text = chat_completion([{'role': 'user', 'content': prompt}])
                extracted_data = self._extract_json_plan(response_text)
                if isinstance(extracted_data, dict):
                    ai_title = extracted_data.get('title')
                    roadmap_plan = extracted_data.get('steps', [])
                elif isinstance(extracted_data, list):
                    roadmap_plan = extracted_data

                if not roadmap_plan or len(roadmap_plan) < 3:
                    logger.warning("AI returned insufficient steps, falling back to heuristic plan.")
                    roadmap_plan = self._fallback_plan(candidate_concepts, goal)
            except Exception as e:
                logger.error(f"Failed to generate roadmap with AI: {e}")
                roadmap_plan = self._fallback_plan(candidate_concepts, goal)
        else:
            roadmap_plan = self._fallback_plan(candidate_concepts, goal)

        # 4. Save Roadmap to DB with clean title
        final_title = (ai_title.strip() if ai_title and isinstance(ai_title, str) and len(ai_title.strip()) > 3 else default_title)[:200]
        roadmap = LearningRoadmap.objects.create(
            user=user,
            title=final_title,
            goal=goal,
            is_active=True
        )
        roadmap.disable_others()

        # 5. Create Nodes with robust concept resolution
        added_concept_ids = set()
        node_order = 1

        for step in roadmap_plan:
            if not isinstance(step, dict):
                continue
            concept_name = step.get('concept', '').strip()
            concept = self._resolve_concept(concept_name, candidate_concepts)

            if not concept or concept.id in added_concept_ids:
                continue

            added_concept_ids.add(concept.id)
            initial_status = 'in_progress' if node_order == 1 else 'pending'

            try:
                est_hours = float(step.get('estimated_hours', 1.5))
            except (ValueError, TypeError):
                est_hours = 1.5

            RoadmapNode.objects.create(
                roadmap=roadmap,
                concept=concept,
                order=node_order,
                ai_rationale=step.get('rationale', f'Mastering {concept.name} is a key milestone for {goal}.'),
                estimated_hours=est_hours,
                status=initial_status
            )
            node_order += 1

        # 6. Ensure at least 6 milestones exist; pad with candidate concepts if needed
        if node_order <= 6:
            for c in candidate_concepts:
                if c.id not in added_concept_ids:
                    added_concept_ids.add(c.id)
                    RoadmapNode.objects.create(
                        roadmap=roadmap,
                        concept=c,
                        order=node_order,
                        ai_rationale=f"Foundational mastery of {c.name} reinforces the core skills required for {goal}.",
                        estimated_hours=max(1.5, float(c.difficulty * 0.8)),
                        status='in_progress' if node_order == 1 else 'pending'
                    )
                    node_order += 1
                    if node_order > 7:
                        break

        serializer = LearningRoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _select_candidate_concepts(self, user, goal):
        """
        Dynamically selects a rich pool of 7 to 10 concepts tailored to the user's
        goal and current mastery state, ensuring weak concepts are reviewed first.
        """
        # 1. Weak concepts needing revision
        weak_masteries = ConceptMastery.objects.filter(
            user=user, 
            needs_revision=True
        ).select_related('concept').order_by('concept__difficulty')
        weak_concepts = [m.concept for m in weak_masteries]

        # 2. Match domain keywords in student goal
        low_goal = goal.lower()
        is_dsa = any(k in low_goal for k in [
            'dsa', 'interview', 'algorithm', 'leetcode', 'data structure',
            'structures', 'tree', 'graph', 'dp', 'dynamic programming',
            'sorting', 'searching', 'recursion', 'competitive'
        ])
        is_oop = any(k in low_goal for k in [
            'oop', 'object', 'class', 'design', 'architecture', 'solid',
            'pattern', 'clean code', 'modular', 'backend'
        ])
        is_beginner = any(k in low_goal for k in [
            'beginner', 'basic', 'foundation', 'start', 'fundamentals',
            'learn python', 'new to', 'scratch', 'syntax'
        ])

        if is_dsa:
            preferred_names = [
                'Control Flow',
                'Lists & Tuples',
                'Dictionaries & Sets',
                'Recursion',
                'Searching Algorithms',
                'Sorting Algorithms',
                'Stacks & Queues',
                'Linked Lists',
                'Trees & Binary Search Trees',
                'Dynamic Programming',
                'Graphs & Graph Algorithms'
            ]
        elif is_oop:
            preferred_names = [
                'Functions',
                'Modules & Packages',
                'Object-Oriented Programming',
                'Inheritance & Polymorphism',
                'Decorators & Generators',
                'File I/O & Exceptions'
            ]
        elif is_beginner:
            preferred_names = [
                'Variables & Data Types',
                'Control Flow',
                'Loops',
                'Functions',
                'Lists & Tuples',
                'Dictionaries & Sets',
                'String Manipulation',
                'File I/O & Exceptions'
            ]
        else:
            # Balanced general curriculum
            preferred_names = [
                'Variables & Data Types',
                'Control Flow',
                'Loops',
                'Functions',
                'Lists & Tuples',
                'Dictionaries & Sets',
                'Recursion',
                'Object-Oriented Programming',
                'Searching Algorithms',
                'Sorting Algorithms',
                'Trees & Binary Search Trees'
            ]

        # Fetch preferred concepts from DB
        db_preferred = {c.name: c for c in Concept.objects.filter(name__in=preferred_names)}
        ordered_candidates = []

        # Place weak concepts first as prerequisite foundation (up to 2)
        for wc in weak_concepts[:2]:
            if wc not in ordered_candidates:
                ordered_candidates.append(wc)

        # Append topic concepts in defined pedagogical order
        for name in preferred_names:
            c = db_preferred.get(name)
            if c and c not in ordered_candidates:
                ordered_candidates.append(c)

        # If still fewer than 7, supplement with unmastered concepts
        if len(ordered_candidates) < 7:
            for c in Concept.objects.all().order_by('difficulty', 'name'):
                if c not in ordered_candidates:
                    ordered_candidates.append(c)
                if len(ordered_candidates) >= 8:
                    break

        return ordered_candidates[:8], weak_concepts

    def _resolve_concept(self, name, candidates):
        """Resolves a concept name to a Concept model instance."""
        if not name:
            return None
        # Exact match
        c = Concept.objects.filter(name__iexact=name).first()
        if c:
            return c
        # Substring match
        c = Concept.objects.filter(name__icontains=name).first()
        if c:
            return c
        # Reverse substring against all concepts
        for item in candidates:
            if item.name.lower() in name.lower() or name.lower() in item.name.lower():
                return item
        return None

    def _clean_roadmap_title(self, goal):
        """Generates a professional, concise title from the user's prompt."""
        low = goal.lower()
        if '1 month' in low and 'dsa' in low:
            return '1-Month DSA Interview Preparation'
        elif 'dsa' in low or 'interview' in low or 'leetcode' in low:
            return 'DSA & Coding Interview Preparation'
        elif 'oop' in low or 'object' in low:
            return 'Object-Oriented Design & Clean Architecture'
        elif 'beginner' in low or 'basic' in low or 'foundation' in low:
            return 'Python Fundamentals & Core Concepts'

        # Strip conversational prefix/suffix
        cleaned = goal.strip()
        patterns = [
            r'^(can you\s+)?(please\s+)?(help me\s+)?(to\s+)?(generate|create|build|make)\s+(a\s+)?(custom\s+)?roadmap\s+(for|to|about)?\s*',
            r'^(i want to|i need to|i have to|help me)\s+(learn|master|prepare for|study)\s*',
            r'^(roadmap\s+(for|to)\s*)',
            r'(\s+can you help me\s*(to)?\s*(generate|create|make)?\s*(a)?\s*roadmap\??)$'
        ]
        for pat in patterns:
            cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE).strip()

        if len(cleaned) < 3:
            return 'Personalized Learning Roadmap'
        return f"Roadmap: {cleaned[0].upper() + cleaned[1:]}"[:80]

    def _extract_json_plan(self, text):
        clean = text.strip()
        # Look for JSON object or array in markdown code fence
        fence_match = re.search(r'```(?:json)?\s*([\{\[].*?[\}\]])\s*```', clean, re.DOTALL)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except Exception:
                pass

        # Look for raw object or array brackets
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start = clean.find(start_char)
            end = clean.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(clean[start:end+1])
                except Exception:
                    pass

        return json.loads(clean)

    def _fallback_plan(self, concepts, goal):
        """Heuristic curriculum fallback ensuring full 6-to-8 step progression."""
        tailored_reasons = {
            "Variables & Data Types": f"Mastering variables, typing, and memory representations is the baseline for {goal}.",
            "Control Flow": f"Conditional branching and decision logic control execution flow essential for {goal}.",
            "Loops": f"Iterative patterns, nested loops, and sequence traversal empower efficient computation.",
            "Functions": f"Modular, reusable abstractions and parameter passing ensure clean, testable code.",
            "String Manipulation": f"String operations, parsing, two-pointer techniques, and slicing.",
            "Lists & Tuples": f"Dynamic arrays, contiguous memory buffers, and indexing essential for problem solving.",
            "Dictionaries & Sets": f"Fast O(1) hash maps, frequency tables, and lookup sets vital for algorithmic speed.",
            "File I/O & Exceptions": f"Robust defensive exception handling and stream processing.",
            "Modules & Packages": f"Structuring scalable software architectures and modular codebases.",
            "Object-Oriented Programming": f"Encapsulation, domain modeling, and reusable class abstractions.",
            "Recursion": f"Thinking inductively to decompose complex divide-and-conquer problems.",
            "Searching Algorithms": f"Binary search, logarithmic search spaces, and predicate bounds.",
            "Sorting Algorithms": f"Merge sort, quick sort, comparative analysis, and Big-O efficiency.",
            "Linked Lists": f"Pointer manipulation, node reversal, cycle detection, and memory chaining.",
            "Stacks & Queues": f"LIFO and FIFO operations, monotonic stacks, and sliding window buffers.",
            "Decorators & Generators": f"Memory-efficient streams, iterators, and higher-order function wrappers.",
            "Inheritance & Polymorphism": f"Hierarchical inheritance, abstract base classes, and polymorphic interfaces.",
            "Trees & Binary Search Trees": f"Hierarchical trees, recursive DFS/BFS traversals, and BST properties.",
            "Dynamic Programming": f"Optimal substructure, memoization tables, and bottom-up DP transitions.",
            "Graphs & Graph Algorithms": f"Adjacency lists, shortest paths, BFS/DFS, and topological dependencies."
        }
        plan = []
        for c in concepts:
            rationale = tailored_reasons.get(
                c.name,
                f"Mastering {c.name} unlocks core prerequisite competencies needed to achieve: {goal}."
            )
            plan.append({
                'concept': c.name,
                'rationale': rationale,
                'estimated_hours': max(1.5, round(float(c.difficulty * 0.75), 1))
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

        # Auto-unlock next node and update ConceptMastery & XP if this one was completed
        if new_status == 'completed':
            # 1. Update ConceptMastery so Progress tab updates in real-time
            try:
                mastery, _ = ConceptMastery.objects.get_or_create(
                    user=request.user, concept=node.concept
                )
                mastery.mastery_score = max(mastery.mastery_score, 85.0)
                mastery.confidence = max(mastery.confidence, 90.0)
                mastery.attempts = max(mastery.attempts, 1)
                mastery.successful_attempts = max(mastery.successful_attempts, 1)
                mastery.needs_revision = False
                mastery.mastery_state = mastery.compute_mastery_state()
                mastery.save()
            except Exception as e:
                logger.warning(f"Could not update ConceptMastery for completed node: {e}")

            # 2. Award XP and streak to student profile
            try:
                profile = getattr(request.user, 'profile', None)
                if profile:
                    profile.total_xp += 50
                    if profile.streak == 0:
                        profile.streak = 1
                    if profile.total_xp >= 300:
                        profile.level = 'advanced'
                    elif profile.total_xp >= 100:
                        profile.level = 'intermediate'
                    profile.save()
            except Exception as e:
                logger.warning(f"Could not update StudentProfile XP: {e}")

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

