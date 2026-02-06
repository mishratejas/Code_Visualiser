from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import json

from src.api.schemas import (
    SubmissionAnalysisRequest,
    AnalysisResponse,
    BatchAnalysisRequest,
    ComparisonRequest
)
from src.services.analysis_service import AnalysisService
from src.cache import get_cache, set_cache

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/submission", response_model=AnalysisResponse)
async def analyze_submission(request: SubmissionAnalysisRequest):
    """
    Analyze a single code submission
    """
    try:
        result = await analysis_service.analyze_submission(request.dict())
        
        return AnalysisResponse(
            submission_id=request.submission_id,
            quality_score=result.quality_score,
            quality_label=result.quality_label,
            time_complexity=result.time_complexity,
            space_complexity=result.space_complexity,
            anti_patterns=result.anti_patterns,
            suggestions=result.suggestions,
            cyclomatic_complexity=result.cyclomatic_complexity,
            lines_of_code=result.lines_of_code,
            performance_rating=result.performance_rating,
            bottleneck_analysis=result.bottleneck_analysis,
            confidence=result.quality_confidence
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch")
async def batch_analyze(request: BatchAnalysisRequest):
    """
    Analyze multiple submissions in batch
    """
    try:
        results = await analysis_service.batch_analyze(request.submissions)
        
        return {
            "results": [
                {
                    "submission_id": sub.get("submission_id"),
                    "quality_score": res.quality_score,
                    "quality_label": res.quality_label,
                    "time_complexity": res.time_complexity
                }
                for sub, res in zip(request.submissions, results)
            ],
            "total_analyzed": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.post("/complexity")
async def estimate_complexity(code: str, language: str):
    """
    Estimate time and space complexity of code
    """
    try:
        # This is a simplified endpoint
        # In practice, you'd use the complexity model
        
        features = analysis_service.feature_extractor.extract_features(code, language)
        feature_dict = analysis_service.feature_extractor.features_to_dict(features)
        
        prediction = analysis_service.complexity_model.predict(feature_dict)
        
        return {
            "time_complexity": prediction["time_complexity"],
            "space_complexity": prediction["space_complexity"],
            "confidence": prediction["confidence"],
            "explanation": self._generate_complexity_explanation(prediction)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complexity analysis failed: {str(e)}")

@router.post("/compare")
async def compare_with_benchmark(request: ComparisonRequest):
    """
    Compare submission with benchmark solution
    """
    try:
        comparison = await analysis_service.compare_with_benchmark(
            request.submission_data,
            request.benchmark_data
        )
        
        return comparison
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

def _generate_complexity_explanation(prediction: dict) -> str:
    """Generate human-readable explanation for complexity"""
    time_comp = prediction["time_complexity"]
    
    explanations = {
        "O(1)": "Constant time - Excellent!",
        "O(log n)": "Logarithmic time - Very efficient!",
        "O(n)": "Linear time - Good performance",
        "O(n log n)": "Linearithmic time - Acceptable for sorting operations",
        "O(n²)": "Quadratic time - May be slow for large inputs",
        "O(n³)": "Cubic time - Consider optimizing",
        "O(2^n)": "Exponential time - May be too slow for practical use"
    }
    
    return explanations.get(time_comp, "Complexity analysis completed")