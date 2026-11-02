"""
Management command: seed_concepts
Populates the Concept table with a realistic Python knowledge graph.
Run with: python manage.py seed_concepts
"""
from django.core.management.base import BaseCommand
from learning.models import Concept


PYTHON_CONCEPTS = [
    # ── Tier 1: Absolute Fundamentals ──────────────────────────
    {
        'name': 'Variables & Data Types',
        'category': 'fundamentals',
        'difficulty': 1,
        'description': 'Understanding how to store and work with different types of data: integers, floats, strings, booleans, and None.',
        'graph_x': 0.5,
        'graph_y': 0.05,
        'prerequisites': [],
    },
    {
        'name': 'Control Flow',
        'category': 'fundamentals',
        'difficulty': 1,
        'description': 'if/elif/else statements, comparison operators, and logical operators for decision-making in code.',
        'graph_x': 0.25,
        'graph_y': 0.15,
        'prerequisites': ['Variables & Data Types'],
    },
    {
        'name': 'Loops',
        'category': 'fundamentals',
        'difficulty': 1,
        'description': 'for loops, while loops, break/continue/pass, and iterating over sequences.',
        'graph_x': 0.75,
        'graph_y': 0.15,
        'prerequisites': ['Variables & Data Types'],
    },

    # ── Tier 2: Core Building Blocks ──────────────────────────
    {
        'name': 'Functions',
        'category': 'fundamentals',
        'difficulty': 2,
        'description': 'Defining and calling functions, parameters, return values, scope, and default arguments.',
        'graph_x': 0.5,
        'graph_y': 0.25,
        'prerequisites': ['Control Flow', 'Loops'],
    },
    {
        'name': 'Lists & Tuples',
        'category': 'data_structures',
        'difficulty': 2,
        'description': 'Ordered sequences, indexing, slicing, list methods, mutability, and list comprehensions.',
        'graph_x': 0.20,
        'graph_y': 0.35,
        'prerequisites': ['Loops'],
    },
    {
        'name': 'Dictionaries & Sets',
        'category': 'data_structures',
        'difficulty': 2,
        'description': 'Key-value mappings, set operations, dictionary comprehensions, and hash-based lookups.',
        'graph_x': 0.80,
        'graph_y': 0.35,
        'prerequisites': ['Lists & Tuples'],
    },
    {
        'name': 'String Manipulation',
        'category': 'fundamentals',
        'difficulty': 2,
        'description': 'String methods, formatting (f-strings), slicing, splitting, joining, and common string patterns.',
        'graph_x': 0.5,
        'graph_y': 0.40,
        'prerequisites': ['Functions'],
    },

    # ── Tier 3: Intermediate ──────────────────────────────────
    {
        'name': 'Object-Oriented Programming',
        'category': 'oop',
        'difficulty': 3,
        'description': 'Classes, instances, attributes, methods, __init__, and basic encapsulation principles.',
        'graph_x': 0.3,
        'graph_y': 0.55,
        'prerequisites': ['Functions', 'Dictionaries & Sets'],
    },
    {
        'name': 'Recursion',
        'category': 'fundamentals',
        'difficulty': 3,
        'description': 'Recursive function design, base cases, call stack, memoization, and common recursive patterns.',
        'graph_x': 0.7,
        'graph_y': 0.55,
        'prerequisites': ['Functions'],
    },
    {
        'name': 'File I/O & Exceptions',
        'category': 'fundamentals',
        'difficulty': 3,
        'description': 'Reading/writing files, context managers (with), try/except/finally, and custom exception classes.',
        'graph_x': 0.5,
        'graph_y': 0.60,
        'prerequisites': ['Functions', 'String Manipulation'],
    },
    {
        'name': 'Modules & Packages',
        'category': 'fundamentals',
        'difficulty': 3,
        'description': 'Importing modules, creating packages, __name__ == "__main__", and the Python standard library.',
        'graph_x': 0.10,
        'graph_y': 0.65,
        'prerequisites': ['Functions'],
    },

    # ── Tier 4: Advanced OOP + Algorithms ─────────────────────
    {
        'name': 'Inheritance & Polymorphism',
        'category': 'oop',
        'difficulty': 4,
        'description': 'Class hierarchies, super(), method overriding, duck typing, abstract classes, and interfaces.',
        'graph_x': 0.2,
        'graph_y': 0.75,
        'prerequisites': ['Object-Oriented Programming'],
    },
    {
        'name': 'Sorting Algorithms',
        'category': 'algorithms',
        'difficulty': 3,
        'description': 'Bubble sort, merge sort, quick sort — time/space complexity, stability, and when to use each.',
        'graph_x': 0.65,
        'graph_y': 0.70,
        'prerequisites': ['Recursion', 'Lists & Tuples'],
    },
    {
        'name': 'Searching Algorithms',
        'category': 'algorithms',
        'difficulty': 3,
        'description': 'Linear search, binary search, complexity analysis, and search on sorted/unsorted data.',
        'graph_x': 0.85,
        'graph_y': 0.70,
        'prerequisites': ['Lists & Tuples', 'Recursion'],
    },
    {
        'name': 'Linked Lists',
        'category': 'data_structures',
        'difficulty': 4,
        'description': 'Singly/doubly linked lists, node traversal, insertion/deletion, and cycle detection.',
        'graph_x': 0.40,
        'graph_y': 0.75,
        'prerequisites': ['Object-Oriented Programming', 'Recursion'],
    },
    {
        'name': 'Stacks & Queues',
        'category': 'data_structures',
        'difficulty': 4,
        'description': 'Stack (LIFO) and Queue (FIFO) implementations, deque, and application problems.',
        'graph_x': 0.5,
        'graph_y': 0.85,
        'prerequisites': ['Linked Lists'],
    },

    # ── Tier 5: Expert ────────────────────────────────────────
    {
        'name': 'Trees & Binary Search Trees',
        'category': 'data_structures',
        'difficulty': 5,
        'description': 'Tree traversals (BFS/DFS), BST operations, balanced trees, and tree-based problems.',
        'graph_x': 0.3,
        'graph_y': 0.95,
        'prerequisites': ['Linked Lists', 'Recursion'],
    },
    {
        'name': 'Graphs & Graph Algorithms',
        'category': 'algorithms',
        'difficulty': 5,
        'description': 'Graph representation (adjacency list/matrix), BFS, DFS, Dijkstra, and topological sort.',
        'graph_x': 0.60,
        'graph_y': 0.95,
        'prerequisites': ['Trees & Binary Search Trees', 'Stacks & Queues'],
    },
    {
        'name': 'Dynamic Programming',
        'category': 'algorithms',
        'difficulty': 5,
        'description': 'Memoization, tabulation, overlapping subproblems, optimal substructure, and classic DP patterns.',
        'graph_x': 0.85,
        'graph_y': 0.95,
        'prerequisites': ['Recursion', 'Sorting Algorithms'],
    },
    {
        'name': 'Decorators & Generators',
        'category': 'functional',
        'difficulty': 4,
        'description': 'Function decorators, @wraps, generator functions, yield, lazy evaluation, and itertools.',
        'graph_x': 0.10,
        'graph_y': 0.90,
        'prerequisites': ['Inheritance & Polymorphism', 'Modules & Packages'],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with Python programming concepts for the Learning Memory Graph'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing concepts before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Concept.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared existing concepts.'))

        created_count = 0
        concept_map: dict[str, Concept] = {}

        # First pass: create all concepts (without prerequisites)
        for data in PYTHON_CONCEPTS:
            prereq_names = data.pop('prerequisites')
            concept, created = Concept.objects.update_or_create(
                name=data['name'],
                defaults={**data, 'language': 'python'},
            )
            concept_map[concept.name] = concept
            if created:
                created_count += 1
                self.stdout.write(f'  [+] Created: {concept.name}')
            else:
                self.stdout.write(f'  [~] Updated: {concept.name}')
            data['prerequisites'] = prereq_names  # restore for second pass

        # Second pass: wire up prerequisites
        for data in PYTHON_CONCEPTS:
            concept = concept_map[data['name']]
            concept.prerequisites.clear()
            for prereq_name in data['prerequisites']:
                if prereq_name in concept_map:
                    concept.prerequisites.add(concept_map[prereq_name])

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_count} new concepts '
            f'({len(PYTHON_CONCEPTS)} total in graph).'
        ))
