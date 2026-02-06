"""
Performance metrics and monitoring utilities
"""
import time
import functools
from typing import Callable
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class MetricData:
    """Container for metric data"""
    name: str
    value: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    tags: dict = field(default_factory=dict)


class MetricsCollector:
    """Collect and track performance metrics"""
    
    def __init__(self):
        self.metrics = []
    
    def record(self, name: str, value: float, unit: str = '', tags: dict = None):
        """Record a metric"""
        metric = MetricData(
            name=name,
            value=value,
            unit=unit,
            tags=tags or {}
        )
        self.metrics.append(metric)
        logger.debug(f"Metric: {name}={value}{unit}")
    
    def get_metrics(self, name: str = None) -> list:
        """Get recorded metrics"""
        if name:
            return [m for m in self.metrics if m.name == name]
        return self.metrics
    
    def get_average(self, name: str) -> float:
        """Get average value for a metric"""
        values = [m.value for m in self.metrics if m.name == name]
        return sum(values) / len(values) if values else 0.0
    
    def clear(self):
        """Clear all metrics"""
        self.metrics.clear()


# Global metrics collector
_metrics = MetricsCollector()


def record_metric(name: str, value: float, unit: str = '', tags: dict = None):
    """Record a metric to global collector"""
    _metrics.record(name, value, unit, tags)


def get_metrics(name: str = None) -> list:
    """Get metrics from global collector"""
    return _metrics.get_metrics(name)


def timing_decorator(func: Callable) -> Callable:
    """Decorator to measure function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            elapsed_time = (time.time() - start_time) * 1000  # ms
            record_metric(
                f"{func.__name__}_duration",
                elapsed_time,
                'ms',
                {'function': func.__name__}
            )
            logger.debug(f"{func.__name__} took {elapsed_time:.2f}ms")
    
    return wrapper


class Timer:
    """Context manager for timing code blocks"""
    
    def __init__(self, name: str = "timer"):
        self.name = name
        self.start_time = None
        self.elapsed = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, *args):
        self.elapsed = (time.time() - self.start_time) * 1000  # ms
        record_metric(self.name, self.elapsed, 'ms')
        logger.debug(f"{self.name}: {self.elapsed:.2f}ms")