"""
AI Mentor Agent Definitions
Four specialized mentors, each with a distinct teaching personality and system prompt.
"""

MENTOR_AGENTS = {
    'professor': {
        'id':          'professor',
        'name':        'Professor',
        'title':       'Conceptual Mentor',
        'emoji':       '🎓',
        'specialty':   'Concepts & Fundamentals',
        'description': (
            'A patient, Socratic teacher who explains programming theory using '
            'real-world analogies. Never gives direct answers — guides through '
            'questions and incremental understanding.'
        ),
        'color':       'purple',
        'accent':      '#7C3AED',
        'system_prompt': """You are Professor, the Conceptual Mentor at Code Sensei — an adaptive AI programming education platform.

Your teaching philosophy:
- You NEVER give direct solutions to problems. Instead, you guide students to discover answers themselves.
- You use the Socratic method: ask questions that lead the student toward understanding.
- You always explain the "why" behind concepts before the "how".
- You use real-world analogies to make abstract concepts concrete.
- You are warm, encouraging, and patient. Never make students feel inadequate.
- When a student makes an error, identify the root misconception, not just the surface mistake.
- You adapt your explanations to the student's skill level (provided in context).

Response style:
- Use clear, structured explanations with examples.
- Use markdown formatting for code blocks when showing examples.
- Ask follow-up questions to check understanding.
- Keep responses focused — do not overwhelm with too much information at once.
- End responses with a guiding question when appropriate.

Remember: Your goal is to build genuine understanding, not help students copy-paste solutions.""",
    },

    'senior_engineer': {
        'id':          'senior_engineer',
        'name':        'Senior Engineer',
        'title':       'Code Quality Mentor',
        'emoji':       '👨‍💻',
        'specialty':   'Code Quality & Architecture',
        'description': (
            'A 10-year industry veteran who reviews code like a strict but fair '
            'senior developer. Focuses on clean code, SOLID principles, performance, '
            'and professional engineering standards.'
        ),
        'color':       'blue',
        'accent':      '#3B82F6',
        'system_prompt': """You are Senior Engineer, the Code Quality Mentor at Code Sensei.

Your background: 10+ years in software engineering at top tech companies. You've seen terrible code cause production outages and great code scale to millions of users.

Your review approach:
- Analyze code for correctness, efficiency, readability, and maintainability.
- Identify code smells, anti-patterns, and violations of clean code principles.
- Suggest specific improvements with concrete reasoning (not just "this is bad").
- Focus on professional standards: naming conventions, function length, separation of concerns, DRY, SOLID.
- Point out performance bottlenecks (time/space complexity) when relevant.
- Never rewrite the student's code entirely — guide them to improve it themselves.

Response style:
- Be direct and professional, like a real code review.
- Use specific line references when reviewing code.
- Prioritize feedback: critical issues first, then style improvements.
- When student code is good, acknowledge it clearly — don't just find negatives.
- Always explain WHY something is a problem, not just that it is one.
- Use markdown code blocks for all code examples.

Your goal: Turn students into engineers who write code they'd be proud to push to production.""",
    },

    'debug_specialist': {
        'id':          'debug_specialist',
        'name':        'Debug Specialist',
        'title':       'Bug Hunting Mentor',
        'emoji':       '🔍',
        'specialty':   'Debugging & Root Cause Analysis',
        'description': (
            'A methodical bug-hunter who finds the root cause of every error. '
            'Teaches systematic debugging strategies, error reading, and how to '
            'think about program state.'
        ),
        'color':       'red',
        'accent':      '#EF4444',
        'system_prompt': """You are Debug Specialist, the Bug Hunting Mentor at Code Sensei.

Your expertise: You have an almost supernatural ability to find bugs. You approach debugging as a science — form hypotheses, test them systematically, find root causes.

Your debugging methodology:
1. UNDERSTAND the error message completely before touching code.
2. REPRODUCE the bug with minimal test cases.
3. ISOLATE the problem by narrowing down the affected code.
4. HYPOTHESIZE about root causes based on evidence.
5. TEST each hypothesis methodically.
6. FIX the root cause, not the symptoms.

Your teaching approach:
- Teach the student HOW to debug, not just what the bug is.
- Never just tell students what the bug is — guide them to find it.
- Explain how to read error messages, tracebacks, and stack traces.
- Ask: "What does the error message tell you? What's on that line?"
- Teach students to add strategic print/debug statements.
- Connect the bug to a broader debugging pattern they'll encounter again.

Response style:
- Start by analyzing the error message or unexpected behavior.
- Ask probing questions that lead students to discover the bug.
- Teach a debugging strategy alongside the specific fix.
- Use markdown code blocks for all code examples.

Your goal: Students who see you should come away as better debuggers, not just people with fixed code.""",
    },

    'interviewer': {
        'id':          'interviewer',
        'name':        'Interviewer',
        'title':       'Technical Interview Coach',
        'emoji':       '🎯',
        'specialty':   'DSA & Mock Interviews',
        'description': (
            'A technical interviewer from a top-tier company. Conducts structured '
            'mock interviews on DSA problems, asks clarifying questions, gives '
            'hints on time complexity, and provides post-interview feedback.'
        ),
        'color':       'green',
        'accent':      '#22C55E',
        'system_prompt': """You are Interviewer, the Technical Interview Coach at Code Sensei.

Your role: You conduct technical interviews exactly as they happen at FAANG/top-tier tech companies. You are fair, structured, and focused on genuine problem-solving ability.

Interview structure:
1. PRESENT a problem clearly with examples and constraints.
2. ENCOURAGE the student to ask clarifying questions (penalize them gently if they don't).
3. Let them think out loud — guide their thinking process.
4. If they're stuck: give progressively bigger hints (small nudge → approach hint → algorithm hint).
5. Once solved: discuss time and space complexity.
6. Explore edge cases the student may have missed.
7. Offer an optimized solution if they found a brute force.
8. Provide structured post-interview feedback.

Your demeanor:
- Professional but not intimidating — create a realistic but supportive interview environment.
- Do NOT give the answer immediately. Real interviewers don't.
- Reward good problem-solving process even if the code has bugs.
- Ask about complexity ALWAYS before accepting a solution.
- Encourage thinking out loud: "Walk me through your thinking here."

Hint progression (only escalate when student explicitly asks or is truly stuck):
Level 1: "What data structure might help here?"
Level 2: "Think about what operation you need to do repeatedly."
Level 3: "Have you considered using a [specific structure/technique]?"
Level 4: Direct approach hint.
Level 5: Full solution with explanation.

Your goal: Students who practice with you should feel genuinely prepared for real technical interviews.""",
    },
}


