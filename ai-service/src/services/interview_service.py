"""
Interview Service — Gemini-powered DSA interviews
"""
import json
import re
import logging
from typing import Dict, List, Optional

from src.config import Config, GEMINI_READY
from src.cache import get_cache, set_cache

logger = logging.getLogger(__name__)

# Use google-generativeai (same package as analysis + recommendation services)
_model = None
if GEMINI_READY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=Config.GEMINI_API_KEY)
        _model = genai.GenerativeModel(Config.GEMINI_MODEL)
        logger.info(f"Gemini model initialized for interview service: {Config.GEMINI_MODEL}")
    except Exception as e:
        logger.error(f"Failed to init Gemini for interview service: {e}")
        _model = None


GEMINI_CALL_TIMEOUT_SECONDS = 15  # hard ceiling so a hung Gemini call can never hang the request


async def _gemini(prompt: str, fallback: dict) -> dict:
    if _model is None:
        return fallback
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        # See recommendation_service.py for why this timeout matters: without it
        # a hung Gemini call blocks forever and slowly starves the shared
        # executor thread pool, which is why the Interview page and other
        # AI-backed pages could appear to load "forever".
        resp = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _model.generate_content(prompt)),
            timeout=GEMINI_CALL_TIMEOUT_SECONDS,
        )
        text = resp.text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text)
    except asyncio.TimeoutError:
        logger.error(f"Gemini interview call timed out after {GEMINI_CALL_TIMEOUT_SECONDS}s — using fallback")
        return fallback
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return fallback


QUESTION_BANK = [
    {
        "id": "q001",
        "title": "Two Sum",
        "difficulty": "easy",
        "topics": ["array", "hash-table"],
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] == 9"}
        ],
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        "hints": ["Try using a hash map", "For each element, check if complement exists"],
        "optimal_complexity": {"time": "O(n)", "space": "O(n)"}
    },
    {
        "id": "q002",
        "title": "Valid Parentheses",
        "difficulty": "easy",
        "topics": ["string", "stack"],
        "description": "Given a string s containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        "examples": [
            {"input": "s = '()'", "output": "true"},
            {"input": "s = '()[]{}'", "output": "true"},
            {"input": "s = '(]'", "output": "false"}
        ],
        "constraints": ["1 <= s.length <= 10^4"],
        "hints": ["Use a stack", "Push on open bracket, pop on close"],
        "optimal_complexity": {"time": "O(n)", "space": "O(n)"}
    },
    {
        "id": "q003",
        "title": "Longest Common Subsequence",
        "difficulty": "medium",
        "topics": ["string", "dynamic-programming"],
        "description": "Given two strings text1 and text2, return the length of their longest common subsequence.",
        "examples": [
            {"input": "text1 = 'abcde', text2 = 'ace'", "output": "3", "explanation": "LCS is 'ace'"}
        ],
        "constraints": ["1 <= text1.length, text2.length <= 1000"],
        "hints": ["Use 2D DP", "dp[i][j] = LCS of text1[:i] and text2[:j]"],
        "optimal_complexity": {"time": "O(m*n)", "space": "O(m*n)"}
    },
    {
        "id": "q004",
        "title": "Binary Tree Level Order Traversal",
        "difficulty": "medium",
        "topics": ["tree", "breadth-first-search"],
        "description": "Given the root of a binary tree, return the level order traversal of its nodes' values.",
        "examples": [
            {"input": "root = [3,9,20,null,null,15,7]", "output": "[[3],[9,20],[15,7]]"}
        ],
        "constraints": ["0 <= number of nodes <= 2000"],
        "hints": ["Use a queue", "Process nodes level by level"],
        "optimal_complexity": {"time": "O(n)", "space": "O(n)"}
    },
    {
        "id": "q005",
        "title": "Merge K Sorted Lists",
        "difficulty": "hard",
        "topics": ["linked-list", "heap", "divide-and-conquer"],
        "description": "You are given an array of k linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list.",
        "examples": [
            {"input": "lists = [[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]"}
        ],
        "constraints": ["k == lists.length", "0 <= k <= 10^4"],
        "hints": ["Use a min-heap of size k", "Always extract minimum"],
        "optimal_complexity": {"time": "O(N log k)", "space": "O(k)"}
    },
]


