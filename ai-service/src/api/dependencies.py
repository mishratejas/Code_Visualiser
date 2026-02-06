"""
FastAPI dependencies for authentication, rate limiting, etc.
"""
from fastapi import Header, HTTPException, Depends
from typing import Optional
import jwt
import os
from functools import lru_cache


# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"


async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Verify API key from request header
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        API key if valid
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key is required"
        )
    
    # In production, verify against database
    # For now, simple check
    valid_keys = os.getenv("VALID_API_KEYS", "").split(",")
    
    if x_api_key not in valid_keys and valid_keys != ['']:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
        )
    
    return x_api_key


async def verify_jwt_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify JWT token from Authorization header
    
    Args:
        authorization: Bearer token from Authorization header
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required"
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme"
            )
        
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        return payload
        
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format"
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


async def get_current_user(token_payload: dict = Depends(verify_jwt_token)) -> dict:
    """
    Get current user from token payload
    
    Args:
        token_payload: Decoded JWT token
        
    Returns:
        User information
    """
    user_id = token_payload.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )
    
    # In production, fetch user from database
    return {
        "user_id": user_id,
        "email": token_payload.get("email"),
        "role": token_payload.get("role", "user")
    }


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Require admin role
    
    Args:
        current_user: Current user information
        
    Returns:
        User information if admin
        
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    return current_user


class RateLimitConfig:
    """Rate limiting configuration"""
    
    def __init__(self, calls: int, period: int):
        """
        Initialize rate limit config
        
        Args:
            calls: Number of calls allowed
            period: Time period in seconds
        """
        self.calls = calls
        self.period = period


@lru_cache()
def get_settings():
    """Get application settings"""
    return {
        "app_name": os.getenv("APP_NAME", "AI Code Analysis Service"),
        "debug": os.getenv("DEBUG", "False").lower() == "true",
        "api_version": "v1",
        "max_code_length": int(os.getenv("MAX_CODE_LENGTH", "50000")),
        "allowed_languages": ["python", "java", "cpp", "javascript"],
    }


async def validate_code_length(code: str, settings: dict = Depends(get_settings)):
    """
    Validate code length
    
    Args:
        code: Source code
        settings: Application settings
        
    Raises:
        HTTPException: If code exceeds max length
    """
    max_length = settings["max_code_length"]
    
    if len(code) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"Code exceeds maximum length of {max_length} characters"
        )


async def validate_language(language: str, settings: dict = Depends(get_settings)):
    """
    Validate programming language
    
    Args:
        language: Programming language
        settings: Application settings
        
    Raises:
        HTTPException: If language is not supported
    """
    allowed = settings["allowed_languages"]
    
    if language.lower() not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Language '{language}' not supported. Allowed: {', '.join(allowed)}"
        )