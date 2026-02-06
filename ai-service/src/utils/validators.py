"""
Input validation utilities
"""
import re
from typing import List
import logging

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error"""
    pass


def validate_code_length(code: str, max_length: int = 50000) -> bool:
    """Validate code length"""
    if not code:
        raise ValidationError("Code cannot be empty")
    
    if len(code) > max_length:
        raise ValidationError(f"Code exceeds maximum length of {max_length} characters")
    
    return True


def validate_language(language: str) -> bool:
    """Validate programming language"""
    valid_languages = ['python', 'java', 'cpp', 'c++', 'javascript', 'js']
    
    if not language:
        raise ValidationError("Language is required")
    
    if language.lower() not in valid_languages:
        raise ValidationError(f"Unsupported language: {language}")
    
    return True


def validate_submission_id(submission_id: str) -> bool:
    """Validate submission ID format"""
    if not submission_id:
        raise ValidationError("Submission ID is required")
    
    if not re.match(r'^[a-zA-Z0-9-_]+$', submission_id):
        raise ValidationError("Invalid submission ID format")
    
    return True


def validate_user_id(user_id: str) -> bool:
    """Validate user ID format"""
    if not user_id:
        raise ValidationError("User ID is required")
    
    if not re.match(r'^[a-zA-Z0-9-_]+$', user_id):
        raise ValidationError("Invalid user ID format")
    
    return True


def validate_difficulty(difficulty: str) -> bool:
    """Validate difficulty level"""
    valid_difficulties = ['easy', 'medium', 'hard']
    
    if difficulty and difficulty.lower() not in valid_difficulties:
        raise ValidationError(f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}")
    
    return True


def validate_limit(limit: int, max_limit: int = 100) -> bool:
    """Validate limit parameter"""
    if limit <= 0:
        raise ValidationError("Limit must be positive")
    
    if limit > max_limit:
        raise ValidationError(f"Limit cannot exceed {max_limit}")
    
    return True


def validate_score(score: float) -> bool:
    """Validate score is between 0 and 1"""
    if not 0 <= score <= 1:
        raise ValidationError("Score must be between 0 and 1")
    
    return True


def validate_topics(topics: List[str]) -> bool:
    """Validate topics list"""
    if not topics:
        return True
    
    if not isinstance(topics, list):
        raise ValidationError("Topics must be a list")
    
    if len(topics) > 10:
        raise ValidationError("Maximum 10 topics allowed")
    
    for topic in topics:
        if not isinstance(topic, str):
            raise ValidationError("Each topic must be a string")
        
        if not re.match(r'^[a-zA-Z0-9-_\s]+$', topic):
            raise ValidationError(f"Invalid topic format: {topic}")
    
    return True


def sanitize_code(code: str) -> str:
    """Sanitize code input"""
    # Remove null bytes
    code = code.replace('\x00', '')
    
    # Normalize line endings
    code = code.replace('\r\n', '\n')
    
    return code