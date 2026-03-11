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
from src.cache import get_cache, set_cache

logger = logging.getLogger(__name__)

# Multi-key Gemini pool — rotates keys on quota/rate errors
_gemini_models: list = []
_gemini_key_idx = 0

if GEMINI_READY:
    try:
        import google.generativeai as genai
        for _key in Config.GEMINI_API_KEYS:
            try:
                _client = genai.GenerativeModel.__new__(genai.GenerativeModel)
                genai.configure(api_key=_key)
                _model = genai.GenerativeModel(Config.GEMINI_MODEL)
                _gemini_models.append((_key, _model))
                logger.info(f"Gemini key loaded: ...{_key[-6:]}")
            except Exception as _ke:
                logger.error(f"Gemini key failed: {_ke}")
        logger.info(f"Gemini pool ready: {len(_gemini_models)} key(s)")
    except Exception as e:
        logger.error(f"Failed to init Gemini: {e}")

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
    m.uses_binary_search= bool(re.search(r'bisect|binary.search|mid\s*=', code_lower))
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
    m.uses_binary_search= bool(re.search(r'binarySearch|binary_search|mid\s*=', code_lower))
    m.uses_dp           = bool(re.search(r'\bdp\[|\bmemo\[', code_lower))
    m.uses_recursion    = len(re.findall(r'\b(\w+)\s*\(', code)) > len(set(re.findall(r'\b(\w+)\s*\(', code)))
    return m


def _calc_nesting(code: str) -> int:
    max_d, cur = 0, 0
    for ch in code:
        if ch == '{': cur += 1; max_d = max(max_d, cur)
        elif ch == '}': cur = max(0, cur - 1)
    if max_d == 0:  # Python — use indentation
        for line in code.split('\n'):
            indent = len(line) - len(line.lstrip())
            max_d = max(max_d, indent // 4)
    return max_d


async def _call_gemini(prompt: str, fallback: dict) -> dict:
    global _gemini_key_idx
    if not _gemini_models:
        return fallback
    # Try each key in round-robin order
    attempts = len(_gemini_models)
    for _ in range(attempts):
        idx = _gemini_key_idx % len(_gemini_models)
        key_label, model = _gemini_models[idx]
        try:
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            return json.loads(text)
        except Exception as e:
            err = str(e).lower()
            if 'quota' in err or 'rate' in err or '429' in err:
                logger.warning(f"Gemini key ...{key_label[-6:]} quota hit, rotating")
                _gemini_key_idx += 1
            else:
                logger.error(f"Gemini analysis failed: {e}")
                return fallback
    logger.error("All Gemini keys exhausted — returning fallback")
    return fallback


class AnalysisService:

    async def analyze_code(self, code: str, language: str,
                           runtime_ms: int = 0,
                           test_cases_passed: int = 0,
                           total_test_cases: int = 0,
                           submission_id: str = "") -> Dict:

        cache_key = f"analysis:{submission_id}" if submission_id else None
        if cache_key:
            cached = await get_cache(cache_key)
            if cached:
                return cached

        metrics = extract_structural_metrics(code, language)

        prompt = f"""Analyze this {language} code and return ONLY valid JSON, no markdown fences.

Code (first 2000 chars):
{code[:2000]}

Already computed metrics:
- lines_of_code: {metrics.lines_of_code}
- function_count: {metrics.function_count}
- loop_count: {metrics.loop_count}
- max_nesting_depth: {metrics.max_nesting_depth}
- cyclomatic_complexity: {metrics.cyclomatic_complexity}
- uses_recursion: {metrics.uses_recursion}
- uses_dp: {metrics.uses_dp}
- uses_sorting: {metrics.uses_sorting}
- runtime_ms: {runtime_ms}, passed: {test_cases_passed}/{total_test_cases}

Return this exact JSON structure:
{{
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "quality_label": "poor",
  "quality_score": 0.5,
  "performance_rating": "acceptable",
  "anti_patterns": [{{"type": "...", "description": "...", "severity": "low"}}],
  "suggestions": ["suggestion1"],
  "bottleneck_analysis": ["bottleneck1"],
  "algorithm_detected": "brute force",
  "explanation": "one sentence"
}}"""

        fallback = {
            "time_complexity":    self._complexity_fallback(metrics),
            "space_complexity":   "O(n)" if (metrics.uses_hashmap or metrics.uses_dp) else "O(1)",
            "quality_label":      self._quality_label(metrics, test_cases_passed, total_test_cases),
            "quality_score":      self._quality_score(metrics, test_cases_passed, total_test_cases),
            "performance_rating": "optimized" if runtime_ms < 200 else "acceptable",
            "anti_patterns":      self._antipatterns(metrics, code),
            "suggestions":        self._suggestions(metrics),
            "bottleneck_analysis": [],
            "algorithm_detected": self._algorithm(metrics),
            "explanation":        "Analysis based on structural metrics (Gemini not configured)",
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

    def _complexity_fallback(self, m: StructuralMetrics) -> str:
        if m.uses_dp:            return "O(n²)"
        if m.uses_binary_search: return "O(log n)"
        if m.loop_count >= 3:    return "O(n³)"
        if m.loop_count >= 2:    return "O(n²)"
        if m.loop_count == 1:    return "O(n)"
        if m.uses_recursion:     return "O(n)"
        return "O(1)"

    def _quality_score(self, m: StructuralMetrics, passed: int, total: int) -> float:
        score = 0.5
        if m.comment_density > 0.1: score += 0.1
        if m.function_count > 0:    score += 0.1
        if m.cyclomatic_complexity < 10: score += 0.1
        if total > 0 and passed == total: score += 0.2
        return round(min(1.0, score), 2)

    def _quality_label(self, m: StructuralMetrics, passed: int, total: int) -> str:
        s = self._quality_score(m, passed, total)
        if s >= 0.8: return "excellent"
        if s >= 0.6: return "good"
        if s >= 0.4: return "fair"
        return "poor"

    def _antipatterns(self, m: StructuralMetrics, code: str) -> List[Dict]:
        out = []
        if m.loop_count >= 3:
            out.append({"type": "brute_force", "description": "Multiple nested loops", "severity": "medium"})
        if m.max_nesting_depth > 4:
            out.append({"type": "deep_nesting", "description": f"Nesting depth {m.max_nesting_depth}", "severity": "medium"})
        if re.search(r'len\(.*\).*len\(.*\)', code):
            out.append({"type": "repeated_computation", "description": "Computing len() multiple times", "severity": "low"})
        return out

    def _suggestions(self, m: StructuralMetrics) -> List[str]:
        out = []
        if m.comment_density < 0.05:     out.append("Add comments to explain your logic.")
        if m.loop_count >= 3:            out.append("Consider reducing nested loops.")
        if m.cyclomatic_complexity > 10: out.append(f"Cyclomatic complexity {m.cyclomatic_complexity} is high — refactor.")
        if m.max_nesting_depth > 4:      out.append("Flatten deep nesting with early returns.")
        return out[:4]

    def _algorithm(self, m: StructuralMetrics) -> str:
        if m.uses_dp:            return "dynamic programming"
        if m.uses_binary_search: return "binary search"
        if m.uses_sorting:       return "sorting-based"
        if m.uses_hashmap:       return "hash map"
        if m.uses_recursion:     return "recursive"
        if m.loop_count >= 2:    return "brute force"
        return "iterative"


analysis_service = AnalysisService()