"""
API Routes package
"""
from src.api.routes import analysis, interview, plagiarism, recommendations

# Export all routers
__all__ = [
    'analysis',
    'interview',
    'plagiarism',
    'recommendations'
]