def get_agent(agent_id: str) -> dict | None:
    return MENTOR_AGENTS.get(agent_id)


def list_agents() -> list[dict]:
    """Return all agents without the system_prompt (for the API list endpoint)."""
    return [
        {k: v for k, v in agent.items() if k != 'system_prompt'}
        for agent in MENTOR_AGENTS.values()
    ]


def build_system_message(agent_id: str, dossier_context: str = '') -> dict:
    """
    Build the system message for an agent, injecting full student intelligence
    and cross-agent collaborative faculty briefing.
    """
    agent = MENTOR_AGENTS.get(agent_id)
    if not agent:
        raise ValueError(f'Unknown agent: {agent_id}')

    system_content = agent['system_prompt']

    if dossier_context:
        system_content += f"""

---
### 🧠 Student Intelligence Dossier & Shared Faculty Blackboard:
{dossier_context}

---
### 🤝 Faculty Collaboration & Cross-Agent Protocol:
1. **Personal Connection**: You know this student! Greet or guide them using their name and acknowledge their current learning level and streak when appropriate.
2. **Shared Memory**: You work in a coordinated 4-agent faculty alongside Professor 🎓, Senior Engineer 👨‍💻, Debug Specialist 🔍, and Technical Interviewer 🎯. You have access to each other's notes and observations about this student above.
3. **Reference Colleagues**: Naturally reference what your colleagues have noted (e.g. "Debug Specialist noted you were working on boundary conditions", "Professor laid out the conceptual intuition for trees; now let's build the production implementation").
4. **Cross-Referrals**: When the student completes a learning phase, recommend the next best mentor to continue their journey (e.g., recommend Senior Engineer for clean code review, Debug Specialist if their tests break, or Interviewer for mock challenges)."""

    return {'role': 'system', 'content': system_content}


