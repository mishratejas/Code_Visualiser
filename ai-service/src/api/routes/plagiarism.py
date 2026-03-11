"""
Plagiarism Detection Routes
POST /api/v1/plagiarism/check    — check full contest
POST /api/v1/plagiarism/compare  — compare exactly 2 submissions
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from src.services.plagiarism_service import plagiarism_service

router = APIRouter()


class SubmissionItem(BaseModel):
    id: Optional[str] = ""
    submission_id: Optional[str] = ""
    user_id: str
    code: str
    language: str


class ContestCheckRequest(BaseModel):
    contest_id: str
    submissions: List[SubmissionItem]


class CompareRequest(BaseModel):
    submission1: SubmissionItem
    submission2: SubmissionItem


@router.post("/check")
async def check_contest(req: ContestCheckRequest):
    """
    Check all submissions in a contest for plagiarism.
    Uses Winnowing (token fingerprinting) + AST similarity.
    O(n²) pairs — suitable for contests with < 500 submissions.
    """
    subs = [s.dict() for s in req.submissions]
    # Normalise id field
    for s in subs:
        if not s.get("id"):
            s["id"] = s.get("submission_id", "")
    result = await plagiarism_service.check_contest(req.contest_id, subs)
    return {"success": True, "data": result}


@router.post("/compare")
async def compare_two(req: CompareRequest):
    """Compare exactly two submissions"""
    result = await plagiarism_service.compare_pair(req.submission1.dict(), req.submission2.dict())
    return {"success": True, "data": result}