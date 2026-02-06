from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import asyncio

from src.api.schemas import (
    PlagiarismCheckRequest,
    PlagiarismCheckResponse,
    SimilarityPair
)
from src.services.plagiarism_service import PlagiarismService
from src.cache import set_cache, get_cache

router = APIRouter()
plagiarism_service = PlagiarismService()

@router.post("/check", response_model=PlagiarismCheckResponse)
async def check_plagiarism(request: PlagiarismCheckRequest, background_tasks: BackgroundTasks):
    """
    Check for plagiarism in contest submissions
    """
    try:
        # Check cache first
        cache_key = f"plagiarism:{request.contest_id}"
        cached_result = await get_cache(cache_key)
        if cached_result:
            return PlagiarismCheckResponse(**cached_result)
        
        # Run plagiarism check
        result = await plagiarism_service.check_contest(
            request.contest_id,
            request.submissions
        )
        
        # Cache result for 1 hour
        await set_cache(cache_key, result.dict(), expire=3600)
        
        # Store result in background
        background_tasks.add_task(
            store_plagiarism_result,
            request.contest_id,
            result
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plagiarism check failed: {str(e)}")

@router.post("/compare")
async def compare_two_submissions(submission1: dict, submission2: dict):
    """
    Compare two specific submissions
    """
    try:
        similarity = await plagiarism_service.compare_pair(
            submission1,
            submission2
        )
        
        return {
            "similarity": similarity,
            "is_suspicious": similarity > 0.85
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/contest/{contest_id}/results")
async def get_plagiarism_results(contest_id: str):
    """
    Get plagiarism results for a contest
    """
    try:
        cache_key = f"plagiarism:{contest_id}"
        result = await get_cache(cache_key)
        
        if not result:
            return {
                "contest_id": contest_id,
                "status": "not_checked",
                "message": "Run plagiarism check first"
            }
        
        return PlagiarismCheckResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get results: {str(e)}")

async def store_plagiarism_result(contest_id: str, result: PlagiarismCheckResponse):
    """
    Store plagiarism result in database (background task)
    """
    try:
        # In practice, store in your database
        # For now, just log it
        print(f"Stored plagiarism result for contest {contest_id}")
        
    except Exception as e:
        print(f"Failed to store plagiarism result: {e}")