"""
Code Analysis Service
Uses: Python built-in ast module for structural metrics + Gemini for AI analysis
No ML models, no pickle files.
"""
import ast
import re
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass

from src.config import Config, GEMINI_READY
from src.cache import get_cache, set_cache, delete_cache

logger = logging.getLogger(__name__)

# Multi-key Gemini pool with automatic failover
_gemini_models = []
_current_key_index = 0

if GEMINI_READY:
    try:
        import google.generativeai as _genai_sdk
        for key in Config.GEMINI_API_KEYS:
            try:
                _genai_sdk.configure(api_key=key)
                model = _genai_sdk.GenerativeModel(Config.GEMINI_MODEL)
                _gemini_models.append((key, model))
                logger.info(f"Gemini key loaded: ...{key[-6:]}")
            except Exception as e:
                logger.warning(f"Failed to init Gemini key ...{key[-6:]}: {e}")
        logger.info(f"Gemini initialized with {len(_gemini_models)} key(s)")
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")

# Keep backward compat
_gemini_model = _gemini_models[0][1] if _gemini_models else None


@dataclass
class StructuralMetrics:
    lines_of_code:        int   = 0
    code_lines:           int   = 0
    comment_lines:        int   = 0
    blank_lines:          int   = 0
    function_count:       int   = 0
    class_count:          int   = 0
    loop_count:           int   = 0
    nested_loop_depth:    int   = 0
    conditional_count:    int   = 0
    max_nesting_depth:    int   = 0
    cyclomatic_complexity:int   = 1
    comment_density:      float = 0.0
    avg_line_length:      float = 0.0
    uses_recursion:       bool  = False
    uses_sorting:         bool  = False
    uses_hashmap:         bool  = False
    uses_binary_search:   bool  = False
    uses_dp:              bool  = False


def extract_structural_metrics(code: str, language: str) -> StructuralMetrics:
    m = StructuralMetrics()
    lines = code.split('\n')
    m.lines_of_code = len(lines)
    m.blank_lines   = sum(1 for l in lines if not l.strip())

    if language == 'python':
        return _python_metrics(code, m, lines)
    return _regex_metrics(code, language, m, lines)


def _python_metrics(code: str, m: StructuralMetrics, lines: list) -> StructuralMetrics:
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return _regex_metrics(code, 'python', m, lines)

    m.comment_lines   = sum(1 for l in lines if l.strip().startswith('#'))
    m.code_lines      = m.lines_of_code - m.blank_lines - m.comment_lines
    m.comment_density = m.comment_lines / max(m.lines_of_code, 1)
    m.avg_line_length = sum(len(l) for l in lines) / max(len(lines), 1)

    func_names = set()
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            m.function_count += 1
            func_names.add(node.name)
        elif isinstance(node, ast.ClassDef):
            m.class_count += 1
        elif isinstance(node, (ast.For, ast.While)):
            m.loop_count += 1
        elif isinstance(node, ast.If):
            m.conditional_count  += 1
            m.cyclomatic_complexity += 1
        elif isinstance(node, ast.BoolOp):
            m.cyclomatic_complexity += len(node.values) - 1

    # Recursion detection
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name) and child.func.id == node.name:
                        m.uses_recursion = True

    code_lower = code.lower()
    m.uses_sorting      = bool(re.search(r'\bsort(ed)?\b', code_lower))
    m.uses_hashmap      = bool(re.search(r'\bdict\b|\bdefaultdict\b|\bCounter\b', code))
    m.uses_binary_search= bool(re.search(r'bisect|binary.search|\bmid\b\s*=|\bmid\s*=', code_lower))
    m.uses_dp           = bool(re.search(r'dp\[|memo|lru_cache|@cache', code_lower))
    m.max_nesting_depth = _calc_nesting(code)
    return m


