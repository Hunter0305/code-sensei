import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Problem, Submission
from .serializers import ProblemListSerializer, ProblemDetailSerializer, SubmissionSerializer
from learning.models import ConceptMastery

logger = logging.getLogger(__name__)


def evaluate_student_code(code: str, problem: Problem):
    """
    Safely executes student code against test cases in an isolated namespace.
    """
    test_cases = problem.test_cases.all().order_by('order')
    results = []
    all_passed = True
    error_msg = ''

    # Execution sandbox
    sandbox = {
        '__builtins__': __builtins__,
        'math': __import__('math'),
        'collections': __import__('collections'),
    }

    try:
        exec(code, sandbox)
    except Exception as e:
        err_str = str(e) or type(e).__name__
        return False, err_str, f"Syntax or Execution Error: {err_str}", [
            {'test_case': 1, 'input': 'Code compilation', 'expected': 'Clean execution', 'actual': err_str, 'passed': False}
        ]

    for idx, tc in enumerate(test_cases):
        inp = tc.input_data.strip()
        expected = tc.expected_output.strip()
        if not inp:
            continue

        try:
            # Handle chained statement inputs e.g. "acc = BankAccount(); acc.deposit(50)"
            if ';' in inp:
                statements = [s.strip() for s in inp.split(';') if s.strip()]
                for s in statements[:-1]:
                    exec(s, sandbox)
                res = eval(statements[-1], sandbox)
            else:
                res = eval(inp, sandbox)

            actual_str = str(res)
            # Match string or repr output
            case_passed = (actual_str == expected) or (repr(res) == expected)
            if not case_passed:
                all_passed = False
                if not error_msg:
                    error_msg = f"Failed on `{inp}`: Expected `{expected}`, got `{actual_str}`"

            results.append({
                'test_case': idx + 1,
                'input': inp,
                'expected': expected,
                'actual': actual_str,
                'passed': case_passed
            })
        except Exception as e:
            all_passed = False
            actual_err = str(e) or type(e).__name__
            if not error_msg:
                error_msg = f"Runtime Error on `{inp}`: {actual_err}"
            results.append({
                'test_case': idx + 1,
                'input': inp,
                'expected': expected,
                'actual': f"Error: {actual_err}",
                'passed': False
            })

    if not test_cases.exists():
        all_passed = True
        feedback = "Code executed without errors."
    elif all_passed:
        feedback = f"All {len(results)} test cases passed! Outstanding work."
    else:
        feedback = error_msg or "Some test cases failed."

    return all_passed, error_msg, feedback, results


class ProblemListView(generics.ListAPIView):
    """List all available problems, optionally filtered by concept."""
    serializer_class = ProblemListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Problem.objects.select_related('concept').all()
        concept_id = self.request.query_params.get('concept')
        if concept_id:
            qs = qs.filter(concept_id=concept_id)
        difficulty = self.request.query_params.get('difficulty')
        if difficulty and difficulty != 'all':
            qs = qs.filter(difficulty=difficulty)
        return qs


class ProblemDetailView(generics.RetrieveAPIView):
    """Get details for a specific problem."""
    queryset = Problem.objects.all()
    serializer_class = ProblemDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


class RunCodeView(APIView):
    """
    Run student code against test cases without saving a submission record.
    Used for the 'Run Code' button in the workspace.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id=None):
        problem_id = id or request.data.get('problem') or request.data.get('problem_id')
        problem = get_object_or_404(Problem, id=problem_id)
        code = request.data.get('code', '')

        passed, error_msg, feedback, results = evaluate_student_code(code, problem)

        return Response({
            'status': 'accepted' if passed else 'wrong_answer' if 'Failed on' in error_msg else 'error',
            'passed': passed,
            'feedback': feedback,
            'error_message': error_msg,
            'results': results,
        }, status=status.HTTP_200_OK)


class SubmitCodeView(APIView):
    """
    Record a code submission, evaluate against test cases,
    and update ConceptMastery in the database.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id=None):
        problem_id = id or request.data.get('problem') or request.data.get('problem_id')
        problem = get_object_or_404(Problem, id=problem_id)
        
        code = request.data.get('code', '')
        client_passed = request.data.get('passed')

        if client_passed is not None:
            passed = bool(client_passed)
            error_message = request.data.get('error_message', '')
            feedback = "All tests passed!" if passed else error_message or "Solution failed."
            results = []
        else:
            passed, error_message, feedback, results = evaluate_student_code(code, problem)

        submission = Submission.objects.create(
            user=request.user,
            problem=problem,
            code=code,
            passed=passed,
            error_message=error_message
        )

        # Update Concept Mastery in database
        mastery, _ = ConceptMastery.objects.get_or_create(
            user=request.user, concept=problem.concept
        )
        
        mistake_tags = []
        if not passed and error_message:
            if 'SyntaxError' in error_message:
                mistake_tags.append('syntax')
            elif 'NameError' in error_message:
                mistake_tags.append('variable_scope')
            elif 'TypeError' in error_message:
                mistake_tags.append('type_mismatch')
            elif 'IndexError' in error_message:
                mistake_tags.append('off_by_one')
            elif 'Failed on' in error_message:
                mistake_tags.append('logical_error')
        
        mastery.record_attempt(success=passed, mistake_tags=mistake_tags)

        return Response({
            'submission_id': submission.id,
            'status': 'accepted' if passed else 'wrong_answer',
            'passed': passed,
            'feedback': feedback,
            'results': results,
            'mastery_state': mastery.mastery_state,
            'mastery_score': round(mastery.mastery_score, 1)
        }, status=status.HTTP_201_CREATED)
