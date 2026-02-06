"""
Helper utility functions
"""
from typing import Any, List, Dict
import hashlib
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def generate_hash(text: str) -> str:
    """Generate SHA256 hash of text"""
    return hashlib.sha256(text.encode()).hexdigest()


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers"""
    try:
        if denominator == 0:
            return default
        return numerator / denominator
    except (TypeError, ZeroDivisionError):
        return default


def normalize_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Normalize score to range [min_val, max_val]"""
    return max(min_val, min(max_val, score))


def calculate_percentage(part: int, total: int) -> float:
    """Calculate percentage"""
    return safe_divide(part, total, 0.0) * 100


def format_runtime(milliseconds: int) -> str:
    """Format runtime in human-readable format"""
    if milliseconds < 1000:
        return f"{milliseconds}ms"
    else:
        seconds = milliseconds / 1000
        return f"{seconds:.2f}s"


def format_memory(kilobytes: int) -> str:
    """Format memory in human-readable format"""
    if kilobytes < 1024:
        return f"{kilobytes}KB"
    else:
        megabytes = kilobytes / 1024
        return f"{megabytes:.2f}MB"


def serialize_datetime(dt: datetime) -> str:
    """Serialize datetime to ISO format string"""
    return dt.isoformat() if dt else None


def parse_datetime(dt_str: str) -> datetime:
    """Parse ISO format datetime string"""
    try:
        return datetime.fromisoformat(dt_str)
    except (ValueError, AttributeError):
        return None


def merge_dicts(*dicts: Dict) -> Dict:
    """Merge multiple dictionaries"""
    result = {}
    for d in dicts:
        result.update(d)
    return result


def flatten_list(nested_list: List[List[Any]]) -> List[Any]:
    """Flatten nested list"""
    return [item for sublist in nested_list for item in sublist]


def chunk_list(lst: List, chunk_size: int) -> List[List]:
    """Split list into chunks"""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def safe_json_loads(json_str: str, default=None) -> Any:
    """Safely load JSON string"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default


def safe_json_dumps(obj: Any, default=None) -> str:
    """Safely dump object to JSON string"""
    try:
        return json.dumps(obj)
    except (TypeError, ValueError):
        return default or '{}'


def clamp(value: float, min_value: float, max_value: float) -> float:
    """Clamp value between min and max"""
    return max(min_value, min(max_value, value))