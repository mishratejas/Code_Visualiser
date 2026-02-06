"""
API package - FastAPI routes and schemas
"""
from src.api.routes import analysis, interview, plagiarism, recommendations

__all__ = [
    'analysis',
    'interview',
    'plagiarism',
    'recommendations'
]