def _regex_metrics(code: str, language: str, m: StructuralMetrics, lines: list) -> StructuralMetrics:
    m.comment_lines   = sum(1 for l in lines if re.search(r'//.*$|/\*', l))
    m.code_lines      = m.lines_of_code - m.blank_lines - m.comment_lines
    m.comment_density = m.comment_lines / max(m.lines_of_code, 1)
    m.avg_line_length = sum(len(l) for l in lines) / max(len(lines), 1)
    m.loop_count        = len(re.findall(r'\b(for|while)\b', code))
    m.conditional_count = len(re.findall(r'\bif\b', code))
    m.function_count    = len(re.findall(r'\b(function|def|void|int|bool)\s+\w+\s*\(', code))
    m.cyclomatic_complexity = 1 + m.conditional_count + len(re.findall(r'&&|\|\|', code))
    m.max_nesting_depth = _calc_nesting(code)
    code_lower = code.lower()
    m.uses_sorting      = bool(re.search(r'\.sort\(|Arrays\.sort|Collections\.sort', code))
    m.uses_hashmap      = bool(re.search(r'HashMap|unordered_map|Map\(\)', code))
    m.uses_binary_search= bool(re.search(r'binarySearch|binary_search|\bmid\b\s*=|\bmid\s*=', code_lower))
    m.uses_dp           = bool(re.search(r'\bdp\[|\bmemo\[', code_lower))
    m.uses_recursion    = len(re.findall(r'\b(\w+)\s*\(', code)) > len(set(re.findall(r'\b(\w+)\s*\(', code)))
    m.nested_loop_depth = m.max_nesting_depth  # _calc_nesting now tracks loop depth
    return m


def _calc_nesting(code: str) -> int:
    """
    Calculate max loop nesting depth.
    Uses Python AST for Python code (accurate), brace-counting for C++/Java/JS.
    """
    import ast as _ast
    import re

    # ── Python: use AST (handles indentation correctly) ──────────────────────
    try:
        tree = _ast.parse(code)
        def _depth(node, cur=0):
            if isinstance(node, (_ast.For, _ast.While)):
                cur += 1
            return max((cur, *(_depth(c, cur) for c in _ast.iter_child_nodes(node))))
        return _depth(tree)
    except SyntaxError:
        pass

    # ── C++ / Java / JS: brace-depth tracking ────────────────────────────────
    max_depth = 0
    loop_depth = 0
    brace_depth = 0
    loop_brace_starts = []

    for line in code.split("\n"):
        stripped = line.strip()
        opens  = stripped.count("{")
        closes = stripped.count("}")
        is_loop = bool(re.search(r"\b(for|while)\b", stripped))

        if is_loop:
            loop_depth += 1
            max_depth = max(max_depth, loop_depth)
            loop_brace_starts.append(brace_depth + opens)  # depth AFTER the opening brace

        brace_depth += opens - closes

        # Pop when we close past a loop's opening brace
        while loop_brace_starts and brace_depth < loop_brace_starts[-1]:
            loop_brace_starts.pop()
            loop_depth = max(0, loop_depth - 1)

    return max_depth


async def _call_gemini(prompt: str, fallback: dict) -> dict:
    """Try each Gemini key in round-robin; fall back to rule-based on all failures."""
    global _current_key_index
    if not _gemini_models:
        logger.warning("⚠️  No Gemini models configured — returning rule-based fallback")
        return fallback

    logger.info(f"🤖  Calling Gemini ({len(_gemini_models)} key(s) available)...")

    import asyncio
    import google.generativeai as _genai_sdk

    GEMINI_CALL_TIMEOUT_SECONDS = 15  # per-key ceiling

    num_keys = len(_gemini_models)
    for attempt in range(num_keys):
        idx = (_current_key_index + attempt) % num_keys
        key, model = _gemini_models[idx]
        try:
            # Configure the key for this attempt, then call
            _genai_sdk.configure(api_key=key)
            loop = asyncio.get_event_loop()
            # Bounded wait: previously run_in_executor() had no timeout, so a
            # single hung key blocked the whole request (and with multiple keys,
            # could hang num_keys times over — worst case several minutes).
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: model.generate_content(prompt)),
                timeout=GEMINI_CALL_TIMEOUT_SECONDS,
            )
            text = response.text.strip()
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            logger.info(f"🔍 Gemini raw response (first 300 chars): {text[:300]}")
            result = json.loads(text)
            _current_key_index = idx
            logger.info(f"✅ Gemini analysis SUCCESS (key ...{key[-6:]}) — algorithm: {result.get('algorithm_detected','?')}, time: {result.get('time_complexity','?')}")
            return result
        except json.JSONDecodeError as e:
            logger.warning(f"Gemini key ...{key[-6:]} returned non-JSON (attempt {attempt+1}/{num_keys}): {e}\nRaw text: {text[:500]}")
            _current_key_index = (idx + 1) % num_keys
        except Exception as e:
            logger.warning(f"Gemini key ...{key[-6:]} failed (attempt {attempt+1}/{num_keys}): {type(e).__name__}: {e}")
            _current_key_index = (idx + 1) % num_keys

    logger.error("❌ All Gemini keys exhausted — using rule-based fallback. Check API keys/quota.")
    return fallback


