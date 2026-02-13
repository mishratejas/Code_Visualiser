"""
FastAPI main application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from src.config import Config
from src.utils.logger import setup_logger
from src.database import close_database

# Import routers
from src.api.routes import analysis, interview, plagiarism, recommendations

# Setup logging
logger = setup_logger(
    name='ai-service',
    log_file=Config.LOG_FILE,
    level=getattr(logging, Config.LOG_LEVEL)
)

# Create FastAPI app
app = FastAPI(
    title=Config.APP_NAME,
    description="AI-powered code analysis service",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(
    analysis.router,
    prefix="/api/v1/analyze",
    tags=["Analysis"]
)

app.include_router(
    interview.router,
    prefix="/api/v1/interview",
    tags=["Interview"]
)

app.include_router(
    plagiarism.router,
    prefix="/api/v1/plagiarism",
    tags=["Plagiarism"]
)

app.include_router(
    recommendations.router,
    prefix="/api/v1/recommendations",
    tags=["Recommendations"]
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": Config.APP_NAME,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": Config.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health"
    }


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info(f"Starting {Config.APP_NAME}...")
    logger.info(f"Debug mode: {Config.DEBUG}")
    logger.info(f"Host: {Config.HOST}:{Config.PORT}")
    
    # Log configuration
    config_dict = Config.to_dict()
    logger.info(f"Configuration: {config_dict}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info(f"Shutting down {Config.APP_NAME}...")
    
    # Close database connections
    await close_database()
    
    logger.info("Shutdown complete")


# Run application
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=Config.DEBUG,
        log_level=Config.LOG_LEVEL.lower()
    )

# Frontend (React)
#    ↓
# Main Backend (Node.js)
#    ↓ REST API
# AI Service (FastAPI)  ← THIS FILE
#    ↓
# ML Models + Redis + DB
