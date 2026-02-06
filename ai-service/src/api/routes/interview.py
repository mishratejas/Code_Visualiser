from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, List
import uuid
import json
import asyncio

from src.api.schemas import (
    InterviewStartRequest,
    InterviewResponse,
    ExplanationCheckRequest,
    ExplanationCheckResponse
)
from src.services.interview_service import InterviewService
from src.core.algorithms.dsa_questions import QuestionBank

router = APIRouter()
interview_service = InterviewService()
question_bank = QuestionBank()

# Active interview sessions
active_interviews: Dict[str, Dict] = {}

@router.post("/start", response_model=InterviewResponse)
async def start_interview(request: InterviewStartRequest):
    """
    Start a new DSA interview session
    """
    try:
        # Generate interview ID
        interview_id = str(uuid.uuid4())
        
        # Select question based on difficulty and topics
        question = question_bank.get_question(
            difficulty=request.difficulty,
            topics=request.topics
        )
        
        # Calculate expiry time
        from datetime import datetime, timedelta
        started_at = datetime.utcnow()
        expires_at = started_at + timedelta(minutes=request.duration_minutes)
        
        # Store interview session
        active_interviews[interview_id] = {
            "user_id": request.user_id,
            "question": question,
            "started_at": started_at,
            "expires_at": expires_at,
            "current_question": 0,
            "answers": [],
            "scores": []
        }
        
        return InterviewResponse(
            interview_id=interview_id,
            question=question,
            started_at=started_at,
            expires_at=expires_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@router.post("/{interview_id}/submit")
async def submit_solution(interview_id: str, code: str, explanation: str = ""):
    """
    Submit solution for interview question
    """
    try:
        if interview_id not in active_interviews:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        interview = active_interviews[interview_id]
        
        # Evaluate solution
        evaluation = await interview_service.evaluate_solution(
            code=code,
            question=interview["question"],
            explanation=explanation
        )
        
        # Store answer
        interview["answers"].append({
            "code": code,
            "explanation": explanation,
            "evaluation": evaluation,
            "submitted_at": datetime.utcnow()
        })
        
        # Generate follow-up question if needed
        follow_up = None
        if evaluation["score"] < 0.7:
            follow_up = interview_service.generate_follow_up_question(
                interview["question"],
                evaluation
            )
        
        return {
            "evaluation": evaluation,
            "follow_up_question": follow_up,
            "next_step": "explanation" if not explanation else "complete"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit solution: {str(e)}")

@router.post("/check-explanation")
async def check_explanation(request: ExplanationCheckRequest):
    """
    Check if user's explanation is complete
    """
    try:
        result = await interview_service.check_explanation(
            code=request.code,
            explanation=request.explanation,
            question_id=request.question_id
        )
        
        return ExplanationCheckResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check explanation: {str(e)}")

@router.get("/{interview_id}/report")
async def get_interview_report(interview_id: str):
    """
    Get complete interview report
    """
    try:
        if interview_id not in active_interviews:
            raise HTTPException(status_code=404, detail="Interview session not found")
        
        interview = active_interviews[interview_id]
        
        # Generate report
        report = await interview_service.generate_report(interview)
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.websocket("/{interview_id}/ws")
async def interview_websocket(websocket: WebSocket, interview_id: str):
    """
    WebSocket for real-time interview
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "code_submit":
                # Evaluate code
                evaluation = await interview_service.evaluate_solution(
                    code=message["code"],
                    question=active_interviews[interview_id]["question"]
                )
                
                # Send evaluation
                await websocket.send_json({
                    "type": "evaluation",
                    "data": evaluation
                })
                
            elif message["type"] == "explanation_submit":
                # Check explanation
                result = await interview_service.check_explanation(
                    code=message.get("code", ""),
                    explanation=message["explanation"],
                    question_id=active_interviews[interview_id]["question"]["id"]
                )
                
                await websocket.send_json({
                    "type": "explanation_feedback",
                    "data": result
                })
                
            elif message["type"] == "hint_request":
                # Provide hint
                hint = interview_service.provide_hint(
                    active_interviews[interview_id]["question"],
                    message.get("current_approach", "")
                )
                
                await websocket.send_json({
                    "type": "hint",
                    "data": hint
                })
                
    except WebSocketDisconnect:
        print(f"Client disconnected from interview {interview_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()