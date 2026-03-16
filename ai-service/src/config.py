"""
Configuration — reads .env from ai-service root
Supports multiple Gemini API keys with automatic fallback.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    APP_NAME   = os.getenv("APP_NAME", "CodeForge AI Service")
    DEBUG      = os.getenv("DEBUG", "False").lower() == "true"
    HOST       = os.getenv("HOST", "0.0.0.0")
    PORT       = int(os.getenv("PORT", "8001"))

    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:8000"
    ).split(",")

    # ── Multiple Gemini API keys ──────────────────────────────────────────
    # OPTION A — single key:   GEMINI_API_KEY=AIzaSy...
    # OPTION B — multi-key:    GEMINI_API_KEYS=AIzaSy...,AIzaSy...,AIzaSy...
    # If one key fails/rate-limits, service automatically rotates to next.
    _raw_keys = os.getenv("GEMINI_API_KEYS", "")
    _single   = os.getenv("GEMINI_API_KEY", "")

    GEMINI_API_KEYS = list(dict.fromkeys([   # deduplicated, order-preserving
        k.strip()
        for k in (_raw_keys.split(",") if _raw_keys else [_single])
        if k.strip() and k.strip() not in ("", "your_gemini_api_key_here")
    ]))
    GEMINI_API_KEY  = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else ""
    GEMINI_MODEL    = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    REDIS_URL        = os.getenv("REDIS_URL", "redis://localhost:6379")
    NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:8000")

    MAX_CODE_LENGTH      = int(os.getenv("MAX_CODE_LENGTH", "50000"))
    PLAGIARISM_THRESHOLD = float(os.getenv("PLAGIARISM_THRESHOLD", "0.75"))

    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE  = os.getenv("LOG_FILE", "./logs/ai-service.log")


config = Config()
GEMINI_READY = bool(config.GEMINI_API_KEYS)

if GEMINI_READY:
    logger.info(f"Gemini configured with {len(config.GEMINI_API_KEYS)} API key(s), model: {config.GEMINI_MODEL}")
else:
    logger.warning("No Gemini API keys found — using rule-based fallback only")