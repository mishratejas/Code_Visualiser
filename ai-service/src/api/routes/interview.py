"""
Interview Routes
GET  /api/v1/interview/question          — get DSA question
POST /api/v1/interview/evaluate          — evaluate solution
POST /api/v1/interview/hint              — get progressive hint
POST /api/v1/interview/check-explanation — check explanation quality
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

from src.services.interview_service import interview_service

router = APIRouter()


class QuestionRequest(BaseModel):
    difficulty: Optional[str] = "medium"
    topic: Optional[str] = None
    user_id: Optional[str] = ""


class EvaluateRequest(BaseModel):
    code: str
    language: str
    question: Dict
    explanation: Optional[str] = ""


class HintRequest(BaseModel):
    code: str
    question: Dict
    hint_level: Optional[int] = 1


class ExplainRequest(BaseModel):
    explanation: str
    question: Dict


@router.post("/question")
async def get_question(req: QuestionRequest):
    result = await interview_service.get_question(req.difficulty, req.topic, req.user_id)
    return {"success": True, "data": result}


@router.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    if not req.code.strip():
        raise HTTPException(400, "Code is required")
    result = await interview_service.evaluate_solution(req.code, req.language, req.question, req.explanation)
    return {"success": True, "data": result}


@router.post("/hint")
async def get_hint(req: HintRequest):
    result = await interview_service.get_hint(req.code, req.question, req.hint_level)
    return {"success": True, "data": result}


@router.post("/check-explanation")
async def check_explanation(req: ExplainRequest):
    result = await interview_service.check_explanation(req.explanation, req.question)
    return {"success": True, "data": result}