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
    from src.config import GEMINI_READY, Config
    from src.services.analysis_service import _gemini_models
    return {
        "status": "healthy",
        "service": Config.APP_NAME,
        "port": Config.PORT,
        "gemini_configured": GEMINI_READY,
        "gemini_model": Config.GEMINI_MODEL,
        "gemini_keys_loaded": len(_gemini_models),
        "gemini_status": "✅ Ready" if _gemini_models else "❌ No keys — using rule-based fallback",
    }


@app.get("/api/v1/gemini-test")
async def gemini_test():
    """
    Live Gemini API key test — sends a tiny prompt and returns the response.
    Use this to verify your GEMINI_API_KEY is valid and the model works.
    """
    from src.config import GEMINI_READY, Config
    from src.services.analysis_service import _gemini_models, _call_gemini
    import time

    if not GEMINI_READY or not _gemini_models:
        return {
            "success": False,
            "gemini_configured": False,
            "error": "No Gemini API keys found. Set GEMINI_API_KEY in your .env file.",
            "model": Config.GEMINI_MODEL,
            "how_to_fix": "Add GEMINI_API_KEY=your_key_here to Ai-service/.env",
        }

    start = time.time()
    try:
        result = await _call_gemini(
            'Reply with ONLY this exact JSON and nothing else: {"ok": true, "message": "Gemini is working!"}',
            {"ok": False, "message": "fallback"}
        )
        elapsed = round((time.time() - start) * 1000)
        if result.get("ok"):
            return {
                "success": True,
                "gemini_configured": True,
                "model": Config.GEMINI_MODEL,
                "response_time_ms": elapsed,
                "message": "✅ Gemini API key is valid and working!",
                "keys_available": len(_gemini_models),
            }
        else:
            return {
                "success": False,
                "gemini_configured": True,
                "model": Config.GEMINI_MODEL,
                "error": "Gemini responded but returned unexpected format",
                "raw": result,
            }
    except Exception as e:
        return {
            "success": False,
            "gemini_configured": True,
            "model": Config.GEMINI_MODEL,
            "error": str(e),
            "tip": "Check that your API key is valid at https://aistudio.google.com/app/apikey",
        }


@app.get("/")
async def root():
    return {
        "service": Config.APP_NAME,
        "version": "2.0.0",
        "docs": "/api/docs",
        "gemini_test": "/api/v1/gemini-test",
        "health": "/health",
    }


@app.exception_handler(Exception)
async def global_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )