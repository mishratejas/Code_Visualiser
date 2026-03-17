"""
Recommendation Service — Gemini + rule-based fallback
"""
import json
import re
import logging
from typing import List, Dict, Optional, Any

from src.config import Config, GEMINI_READY
from src.cache import get_cache, set_cache

logger = logging.getLogger(__name__)

_model = None
if GEMINI_READY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=Config.GEMINI_API_KEY)
        _model = genai.GenerativeModel(Config.GEMINI_MODEL)
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")


async def _gemini(prompt: str, fallback: Any) -> Any:
    if _model is None:
        return fallback
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(
            None,
            lambda: _model.generate_content(prompt)
        )
        text = resp.text.strip()
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini recommendation failed: {e}")
        return fallback


class RecommendationService:

    async def get_recommendations(self, user_stats: Dict, solved_problems: List[Dict],
                                   available_problems: List[Dict], limit: int = 8) -> List[Dict]:
        cache_key = f"rec:{user_stats.get('userId', '')}:{len(solved_problems)}"
        cached = await get_cache(cache_key)
        if cached:
            return cached

        solved_titles = {p.get("title", "") for p in solved_problems}
        unsolved = [p for p in available_problems if p.get("title") not in solved_titles]
        if not unsolved:
            return []

        topic_counts: Dict[str, int] = {}
        for p in solved_problems:
            for tag in p.get("tags", []):
                topic_counts[tag] = topic_counts.get(tag, 0) + 1

        strong = sorted(topic_counts, key=lambda t: -topic_counts[t])[:5]
        weak   = [t for t in topic_counts if topic_counts[t] <= 1]

        prompt = f"""Recommend {limit} problems for this user.
Easy solved: {user_stats.get('easySolved', 0)}, Medium: {user_stats.get('mediumSolved', 0)}, Hard: {user_stats.get('hardSolved', 0)}
Strong topics: {strong}
Weak topics: {weak}

Available problems (first 30):
{json.dumps([{{"id": str(p.get("_id","")), "title": p.get("title",""), "difficulty": p.get("difficulty",""), "tags": p.get("tags",[])}} for p in unsolved[:30]])}

Return ONLY a JSON array:
[{{"problem_id": "...", "title": "...", "reason": "why this helps", "priority": "high"}}]"""

        fallback = self._rule_based(unsolved, user_stats, weak, strong, limit)
        result = await _gemini(prompt, fallback)

        if isinstance(result, list) and result and "problem_id" in result[0]:
            id_map = {str(p.get("_id", "")): p for p in available_problems}
            enriched = []
            for rec in result[:limit]:
                pid = rec.get("problem_id", "")
                if pid in id_map:
                    enriched.append({**id_map[pid],
                                     "recommendation_reason": rec.get("reason", ""),
                                     "priority": rec.get("priority", "medium")})
            if enriched:
                await set_cache(cache_key, enriched, expire=900)
                return enriched

        await set_cache(cache_key, fallback, expire=900)
        return fallback

    def _rule_based(self, unsolved, stats, weak, strong, limit):
        easy, medium = stats.get("easySolved", 0), stats.get("mediumSolved", 0)
        target = ["easy"] if easy < 5 else ["easy","medium"] if medium < 10 else ["medium","hard"]

        def score(p):
            s = 2.0 if p.get("difficulty") in target else 0.0
            tags = p.get("tags", [])
            s += 1.5 * any(t in weak for t in tags)
            s += 0.5 * any(t in strong for t in tags)
            acc = p.get("acceptanceRate", 50) or 50
            s += 0.5 if 40 <= acc <= 70 else 0
            return s

        ranked = sorted(unsolved, key=score, reverse=True)
        return [{**p, "recommendation_reason": "Matches skill level", "priority": "high" if i < 3 else "medium"}
                for i, p in enumerate(ranked[:limit])]

    async def get_learning_path(self, user_stats: Dict, target_role: str = "sde") -> Dict:
        prompt = f"""Create a DSA learning path for {target_role} interviews.
Easy: {user_stats.get('easySolved',0)}, Medium: {user_stats.get('mediumSolved',0)}, Hard: {user_stats.get('hardSolved',0)}

Return ONLY valid JSON:
{{
  "title": "Your Personalized Path",
  "estimated_weeks": 8,
  "current_level": "intermediate",
  "phases": [{{"phase": 1, "title": "Arrays & Strings", "duration_weeks": 2, "focus_topics": ["array","string"], "target_problems": 20, "description": "..."}}],
  "daily_goal": "2-3 problems",
  "resources": ["NeetCode 150"]
}}"""

        fallback = {
            "title": "Standard DSA Path",
            "estimated_weeks": 8,
            "current_level": "intermediate",
            "phases": [
                {"phase": 1, "title": "Arrays & Strings",   "duration_weeks": 2, "focus_topics": ["array","string"],              "target_problems": 20, "description": "Foundation"},
                {"phase": 2, "title": "Trees & Graphs",     "duration_weeks": 2, "focus_topics": ["tree","graph"],                "target_problems": 20, "description": "Traversal"},
                {"phase": 3, "title": "Dynamic Programming","duration_weeks": 2, "focus_topics": ["dynamic-programming"],          "target_problems": 15, "description": "Optimization"},
                {"phase": 4, "title": "Advanced Topics",    "duration_weeks": 2, "focus_topics": ["heap","trie","bit-manipulation"],"target_problems": 15, "description": "Hard patterns"},
            ],
            "daily_goal": "2-3 problems",
            "resources": ["NeetCode 150", "Blind 75"],
        }
        return await _gemini(prompt, fallback)


recommendation_service = RecommendationService()