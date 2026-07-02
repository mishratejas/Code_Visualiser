"""
Recommendations Routes
POST /api/v1/recommendations/problems      — get personalized problems
POST /api/v1/recommendations/learning-path — get learning path
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional

from src.services.recommendation_service import recommendation_service

router = APIRouter()


class RecommendRequest(BaseModel):
    user_stats: Dict
    user_id: Optional[str] = ""
    solved_problems: Optional[List[Dict]] = []
    available_problems: Optional[List[Dict]] = []
    limit: Optional[int] = 8


class LearningPathRequest(BaseModel):
    user_stats: Dict
    user_id: Optional[str] = ""
    target_role: Optional[str] = "sde"


@router.post("/problems")
async def get_recommendations(req: RecommendRequest):
    result = await recommendation_service.get_recommendations(
        req.user_stats, req.solved_problems, req.available_problems, req.limit, req.user_id
    )
    return {"success": True, "data": result}


@router.post("/learning-path")
async def learning_path(req: LearningPathRequest):
    result = await recommendation_service.get_learning_path(req.user_stats, req.target_role, req.user_id)
    return {"success": True, "data": result}