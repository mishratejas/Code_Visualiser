"""
ML models package
"""
from src.models.quality_model import QualityModel
from src.models.complexity_model import ComplexityModel
from src.models.antipattern_model import AntiPatternModel

def load_models():
    """
    Load all ML models
    
    Returns:
        Dictionary of loaded models
    """
    return {
        'quality': QualityModel(),
        'complexity': ComplexityModel(),
        'antipattern': AntiPatternModel()
    }

__all__ = [
    'QualityModel',
    'ComplexityModel',
    'AntiPatternModel',
    'load_models'
]