class AnalysisService:

    async def analyze_code(self, code: str, language: str,
                           runtime_ms: int = 0,
                           test_cases_passed: int = 0,
                           total_test_cases: int = 0,
                           submission_id: str = "",
                           force_refresh: bool = False) -> Dict:

        cache_key = f"analysis:{submission_id}" if submission_id else None

        # Read cache only when not force_refresh
        if cache_key and not force_refresh:
            cached = await get_cache(cache_key)
            if cached:
                logger.info(f"📦 Cache hit for {cache_key}")
                return cached
        elif cache_key and force_refresh:
            # Delete stale entry so fresh result overwrites it properly
            await delete_cache(cache_key)
            logger.info(f"🔄 force_refresh=True — deleted stale cache for {cache_key}")

        metrics = extract_structural_metrics(code, language)

        # Detailed prompt that forces Gemini to read and understand the actual code
        prompt = f"""You are an expert competitive-programming code reviewer.
Carefully READ the entire code below, understand its algorithm, then return ONLY
a single valid JSON object (no markdown fences, no extra text).

=== CODE ({language}) ===
{code[:4000]}

=== RUNTIME CONTEXT ===
- runtime_ms: {runtime_ms}
- test_cases_passed: {test_cases_passed}/{total_test_cases}

=== INSTRUCTIONS ===
1. READ the code carefully top to bottom. Identify the EXACT algorithm implemented.
2. Derive time_complexity ONLY from the algorithmic logic — loops, recursion, and data structure ops:
   - Two pointers / merge over m+n elements → O(m+n)
   - Single loop over n elements → O(n)
   - Binary search (while low<=high, mid=(low+high)/2) → O(log n)
   - Nested loops over n → O(n^2)
   - Sorting n elements → O(n log n)
   - IGNORE cin/cout/input/output — I/O is NOT part of algorithmic complexity
   - NEVER say O(L) unless the only work is reading a single string character by character with no other logic
   Express complexity in terms of the meaningful input variables (n, m, etc.), NOT L.
3. Leave anti_patterns as [] if the code is clean and correct.
4. Give concrete, code-specific suggestions. Empty array [] is fine if no improvements needed.
5. quality_score: float 0.0-1.0. quality_label: "poor"|"fair"|"good"|"excellent".
6. performance_rating: "optimized"|"acceptable"|"inefficient".

Return exactly this JSON shape (no other keys, no markdown):
{{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "quality_label": "good",
  "quality_score": 0.75,
  "performance_rating": "optimized",
  "anti_patterns": [{{"type": "...", "description": "...", "severity": "low|medium|high"}}],
  "suggestions": ["specific suggestion about this code"],
  "bottleneck_analysis": ["specific bottleneck in this code"],
  "algorithm_detected": "binary search",
  "explanation": "One sentence summarising what this code does and its complexity."
}}"""

        # Gemini-only: fallback only used when ALL keys fail (quota exhausted).
        # Returns honest "unavailable" instead of wrong rule-based guesses.
        fallback = {
            "time_complexity":    "N/A (Gemini unavailable)",
            "space_complexity":   "N/A (Gemini unavailable)",
            "quality_label":      "fair",
            "quality_score":      0.5,
            "performance_rating": "acceptable",
            "anti_patterns":      [],
            "suggestions":        ["Enable Gemini API keys for full analysis."],
            "bottleneck_analysis": [],
            "algorithm_detected": "unknown (Gemini unavailable)",
            "explanation":        "Gemini API unavailable. Check API key quota and restart the AI service.",
            "ai_powered":         False,
        }

        ai_result = await _call_gemini(prompt, fallback)

        result = {
            **ai_result,
            "metrics": {
                "lines_of_code":        metrics.lines_of_code,
                "code_lines":           metrics.code_lines,
                "comment_lines":        metrics.comment_lines,
                "function_count":       metrics.function_count,
                "loop_count":           metrics.loop_count,
                "max_nesting_depth":    metrics.max_nesting_depth,
                "cyclomatic_complexity":metrics.cyclomatic_complexity,
                "comment_density":      round(metrics.comment_density, 2),
                "uses_recursion":       metrics.uses_recursion,
                "uses_dp":              metrics.uses_dp,
                "uses_sorting":         metrics.uses_sorting,
                "uses_hashmap":         metrics.uses_hashmap,
                "uses_binary_search":   metrics.uses_binary_search,
                "avg_line_length":      round(metrics.avg_line_length, 1),
            },
            "runtime_ms":        runtime_ms,
            "test_cases_passed": test_cases_passed,
            "total_test_cases":  total_test_cases,
        }

        if cache_key:
            await set_cache(cache_key, result, expire=3600)
        return result

    # Rule-based methods removed — Gemini handles all analysis


analysis_service = AnalysisService()