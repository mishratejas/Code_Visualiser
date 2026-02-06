from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Language(str, Enum):
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    JAVASCRIPT = "javascript"

class Verdict(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded"
    RUNTIME_ERROR = "runtime_error"
    COMPILATION_ERROR = "compilation_error"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    PARTIAL_ACCEPTED = "partial_accepted"

class ExecutionResult(BaseModel):
    test_case_index: int
    passed: bool
    input: str
    expected_output: str
    actual_output: Optional[str] = None
    runtime: Optional[int] = None
    memory: Optional[int] = None
    error: Optional[str] = None

class SubmissionAnalysisRequest(BaseModel):
    submission_id: str
    user_id: str
    problem_id: str
    code: str
    language: Language
    execution_results: Optional[Dict[str, Any]] = None
    problem_constraints: Optional[Dict[str, Any]] = None

class AntiPattern(BaseModel):
    type: str
    description: str
    severity: str = "medium"  # low, medium, high
    location: Optional[str] = None
    confidence: float

class AnalysisResponse(BaseModel):
    submission_id: str
    quality_score: float = Field(ge=0.0, le=1.0)
    quality_label: str  # poor, fair, good, excellent
    time_complexity: str
    space_complexity: Optional[str] = None
    anti_patterns: List[AntiPattern] = []
    suggestions: List[str] = []
    cyclomatic_complexity: Optional[int] = None
    lines_of_code: Optional[int] = None
    performance_rating: Optional[str] = None  # inefficient, acceptable, optimized
    bottleneck_analysis: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)

class BatchAnalysisRequest(BaseModel):
    submissions: List[SubmissionAnalysisRequest]

class ComparisonRequest(BaseModel):
    submission_data: SubmissionAnalysisRequest
    benchmark_data: Dict[str, Any]

class PlagiarismCheckRequest(BaseModel):
    contest_id: str
    submissions: List[Dict[str, Any]]

class SimilarityPair(BaseModel):
    submission1_id: str
    submission2_id: str
    similarity_score: float
    token_similarity: float
    ast_similarity: float
    structural_similarity: float

class PlagiarismCheckResponse(BaseModel):
    contest_id: str
    total_submissions: int
    suspicious_pairs: List[SimilarityPair]
    average_similarity: float
    checked_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewStartRequest(BaseModel):
    user_id: str
    difficulty: str = "medium"  # easy, medium, hard
    topics: List[str] = []
    duration_minutes: int = 30

class Question(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    topics: List[str]
    constraints: Optional[Dict[str, Any]] = None
    examples: List[Dict[str, Any]] = []

class InterviewResponse(BaseModel):
    interview_id: str
    question: Question
    started_at: datetime
    expires_at: datetime

class ExplanationCheckRequest(BaseModel):
    code: str
    explanation: str
    question_id: str

class ExplanationCheckResponse(BaseModel):
    is_correct: bool
    missing_elements: List[str] = []  # time_complexity, space_complexity, edge_cases, etc.
    feedback: str
    score: float

class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10
    include_solved: bool = False

class ProblemRecommendation(BaseModel):
    problem_id: str
    title: str
    difficulty: str
    score: float
    reasons: List[str]
    similarity_to_past_success: Optional[float] = None
    predicted_success_rate: Optional[float] = None