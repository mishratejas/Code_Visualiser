from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn   #Fast API production server
import logging
from contextlib import asynccontextmanager   #Used for startup & shutdown lifecycle management

from src.api.routes import analysis, plagiarism, interview, recommendations
from src.config import settings
from src.database import init_db, close_db
from src.cache import init_redis, close_redis
from src.models import load_models

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'   #2026-02-06 12:00 - ai-service - INFO - ML models loaded successfully
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application"""
    logger.info("Starting AI Service...")
    
    # Initialize connections
    await init_db()
    await init_redis()
    
    # Load ML models
    load_models()
    logger.info("ML models loaded successfully")
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down AI Service...")
    await close_db()
    await close_redis()

# Create FastAPI app
app = FastAPI(
    title="Code Platform AI Service",
    description="AI/ML service for code analysis, plagiarism detection, and interviews",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include routers
app.include_router(analysis.router, prefix="/api/v1/analyze", tags=["Analysis"])
app.include_router(plagiarism.router, prefix="/api/v1/plagiarism", tags=["Plagiarism"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Interview"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Code Platform AI Service",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",   #Docker Compatible
        port=8000,
        reload=settings.DEBUG
    )

# Frontend (React)
#    ↓
# Main Backend (Node.js)
#    ↓ REST API
# AI Service (FastAPI)  ← THIS FILE
#    ↓
# ML Models + Redis + DB