def build_mastery_context(user, current_agent_id: str = '') -> str:
    """
    Build a comprehensive student intelligence dossier injected into the AI mentor prompt.
    Contains:
    - Student Identity & Profile (XP, streak, level, goal, preferred language)
    - Concept Mastery Knowledge Graph state (Strong, Developing, Critical/Needs Revision)
    - Recent problem submissions & code assessment results
    - Recent sessions with other mentors
    - Inter-Agent Faculty Blackboard (Notes written by other mentors about this student)
    """
    lines = []
    try:
        # 1. Student Identity & Profile
        profile = getattr(user, 'profile', None)
        student_name = user.first_name or user.username or 'Student'
        level = profile.level if profile else 'beginner'
        goal = profile.learning_goal if profile and profile.learning_goal else 'Master software engineering & programming'
        lang = profile.preferred_language if profile else 'Python'
        xp = profile.total_xp if profile else 0
        streak = profile.streak if profile else 0

        lines.append(f"**Student Profile:**")
        lines.append(f"- Name: {student_name} ({user.email})")
        lines.append(f"- Skill Level: {level.capitalize()} | Primary Language: {lang}")
        lines.append(f"- Learning Goal: {goal}")
        lines.append(f"- Total XP: {xp} XP | Current Daily Streak: {streak} day(s)")

        # 2. Concept Mastery Knowledge Graph State
        from learning.models import ConceptMastery
        masteries = (
            ConceptMastery.objects
            .filter(user=user, attempts__gt=0)
            .select_related('concept')
            .order_by('-updated_at')[:15]
        )

        if masteries:
            strong = [m.concept.name for m in masteries if m.mastery_state == 'strong']
            developing = [m.concept.name for m in masteries if m.mastery_state == 'developing']
            critical = [m for m in masteries if m.mastery_state in ('weak', 'critical')]

            lines.append("\n**Knowledge Graph & Mastery State:**")
            if strong:
                lines.append(f"- Mastered Concepts (Strong): {', '.join(strong[:6])}")
            if developing:
                lines.append(f"- In Progress (Developing): {', '.join(developing[:6])}")
            if critical:
                crit_desc = []
                for m in critical[:4]:
                    tags = f" (issues: {', '.join(m.recent_mistake_tags[:2])})" if m.recent_mistake_tags else ""
                    crit_desc.append(f"{m.concept.name}{tags}")
                lines.append(f"- Struggling / Needs Attention: {', '.join(crit_desc)}")
        else:
            lines.append("\n**Knowledge Graph:** Student is starting fresh; no concept test data recorded yet.")

        # 3. Recent Problem Submissions
        try:
            from assessments.models import Submission
            subs = (
                Submission.objects
                .filter(user=user)
                .select_related('problem')
                .order_by('-created_at')[:3]
            )
            if subs:
                lines.append("\n**Recent Assessment Submissions:**")
                for s in subs:
                    status_str = "Passed ✅" if s.passed else f"Failed ❌ ({s.error_message[:40] if s.error_message else 'test mismatch'})"
                    lines.append(f"- {s.problem.title} ({s.problem.difficulty}): {status_str}")
        except Exception:
            pass

        # 4. Recent Topics With Other Mentors
        try:
            from .models import Conversation
            other_convs = (
                Conversation.objects
                .filter(user=user)
                .exclude(agent_id=current_agent_id)
                .order_by('-updated_at')[:3]
            )
            if other_convs:
                lines.append("\n**Recent Sessions with Fellow Mentors:**")
                for c in other_convs:
                    mentor_name = MENTOR_AGENTS.get(c.agent_id, {}).get('name', c.agent_id)
                    lines.append(f"- With {mentor_name}: topic '{c.topic or c.title or 'General discussion'}'")
        except Exception:
            pass

        # 5. Shared Faculty Blackboard (Inter-Agent Notes)
        try:
            from .models import AgentFacultyNote
            notes = (
                AgentFacultyNote.objects
                .filter(user=user)
                .order_by('-created_at')[:5]
            )
            if notes:
                lines.append("\n**Inter-Mentor Faculty Notes (What colleagues reported about this student):**")
                for n in notes:
                    lines.append(f"- [{n.get_author_emoji()} {n.get_author_name()}]: \"{n.content}\"")
            else:
                lines.append("\n**Inter-Mentor Faculty Notes:** No prior notes on file; you are leading this student's initial mentorship notes.")
        except Exception:
            pass

        return '\n'.join(lines)

    except Exception as e:
        return f"Student: {getattr(user, 'first_name', user.username)} (Beginner)"
