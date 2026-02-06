"""
Training and data collection scripts
"""
from src.scripts.collect_data import main as collect_data
from src.scripts.train_models import main as train_models
from src.scripts.evaluate_models import main as evaluate_models

__all__ = [
    'collect_data',
    'train_models',
    'evaluate_models'
]