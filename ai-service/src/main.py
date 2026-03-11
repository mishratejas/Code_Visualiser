"""
CodeArena AI Service — FastAPI entry point
Port: 8001
"""
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import Config
from src.cache import cache_manager

# Routes — imported AFTER config so GEMINI_READY is set
from src.api.routes.analysis import router as analysis_router
from src.api.routes.plagiarism import router as plagiarism_router
from src.api.routes.interview import router as interview_router
from src.api.routes.recommendations import router as recommendations_router

# Logging setup
Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {Config.APP_NAME} on port {Config.PORT}")
    await cache_manager.connect()
    yield
    await cache_manager.close()
    logger.info("AI service shut down")


app = FastAPI(
    title=Config.APP_NAME,
    description="AI-powered code analysis using Gemini + algorithmic methods",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router,       prefix="/api/v1/analyze",          tags=["Analysis"])
app.include_router(plagiarism_router,     prefix="/api/v1/plagiarism",        tags=["Plagiarism"])
app.include_router(interview_router,      prefix="/api/v1/interview",         tags=["Interview"])
app.include_router(recommendations_router,prefix="/api/v1/recommendations",   tags=["Recommendations"])


@app.get("/health")
async def health():
    from src.config import GEMINI_READY
    return {
        "status": "healthy",
        "service": Config.APP_NAME,
        "port": Config.PORT,
        "gemini_configured": GEMINI_READY,
    }


@app.get("/")
async def root():
    return {"service": Config.APP_NAME, "version": "2.0.0", "docs": "/api/docs"}


@app.exception_handler(Exception)
async def global_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )