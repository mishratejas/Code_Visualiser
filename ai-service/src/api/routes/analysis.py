"""
Analysis API Routes
POST /api/v1/analyze/code        — analyze a code submission
POST /api/v1/analyze/complexity  — quick complexity-only analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.services.analysis_service import analysis_service

router = APIRouter()


class AnalyzeRequest(BaseModel):
    code: str
    language: str                   # python | javascript | java | cpp
    submission_id: Optional[str] = ""
    runtime_ms: Optional[int] = 0
    test_cases_passed: Optional[int] = 0
    total_test_cases: Optional[int] = 0


@router.post("/code")
async def analyze_code(req: AnalyzeRequest):
    """Full analysis: complexity + quality + anti-patterns + suggestions"""
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Code is required")
    if len(req.code) > 50_000:
        raise HTTPException(status_code=400, detail="Code too long (max 50k chars)")

    result = await analysis_service.analyze_code(
        code=req.code,
        language=req.language,
        runtime_ms=req.runtime_ms,
        test_cases_passed=req.test_cases_passed,
        total_test_cases=req.total_test_cases,
        submission_id=req.submission_id,
    )
    return {"success": True, "data": result}


@router.post("/complexity")
async def quick_complexity(req: AnalyzeRequest):
    """Quick structural metrics only (no Gemini call, instant)"""
    from src.services.analysis_service import extract_structural_metrics
    m = extract_structural_metrics(req.code, req.language)
    return {
        "success": True,
        "data": {
            "lines_of_code":          m.lines_of_code,
            "function_count":         m.function_count,
            "loop_count":             m.loop_count,
            "max_nesting_depth":      m.max_nesting_depth,
            "cyclomatic_complexity":  m.cyclomatic_complexity,
            "comment_density":        round(m.comment_density, 2),
            "uses_recursion":         m.uses_recursion,
            "uses_dp":                m.uses_dp,
            "uses_sorting":           m.uses_sorting,
            "uses_binary_search":     m.uses_binary_search,
        }
    }