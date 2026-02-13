"""
Utilities package
"""
from src.utils.helpers import (
    generate_hash,
    truncate_text,
    safe_divide,
    normalize_score,
    format_runtime,
    format_memory
)
from src.utils.logger import setup_logger, get_logger
from src.utils.metrics import record_metric, get_metrics, timing_decorator, Timer
from src.utils.validators import (
    validate_code_length,
    validate_language,
    validate_submission_id,
    sanitize_code
)
# ✅ FIXED: Import from src/ not src/utils/
from src.cache import get_cache, set_cache, delete_cache, clear_cache
from src.config import Config, config
from src.database import get_db_session, close_database

__all__ = [
    # Helpers
    'generate_hash',
    'truncate_text',
    'safe_divide',
    'normalize_score',
    'format_runtime',
    'format_memory',
    # Logger
    'setup_logger',
    'get_logger',
    # Metrics
    'record_metric',
    'get_metrics',
    'timing_decorator',
    'Timer',
    # Validators
    'validate_code_length',
    'validate_language',
    'validate_submission_id',
    'sanitize_code',
    # Cache
    'get_cache',
    'set_cache',
    'delete_cache',
    'clear_cache',
    # Config
    'Config',
    'config',
    # Database
    'get_db_session',
    'close_database'
]