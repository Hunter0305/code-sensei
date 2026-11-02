from django.core.management.base import BaseCommand
from learning.models import Concept
from assessments.models import Problem, TestCase

class Command(BaseCommand):
    help = 'Seed comprehensive coding assessment problems and test cases across all concepts'

    def handle(self, *args, **kwargs):
        if not Concept.objects.exists():
            self.stdout.write(self.style.ERROR('No concepts found. Please ensure learning concepts are present.'))
            return

        problems_data = [
            # ─────────────────────────────────────────────────────────
            # 1. Variables & Data Types
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Hello Variables',
                'slug': 'hello-variables',
                'concept_name': 'Variables & Data Types',
                'difficulty': 'easy',
                'description': 'Create a function `get_greeting(name)` that takes a person\'s name and returns `"Hello, " + name + "!"`. If no name is given (empty string), return `"Hello, World!"`.',
                'starter_code': 'def get_greeting(name="World"):\n    # Write your solution here\n    pass\n',
                'solution_code': 'def get_greeting(name="World"):\n    if not name:\n        name = "World"\n    return f"Hello, {name}!"\n',
                'test_cases': [
                    {'input': 'get_greeting("Alice")', 'expected': 'Hello, Alice!'},
                    {'input': 'get_greeting("Sensei")', 'expected': 'Hello, Sensei!'},
                    {'input': 'get_greeting("")', 'expected': 'Hello, World!'},
                ]
            },
            {
                'title': 'Type Conversion & Formatting',
                'slug': 'type-conversion-formatting',
                'concept_name': 'Variables & Data Types',
                'difficulty': 'easy',
                'description': 'Write a function `format_receipt(item, price, qty)` that formats order totals.\nExample: `format_receipt("Apple", 1.5, 2)` -> `"2x Apple @ $1.50 = $3.00"`.',
                'starter_code': 'def format_receipt(item: str, price: float, qty: int) -> str:\n    pass\n',
                'solution_code': 'def format_receipt(item: str, price: float, qty: int) -> str:\n    total = price * qty\n    return f"{qty}x {item} @ ${price:.2f} = ${total:.2f}"\n',
                'test_cases': [
                    {'input': 'format_receipt("Apple", 1.5, 2)', 'expected': '2x Apple @ $1.50 = $3.00'},
                    {'input': 'format_receipt("Notebook", 4.99, 3)', 'expected': '3x Notebook @ $4.99 = $14.97'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 2. Control Flow
            # ─────────────────────────────────────────────────────────
            {
                'title': 'FizzBuzz Evaluator',
                'slug': 'fizzbuzz-evaluator',
                'concept_name': 'Control Flow',
                'difficulty': 'easy',
                'description': 'Write a function `fizz_buzz(n)` that takes an integer `n` and returns:\n- `"FizzBuzz"` if `n` is divisible by both 3 and 5\n- `"Fizz"` if divisible by 3\n- `"Buzz"` if divisible by 5\n- The string form of `n` otherwise.',
                'starter_code': 'def fizz_buzz(n: int) -> str:\n    pass\n',
                'solution_code': 'def fizz_buzz(n: int) -> str:\n    if n % 15 == 0:\n        return "FizzBuzz"\n    elif n % 3 == 0:\n        return "Fizz"\n    elif n % 5 == 0:\n        return "Buzz"\n    return str(n)\n',
                'test_cases': [
                    {'input': 'fizz_buzz(15)', 'expected': 'FizzBuzz'},
                    {'input': 'fizz_buzz(9)', 'expected': 'Fizz'},
                    {'input': 'fizz_buzz(10)', 'expected': 'Buzz'},
                    {'input': 'fizz_buzz(7)', 'expected': '7'},
                ]
            },
            {
                'title': 'Leap Year Checker',
                'slug': 'leap-year-checker',
                'concept_name': 'Control Flow',
                'difficulty': 'easy',
                'description': 'Write a function `is_leap_year(year)` that returns `True` if `year` is a leap year, and `False` otherwise.\nA year is leap if it is divisible by 4, except century years must also be divisible by 400.',
                'starter_code': 'def is_leap_year(year: int) -> bool:\n    pass\n',
                'solution_code': 'def is_leap_year(year: int) -> bool:\n    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)\n',
                'test_cases': [
                    {'input': 'is_leap_year(2024)', 'expected': 'True'},
                    {'input': 'is_leap_year(1900)', 'expected': 'False'},
                    {'input': 'is_leap_year(2000)', 'expected': 'True'},
                    {'input': 'is_leap_year(2023)', 'expected': 'False'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 3. Loops
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Sum of Digits',
                'slug': 'sum-of-digits',
                'concept_name': 'Loops',
                'difficulty': 'easy',
                'description': 'Write a function `sum_digits(n)` that returns the sum of all digits in a positive integer `n`.\nExample: `sum_digits(1234)` -> `1 + 2 + 3 + 4 = 10`.',
                'starter_code': 'def sum_digits(n: int) -> int:\n    pass\n',
                'solution_code': 'def sum_digits(n: int) -> int:\n    total = 0\n    while n > 0:\n        total += n % 10\n        n //= 10\n    return total\n',
                'test_cases': [
                    {'input': 'sum_digits(1234)', 'expected': '10'},
                    {'input': 'sum_digits(905)', 'expected': '14'},
                    {'input': 'sum_digits(7)', 'expected': '7'},
                ]
            },
            {
                'title': 'Count Vowels',
                'slug': 'count-vowels',
                'concept_name': 'Loops',
                'difficulty': 'easy',
                'description': 'Write a function `count_vowels(s)` that iterates through string `s` and counts all occurrences of vowels (`a, e, i, o, u`, case-insensitive).',
                'starter_code': 'def count_vowels(s: str) -> int:\n    pass\n',
                'solution_code': 'def count_vowels(s: str) -> int:\n    vowels = set("aeiouAEIOU")\n    count = 0\n    for char in s:\n        if char in vowels:\n            count += 1\n    return count\n',
                'test_cases': [
                    {'input': 'count_vowels("Hello World")', 'expected': '3'},
                    {'input': 'count_vowels("Python Programming")', 'expected': '4'},
                    {'input': 'count_vowels("xyz")', 'expected': '0'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 4. Functions
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Sum of Two Numbers',
                'slug': 'sum-two-numbers',
                'concept_name': 'Functions',
                'difficulty': 'easy',
                'description': 'Write a function `add(a, b)` that returns the sum of two numbers.',
                'starter_code': 'def add(a, b):\n    pass\n',
                'solution_code': 'def add(a, b):\n    return a + b\n',
                'test_cases': [
                    {'input': 'add(3, 4)', 'expected': '7'},
                    {'input': 'add(-1, 5)', 'expected': '4'},
                    {'input': 'add(0, 0)', 'expected': '0'},
                ]
            },
            {
                'title': 'Calculate BMI',
                'slug': 'calculate-bmi',
                'concept_name': 'Functions',
                'difficulty': 'easy',
                'description': 'Write a function `calculate_bmi(weight_kg, height_m)` that returns the Body Mass Index rounded to 1 decimal place: `BMI = weight / (height ** 2)`.',
                'starter_code': 'def calculate_bmi(weight_kg: float, height_m: float) -> float:\n    pass\n',
                'solution_code': 'def calculate_bmi(weight_kg: float, height_m: float) -> float:\n    return round(weight_kg / (height_m ** 2), 1)\n',
                'test_cases': [
                    {'input': 'calculate_bmi(70, 1.75)', 'expected': '22.9'},
                    {'input': 'calculate_bmi(85, 1.8)', 'expected': '26.2'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 5. Lists & Tuples
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Filter Even Numbers',
                'slug': 'filter-even-numbers',
                'concept_name': 'Lists & Tuples',
                'difficulty': 'medium',
                'description': 'Write a function `get_evens(nums)` that takes a list of integers and returns a new list containing only the even numbers.',
                'starter_code': 'def get_evens(nums):\n    pass\n',
                'solution_code': 'def get_evens(nums):\n    return [n for n in nums if n % 2 == 0]\n',
                'test_cases': [
                    {'input': 'get_evens([1, 2, 3, 4, 5])', 'expected': '[2, 4]'},
                    {'input': 'get_evens([11, 13, 15])', 'expected': '[]'},
                    {'input': 'get_evens([2, 4, 6])', 'expected': '[2, 4, 6]'},
                ]
            },
            {
                'title': 'Rotate Array by K Positions',
                'slug': 'rotate-array-k',
                'concept_name': 'Lists & Tuples',
                'difficulty': 'medium',
                'description': 'Write a function `rotate_list(nums, k)` that rotates a list of numbers to the right by `k` steps.\nExample: `rotate_list([1, 2, 3, 4, 5], 2)` -> `[4, 5, 1, 2, 3]`.',
                'starter_code': 'def rotate_list(nums: list, k: int) -> list:\n    pass\n',
                'solution_code': 'def rotate_list(nums: list, k: int) -> list:\n    if not nums: return []\n    k = k % len(nums)\n    return nums[-k:] + nums[:-k] if k > 0 else nums\n',
                'test_cases': [
                    {'input': 'rotate_list([1, 2, 3, 4, 5], 2)', 'expected': '[4, 5, 1, 2, 3]'},
                    {'input': 'rotate_list([1, 2], 3)', 'expected': '[2, 1]'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 6. Dictionaries & Sets
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Dictionary Lookup',
                'slug': 'dictionary-lookup',
                'concept_name': 'Dictionaries & Sets',
                'difficulty': 'easy',
                'description': 'Write a function `get_age(name)` that looks up a person in the `people` dictionary and returns their age. If they don\'t exist, return -1.\n\n`people = {"Alice": 25, "Bob": 30}`',
                'starter_code': 'people = {"Alice": 25, "Bob": 30}\n\ndef get_age(name):\n    pass\n',
                'solution_code': 'people = {"Alice": 25, "Bob": 30}\n\ndef get_age(name):\n    return people.get(name, -1)\n',
                'test_cases': [
                    {'input': 'get_age("Alice")', 'expected': '25'},
                    {'input': 'get_age("Charlie")', 'expected': '-1'},
                ]
            },
            {
                'title': 'Two Sum Hash Map',
                'slug': 'two-sum-hashmap',
                'concept_name': 'Dictionaries & Sets',
                'difficulty': 'medium',
                'description': 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nAssume each input has exactly one solution and you may not use the same element twice.',
                'starter_code': 'def two_sum(nums: list, target: int) -> list:\n    pass\n',
                'solution_code': 'def two_sum(nums: list, target: int) -> list:\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i\n    return []\n',
                'test_cases': [
                    {'input': 'two_sum([2, 7, 11, 15], 9)', 'expected': '[0, 1]'},
                    {'input': 'two_sum([3, 2, 4], 6)', 'expected': '[1, 2]'},
                    {'input': 'two_sum([3, 3], 6)', 'expected': '[0, 1]'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 7. String Manipulation
            # ─────────────────────────────────────────────────────────
            {
                'title': 'String Reversal',
                'slug': 'string-reversal',
                'concept_name': 'String Manipulation',
                'difficulty': 'easy',
                'description': 'Write a function `reverse_string(s)` that takes a string and returns it reversed.',
                'starter_code': 'def reverse_string(s):\n    pass\n',
                'solution_code': 'def reverse_string(s):\n    return s[::-1]\n',
                'test_cases': [
                    {'input': 'reverse_string("hello")', 'expected': 'olleh'},
                    {'input': 'reverse_string("Python")', 'expected': 'nohtyP'},
                ]
            },
            {
                'title': 'Valid Palindrome',
                'slug': 'valid-palindrome',
                'concept_name': 'String Manipulation',
                'difficulty': 'medium',
                'description': 'Write a function `is_palindrome(s)` that returns `True` if `s` is a palindrome, ignoring case and non-alphanumeric characters.',
                'starter_code': 'def is_palindrome(s):\n    pass\n',
                'solution_code': 'def is_palindrome(s):\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]\n',
                'test_cases': [
                    {'input': 'is_palindrome("Racecar")', 'expected': 'True'},
                    {'input': 'is_palindrome("A man, a plan, a canal: Panama")', 'expected': 'True'},
                    {'input': 'is_palindrome("hello")', 'expected': 'False'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 8. File I/O & Exceptions
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Custom Error Raising',
                'slug': 'custom-error-raising',
                'concept_name': 'File I/O & Exceptions',
                'difficulty': 'medium',
                'description': 'Write a function `divide(a, b)` that returns `a / b`. If `b` is 0, raise a `ValueError` with the message `"Cannot divide by zero"`.',
                'starter_code': 'def divide(a, b):\n    pass\n',
                'solution_code': 'def divide(a, b):\n    if b == 0:\n        raise ValueError("Cannot divide by zero")\n    return a / b\n',
                'test_cases': [
                    {'input': 'divide(10, 2)', 'expected': '5.0'},
                    {'input': 'divide(15, 3)', 'expected': '5.0'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 9. Object-Oriented Programming
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Simple Bank Account',
                'slug': 'simple-bank-account',
                'concept_name': 'Object-Oriented Programming',
                'difficulty': 'medium',
                'description': 'Create a class `BankAccount` with an `__init__` method that sets `self.balance = 0`. Add `deposit(amount)` and `withdraw(amount)` methods.\n`withdraw` should only deduct if balance >= amount, returning `True` on success and `False` otherwise.',
                'starter_code': 'class BankAccount:\n    pass\n',
                'solution_code': 'class BankAccount:\n    def __init__(self):\n        self.balance = 0\n    def deposit(self, amount):\n        self.balance += amount\n        return self.balance\n    def withdraw(self, amount):\n        if self.balance >= amount:\n            self.balance -= amount\n            return True\n        return False\n',
                'test_cases': [
                    {'input': 'acc = BankAccount(); acc.deposit(100); acc.withdraw(40); acc.balance', 'expected': '60'},
                    {'input': 'acc = BankAccount(); acc.deposit(50); acc.withdraw(100)', 'expected': 'False'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 10. Recursion
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Factorial via Recursion',
                'slug': 'factorial-recursion',
                'concept_name': 'Recursion',
                'difficulty': 'medium',
                'description': 'Write a recursive function `factorial(n)` that returns the factorial of integer `n`. Must not use a loop or the math library.',
                'starter_code': 'def factorial(n: int) -> int:\n    pass\n',
                'solution_code': 'def factorial(n: int) -> int:\n    if n <= 1: return 1\n    return n * factorial(n - 1)\n',
                'test_cases': [
                    {'input': 'factorial(5)', 'expected': '120'},
                    {'input': 'factorial(0)', 'expected': '1'},
                    {'input': 'factorial(3)', 'expected': '6'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 11. Searching Algorithms
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Binary Search',
                'slug': 'binary-search',
                'concept_name': 'Searching Algorithms',
                'difficulty': 'medium',
                'description': 'Write a function `binary_search(arr, target)` that implements the logarithmic time $O(\\log N)$ search on a sorted list `arr`. Return the index of `target`, or `-1` if not found.',
                'starter_code': 'def binary_search(arr: list, target: int) -> int:\n    pass\n',
                'solution_code': 'def binary_search(arr: list, target: int) -> int:\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
                'test_cases': [
                    {'input': 'binary_search([1, 3, 5, 7, 9, 11], 7)', 'expected': '3'},
                    {'input': 'binary_search([1, 3, 5, 7, 9, 11], 2)', 'expected': '-1'},
                    {'input': 'binary_search([10], 10)', 'expected': '0'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 12. Sorting Algorithms
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Bubble Sort Implementation',
                'slug': 'bubble-sort',
                'concept_name': 'Sorting Algorithms',
                'difficulty': 'hard',
                'description': 'Write a function `bubble_sort(arr)` that sorts a list of numbers in ascending order using the Bubble Sort algorithm.',
                'starter_code': 'def bubble_sort(arr):\n    pass\n',
                'solution_code': 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n',
                'test_cases': [
                    {'input': 'bubble_sort([64, 34, 25, 12, 22, 11, 90])', 'expected': '[11, 12, 22, 25, 34, 64, 90]'},
                    {'input': 'bubble_sort([5, 1, 4, 2, 8])', 'expected': '[1, 2, 4, 5, 8]'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 13. Stacks & Queues
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Balanced Parentheses Checker',
                'slug': 'balanced-parentheses',
                'concept_name': 'Stacks & Queues',
                'difficulty': 'medium',
                'description': 'Write a function `is_valid_brackets(s)` that determines if an input string containing `(`, `)`, `{`, `}`, `[` and `]` is valid using a Stack.\nOpen brackets must be closed by the same type in the correct order.',
                'starter_code': 'def is_valid_brackets(s: str) -> bool:\n    pass\n',
                'solution_code': 'def is_valid_brackets(s: str) -> bool:\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping.values():\n            stack.append(char)\n        elif char in mapping:\n            if not stack or stack[-1] != mapping[char]:\n                return False\n            stack.pop()\n    return len(stack) == 0\n',
                'test_cases': [
                    {'input': 'is_valid_brackets("()[]{}")', 'expected': 'True'},
                    {'input': 'is_valid_brackets("(]"))', 'expected': 'False'},
                    {'input': 'is_valid_brackets("([{}])")', 'expected': 'True'},
                    {'input': 'is_valid_brackets("([)]")', 'expected': 'False'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 14. Linked Lists
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Reverse Singly Linked List',
                'slug': 'reverse-linked-list',
                'concept_name': 'Linked Lists',
                'difficulty': 'medium',
                'description': 'Given a Node class `class ListNode: def __init__(self, val=0, next=None): self.val = val; self.next = next`, write a function `reverse_list(head)` that reverses the linked list and returns the new head.\n`to_list(head)` helper is available in tests.',
                'starter_code': 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    pass\n',
                'solution_code': 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n',
                'test_cases': [
                    {
                        'input': 'n3=ListNode(3); n2=ListNode(2, n3); n1=ListNode(1, n2); r=reverse_list(n1); [r.val, r.next.val, r.next.next.val]',
                        'expected': '[3, 2, 1]'
                    },
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 15. Trees & Binary Search Trees
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Maximum Depth of Binary Tree',
                'slug': 'max-depth-binary-tree',
                'concept_name': 'Trees & Binary Search Trees',
                'difficulty': 'medium',
                'description': 'Given a binary tree root `TreeNode(val, left, right)`, write a function `max_depth(root)` that returns its maximum depth (number of nodes along the longest path from root to leaf).',
                'starter_code': 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef max_depth(root):\n    pass\n',
                'solution_code': 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef max_depth(root):\n    if not root: return 0\n    return 1 + max(max_depth(root.left), max_depth(root.right))\n',
                'test_cases': [
                    {
                        'input': 't=TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7))); max_depth(t)',
                        'expected': '3'
                    },
                    {
                        'input': 'max_depth(None)',
                        'expected': '0'
                    },
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 16. Graphs & Graph Algorithms
            # ─────────────────────────────────────────────────────────
            {
                'title': 'BFS Path Finding in Graph',
                'slug': 'bfs-path-finding',
                'concept_name': 'Graphs & Graph Algorithms',
                'difficulty': 'medium',
                'description': 'Write a function `has_path(graph, src, dst)` that performs Breadth-First Search (BFS) to determine whether a directed path exists from `src` node to `dst` node.\n`graph` is represented as an adjacency dict: `{0: [1, 2], 1: [2], 2: []}`.',
                'starter_code': 'from collections import deque\n\ndef has_path(graph: dict, src: int, dst: int) -> bool:\n    pass\n',
                'solution_code': 'from collections import deque\n\ndef has_path(graph: dict, src: int, dst: int) -> bool:\n    if src == dst: return True\n    queue = deque([src])\n    visited = {src}\n    while queue:\n        curr = queue.popleft()\n        if curr == dst: return True\n        for neighbor in graph.get(curr, []):\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return False\n',
                'test_cases': [
                    {'input': 'has_path({0: [1, 2], 1: [2], 2: [3], 3: []}, 0, 3)', 'expected': 'True'},
                    {'input': 'has_path({0: [1], 1: [], 2: [3], 3: []}, 0, 3)', 'expected': 'False'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 17. Dynamic Programming
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Climbing Stairs',
                'slug': 'climbing-stairs',
                'concept_name': 'Dynamic Programming',
                'difficulty': 'medium',
                'description': 'You are climbing a staircase that takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps.\nWrite a function `climb_stairs(n)` that calculates how many distinct ways you can climb to the top using dynamic programming / memoization.',
                'starter_code': 'def climb_stairs(n: int) -> int:\n    pass\n',
                'solution_code': 'def climb_stairs(n: int) -> int:\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n',
                'test_cases': [
                    {'input': 'climb_stairs(2)', 'expected': '2'},
                    {'input': 'climb_stairs(3)', 'expected': '3'},
                    {'input': 'climb_stairs(5)', 'expected': '8'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 18. Decorators & Generators
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Fibonacci Generator',
                'slug': 'fibonacci-generator',
                'concept_name': 'Decorators & Generators',
                'difficulty': 'medium',
                'description': 'Write a generator function `fib_generator(limit)` that `yield`s the first `limit` numbers in the Fibonacci sequence starting with `0, 1, 1, 2, 3...`.',
                'starter_code': 'def fib_generator(limit: int):\n    pass\n',
                'solution_code': 'def fib_generator(limit: int):\n    a, b = 0, 1\n    count = 0\n    while count < limit:\n        yield a\n        a, b = b, a + b\n        count += 1\n',
                'test_cases': [
                    {'input': 'list(fib_generator(5))', 'expected': '[0, 1, 1, 2, 3]'},
                    {'input': 'list(fib_generator(1))', 'expected': '[0]'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 19. Inheritance & Polymorphism
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Shape Area Polymorphism',
                'slug': 'shape-polymorphism',
                'concept_name': 'Inheritance & Polymorphism',
                'difficulty': 'medium',
                'description': 'Create a base class `Shape` with an `area()` method returning 0. Subclass `Circle(radius)` (use `math.pi * radius ** 2` rounded to 2 decimals) and `Square(side)` returning `side ** 2`.',
                'starter_code': 'import math\n\nclass Shape:\n    def area(self):\n        return 0\n\nclass Circle(Shape):\n    pass\n\nclass Square(Shape):\n    pass\n',
                'solution_code': 'import math\n\nclass Shape:\n    def area(self):\n        return 0\n\nclass Circle(Shape):\n    def __init__(self, radius):\n        self.radius = radius\n    def area(self):\n        return round(math.pi * (self.radius ** 2), 2)\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n    def area(self):\n        return self.side ** 2\n',
                'test_cases': [
                    {'input': 'Square(4).area()', 'expected': '16'},
                    {'input': 'Circle(3).area()', 'expected': '28.27'},
                ]
            },

            # ─────────────────────────────────────────────────────────
            # 20. Modules & Packages
            # ─────────────────────────────────────────────────────────
            {
                'title': 'Math Statistics Summarizer',
                'slug': 'math-stats-summarizer',
                'concept_name': 'Modules & Packages',
                'difficulty': 'easy',
                'description': 'Write a function `calc_stats(nums)` that returns a dictionary with `"min"`, `"max"`, and `"mean"` (rounded to 1 decimal place).\nExample: `calc_stats([10, 20, 30])` -> `{"min": 10, "max": 30, "mean": 20.0}`.',
                'starter_code': 'def calc_stats(nums: list) -> dict:\n    pass\n',
                'solution_code': 'def calc_stats(nums: list) -> dict:\n    if not nums: return {}\n    return {"min": min(nums), "max": max(nums), "mean": round(sum(nums) / len(nums), 1)}\n',
                'test_cases': [
                    {'input': 'calc_stats([10, 20, 30])', 'expected': "{'min': 10, 'max': 30, 'mean': 20.0}"},
                    {'input': 'calc_stats([5, 15, 25, 35])', 'expected': "{'min': 5, 'max': 35, 'mean': 20.0}"},
                ]
            },
        ]

        created_count = 0
        updated_count = 0

        for p_data in problems_data:
            concept_name = p_data['concept_name']
            try:
                concept = Concept.objects.get(name__iexact=concept_name)
            except Concept.DoesNotExist:
                # Try partial match
                concept = Concept.objects.filter(name__icontains=concept_name.split()[0]).first()
                if not concept:
                    self.stdout.write(self.style.WARNING(f"Concept '{concept_name}' not found, skipping '{p_data['title']}'"))
                    continue

            problem, created = Problem.objects.update_or_create(
                slug=p_data['slug'],
                defaults={
                    'title': p_data['title'],
                    'description': p_data['description'],
                    'difficulty': p_data['difficulty'],
                    'concept': concept,
                    'starter_code': p_data['starter_code'],
                    'solution_code': p_data['solution_code'],
                }
            )

            # Clear existing test cases to prevent duplicates
            problem.test_cases.all().delete()

            for idx, tc in enumerate(p_data['test_cases']):
                TestCase.objects.create(
                    problem=problem,
                    input_data=tc['input'],
                    expected_output=tc['expected'],
                    order=idx
                )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created problem: {problem.title}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"Updated problem: {problem.title}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded problems! Created: {created_count}, Updated: {updated_count}. Total in DB: {Problem.objects.count()}"
            )
        )
