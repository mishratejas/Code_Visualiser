import os  #read environment variables
from typing import List
from pydantic_settings import BaseSettings   #Pydantic-based config validation
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "CodeForge"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "*").split(",")
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/ai_platform")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Model paths
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models")
    
    # Node.js backend URL
    NODE_BACKEND_URL: str = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
    
    # Feature extraction settings
    MAX_CODE_LENGTH: int = int(os.getenv("MAX_CODE_LENGTH", 10000))
    
    # Plagiarism settings
    PLAGIARISM_THRESHOLD: float = float(os.getenv("PLAGIARISM_THRESHOLD", 0.85))
    
    # Interview settings
    INTERVIEW_TIMEOUT: int = int(os.getenv("INTERVIEW_TIMEOUT", 1800))  # 30 minutes
    
    class Config:
        env_file = ".env"

settings = Settings()