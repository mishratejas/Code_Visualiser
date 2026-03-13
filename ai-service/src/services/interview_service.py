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

# Lazy import Gemini only if available
_client = None
if GEMINI_READY:
    try:
        from google import genai as _genai_sdk
        _client = _genai_sdk.Client(api_key=Config.GEMINI_API_KEY)
        logger.info(f"Gemini client initialized for interview service")
    except Exception as e:
        logger.error(f"Failed to init Gemini: {e}")
        _client = None


async def _gemini(prompt: str, fallback: dict) -> dict:
    if _client is None:
        return fallback
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(
            None,
            lambda: _client.models.generate_content(model=Config.GEMINI_MODEL, contents=prompt)
        )
        text = resp.text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return fallback


QUESTION_BANK = [
    {
        "id": "q1", "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "difficulty": "easy", "topics": ["array", "hash-table"],
        "sample_input": "nums = [2,7,11,15], target = 9",
        "sample_output": "[0,1]",
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        "hints": ["Try using a hash map to store seen numbers and their indices."],
        "time_limit": 30,
    },
    {
        "id": "q2", "title": "Longest Palindromic Substring",
        "description": "Given a string s, return the longest palindromic substring in s.",
        "difficulty": "medium", "topics": ["string", "dynamic-programming"],
        "sample_input": 's = "babad"',
        "sample_output": '"bab"',
        "constraints": ["1 <= s.length <= 1000"],
        "hints": ["Expand around each character as center."],
        "time_limit": 45,
    },
    {
        "id": "q3", "title": "Coin Change",
        "description": "Given coins and an amount, return the minimum number of coins needed to make up that amount. Return -1 if impossible.",
        "difficulty": "medium", "topics": ["dynamic-programming"],
        "sample_input": "coins = [1,5,11], amount = 15",
        "sample_output": "3",
        "constraints": ["1 <= coins.length <= 12", "0 <= amount <= 10^4"],
        "hints": ["Use bottom-up DP: dp[i] = minimum coins for amount i."],
        "time_limit": 40,
    },
]


class InterviewService:

    async def get_question(self, difficulty: str = "medium",
                           topic: Optional[str] = None,
                           user_id: str = "") -> Dict:
        cache_key = f"interview_q:{difficulty}:{topic}"
        cached = await get_cache(cache_key)
        if cached:
            return cached

        prompt = f"""Generate a DSA interview question.
Difficulty: {difficulty}
Topic: {topic or "any (array, tree, graph, dp, string)"}

Return ONLY valid JSON, no markdown:
{{
  "id": "unique-id",
  "title": "Question Title",
  "description": "Full problem statement with examples",
  "difficulty": "{difficulty}",
  "topics": ["topic1"],
  "sample_input": "example input",
  "sample_output": "expected output",
  "constraints": ["constraint1"],
  "hints": ["hint1"],
  "time_limit": 30,
  "follow_up": "harder follow-up question"
}}"""

        candidates = [q for q in QUESTION_BANK if q["difficulty"] == difficulty]
        fallback = candidates[0] if candidates else QUESTION_BANK[1]

        result = await _gemini(prompt, fallback)
        await set_cache(cache_key, result, expire=1800)
        return result

    async def evaluate_solution(self, code: str, language: str,
                                question: Dict, explanation: str = "") -> Dict:
        prompt = f"""You are a senior engineer conducting a DSA interview.
Evaluate this solution to: "{question.get('title', 'DSA Problem')}"

Problem: {question.get('description', '')[:400]}

{language} solution:
```
{code[:2000]}
```

Candidate explanation: "{explanation}"

Return ONLY valid JSON:
{{
  "overall_score": 0,
  "scores": {{"correctness": 0, "efficiency": 0, "code_quality": 0, "explanation": 0}},
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "is_optimal": false,
  "optimal_approach": "brief description",
  "feedback": "detailed feedback",
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "grade": "A"
}}"""

        fallback = {
            "overall_score": 65,
            "scores": {"correctness": 65, "efficiency": 60, "code_quality": 70, "explanation": 60},
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "is_optimal": False,
            "optimal_approach": "Enable Gemini API for detailed feedback",
            "feedback": "Solution received. Add GEMINI_API_KEY for AI evaluation.",
            "strengths": ["Code submitted successfully"],
            "improvements": ["Consider edge cases", "Optimize complexity"],
            "grade": "C",
        }
        return await _gemini(prompt, fallback)

    async def get_hint(self, code: str, question: Dict, hint_level: int = 1) -> Dict:
        prompt = f"""Candidate stuck on: "{question.get('title', '')}"
Hint level: {hint_level}/3 (1=vague, 3=near solution)

Their code so far:
```
{code[:800]}
```

Return ONLY valid JSON:
{{
  "hint": "the hint text",
  "hint_level": {hint_level},
  "is_final_hint": {"true" if hint_level >= 3 else "false"},
  "direction": "brief direction"
}}"""

        hints = question.get("hints", ["Think about the data structure you need."])
        fallback = {
            "hint": hints[min(hint_level - 1, len(hints) - 1)],
            "hint_level": hint_level,
            "is_final_hint": hint_level >= 3,
            "direction": "Review the problem constraints carefully",
        }
        return await _gemini(prompt, fallback)

    async def check_explanation(self, explanation: str, question: Dict) -> Dict:
        lower = explanation.lower()
        fallback = {
            "score": 60,
            "mentions_time_complexity":  "time" in lower or "o(" in lower,
            "mentions_space_complexity": "space" in lower or "memory" in lower,
            "mentions_approach":         len(explanation) > 50,
            "mentions_edge_cases":       "edge" in lower or "empty" in lower,
            "missing": [],
            "feedback": "Explanation received.",
        }

        prompt = f"""Evaluate explanation for "{question.get('title', '')}":
"{explanation}"

Return ONLY valid JSON:
{{
  "score": 0,
  "mentions_time_complexity": false,
  "mentions_space_complexity": false,
  "mentions_approach": false,
  "mentions_edge_cases": false,
  "missing": [],
  "feedback": "brief feedback"
}}"""
        return await _gemini(prompt, fallback)


interview_service = InterviewService()