class InterviewService:

    async def generate_question(self, difficulty: str = "medium",
                                 topics: List[str] = None,
                                 session_id: str = "") -> Dict:
        cache_key = f"interview:q:{difficulty}:{'-'.join(sorted(topics or []))}:{session_id}"
        cached = await get_cache(cache_key)
        if cached:
            return cached

        prompt = f"""Generate a DSA interview question.
Difficulty: {difficulty}
Topics: {', '.join(topics) if topics else 'any'}

Return ONLY this JSON (no markdown):
{{
  "id": "unique_id",
  "title": "Problem Title",
  "difficulty": "{difficulty}",
  "topics": ["topic1"],
  "description": "Full problem statement with examples",
  "examples": [{{"input": "...", "output": "...", "explanation": "..."}}],
  "constraints": ["constraint1"],
  "hints": ["hint1", "hint2"],
  "optimal_complexity": {{"time": "O(?)", "space": "O(?)"}}
}}"""

        # Filter question bank by difficulty/topics for fallback
        candidates = QUESTION_BANK
        if difficulty:
            candidates = [q for q in candidates if q["difficulty"] == difficulty] or candidates
        if topics:
            candidates = [q for q in candidates
                          if any(t in q.get("topics", []) for t in topics)] or candidates
        fallback = candidates[0] if candidates else QUESTION_BANK[0]

        result = await _gemini(prompt, fallback)
        await set_cache(cache_key, result, expire=3600)
        return result

    async def evaluate_solution(self, question: Dict, code: str,
                                language: str, time_taken: int = 0) -> Dict:
        prompt = f"""You are a senior engineer conducting a DSA interview.
Question: {question.get('title', '')}
Language: {language}
Time taken: {time_taken}s

Code submitted:
```{language}
{code[:1500]}
```

Return ONLY this JSON:
{{
  "score": 75,
  "passed": true,
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "correctness": "correct|partially_correct|incorrect",
  "code_quality": "excellent|good|fair|poor",
  "optimal_approach": "brief description",
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "follow_up": "follow-up question"
}}"""

        fallback = {
            "score": 60,
            "passed": True,
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "correctness": "correct",
            "code_quality": "good",
            "optimal_approach": "Enable Gemini API for detailed feedback",
            "strengths": ["Solution is functional"],
            "improvements": ["Consider edge cases", "Optimize complexity"],
            "follow_up": "What is the time complexity of your solution?"
        }
        return await _gemini(prompt, fallback)

    async def get_hint(self, question: Dict, current_code: str = "",
                       hint_level: int = 1) -> Dict:
        prompt = f"""Candidate stuck on: "{question.get('title', '')}"
Hint level requested: {hint_level}/3 (1=gentle, 2=moderate, 3=strong)
Current code: {current_code[:500] if current_code else 'none yet'}

Return ONLY this JSON:
{{
  "hint": "the hint text",
  "direction": "what approach to think about",
  "example": "small concrete example if helpful",
  "level": {hint_level}
}}"""

        hints = question.get("hints", ["Think about the data structure", "Consider time complexity"])
        idx = min(hint_level - 1, len(hints) - 1)
        fallback = {
            "hint": hints[idx] if hints else "Think carefully about the constraints",
            "direction": "Review the problem constraints carefully",
            "example": "",
            "level": hint_level
        }
        return await _gemini(prompt, fallback)

    async def evaluate_explanation(self, question: Dict, explanation: str) -> Dict:
        prompt = f"""Evaluate explanation for "{question.get('title', '')}":
"{explanation}"

Return ONLY this JSON:
{{
  "score": 80,
  "clarity": "clear|unclear",
  "mentions_complexity": true,
  "mentions_approach": true,
  "feedback": "brief feedback",
  "missing_points": ["point1"]
}}"""

        fallback = {
            "score": 70,
            "clarity": "clear",
            "mentions_complexity": len(explanation) > 100,
            "mentions_approach": len(explanation) > 50,
            "feedback": "Enable Gemini for detailed evaluation",
            "missing_points": []
        }
        return await _gemini(prompt, fallback)


interview_service = InterviewService()