from fastapi import APIRouter, HTTPException, Depends
from typing import List

from src.api.schemas import (
    RecommendationRequest,
    ProblemRecommendation
)
from src.services.recommendation_service import RecommendationService

router = APIRouter()
recommendation_service = RecommendationService()

@router.post("/problems", response_model=List[ProblemRecommendation])
async def get_problem_recommendations(request: RecommendationRequest):
    """
    Get personalized problem recommendations
    """
    try:
        recommendations = await recommendation_service.get_recommendations(
            user_id=request.user_id,
            limit=request.limit,
            include_solved=request.include_solved
        )
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/user/{user_id}/skill-gap")
async def analyze_skill_gap(user_id: str):
    """
    Analyze user's skill gaps based on submissions
    """
    try:
        skill_gap = await recommendation_service.analyze_skill_gap(user_id)
        
        return {
            "user_id": user_id,
            "skill_gap": skill_gap,
            "recommended_topics": recommendation_service.get_recommended_topics(skill_gap)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze skill gap: {str(e)}")

@router.get("/user/{user_id}/learning-path")
async def get_learning_path(user_id: str, topic: str = None):
    """
    Get personalized learning path
    """
    try:
        learning_path = await recommendation_service.generate_learning_path(
            user_id=user_id,
            topic=topic
        )
        
        return learning_path
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {str(e)}")

@router.get("/similar/{problem_id}")
async def get_similar_problems(problem_id: str, limit: int = 5):
    """
    Get problems similar to given problem
    """
    try:
        similar = await recommendation_service.find_similar_problems(
            problem_id=problem_id,
            limit=limit
        )
        
        return {
            "problem_id": problem_id,
            "similar_problems": similar
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find similar problems: {str(e)}")