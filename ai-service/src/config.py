"""
Configuration management
"""
import os
from pathlib import Path
from typing import Any, Dict
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Application configuration"""
    
    # Application
    APP_NAME = os.getenv("APP_NAME", "AI Code Analysis Service")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/codeforge")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Node Backend
    NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
    
    # ML Models
    MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))
    USE_CODEBERT = os.getenv("USE_CODEBERT", "True").lower() == "true"
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "microsoft/codebert-base")
    
    # Model Paths
    QUALITY_MODEL_PATH = MODEL_DIR / "quality" / "model.pkl"
    QUALITY_SCALER_PATH = MODEL_DIR / "quality" / "scaler.pkl"
    COMPLEXITY_MODEL_PATH = MODEL_DIR / "complexity" / "model.pkl"
    
    # Analysis Settings
    MAX_CODE_LENGTH = int(os.getenv("MAX_CODE_LENGTH", "50000"))
    PLAGIARISM_THRESHOLD = float(os.getenv("PLAGIARISM_THRESHOLD", "0.85"))
    INTERVIEW_TIMEOUT = int(os.getenv("INTERVIEW_TIMEOUT", "3600"))  # 1 hour
    
    # Security
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
    JWT_ALGORITHM = "HS256"
    VALID_API_KEYS = os.getenv("VALID_API_KEYS", "").split(",")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "./logs/ai-service.log")
    
    @classmethod
    def get(cls, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return getattr(cls, key, default)
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            key: value
            for key, value in cls.__dict__.items()
            if not key.startswith('_') and not callable(value)
        }
    
    @classmethod
    def validate(cls):
        """Validate configuration"""
        errors = []
        
        # Check required settings
        if not cls.DATABASE_URL:
            errors.append("DATABASE_URL is not set")
        
        if not cls.JWT_SECRET_KEY or cls.JWT_SECRET_KEY == "change-this-in-production":
            logger.warning("JWT_SECRET_KEY should be changed in production")
        
        # Check model paths
        if not cls.MODEL_DIR.exists():
            logger.warning(f"Model directory does not exist: {cls.MODEL_DIR}")
        
        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")
        
        logger.info("Configuration validated successfully")


# Validate on import
try:
    Config.validate()
except Exception as e:
    logger.error(f"Configuration validation failed: {e}")


# Create singleton config instance
config = Config()