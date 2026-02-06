"""
Base class for ML models
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import joblib
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class BaseModel(ABC):
    """Abstract base class for ML models"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize model
        
        Args:
            model_path: Path to saved model file
        """
        self.model = None
        self.model_path = model_path
        self.is_loaded = False
        
        if model_path:
            self.load(model_path)
    
    @abstractmethod
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make prediction
        
        Args:
            features: Input features
            
        Returns:
            Prediction results
        """
        pass
    
    @abstractmethod
    def train(self, X, y):
        """
        Train model
        
        Args:
            X: Training features
            y: Training labels
        """
        pass
    
    def load(self, model_path: str):
        """
        Load model from file
        
        Args:
            model_path: Path to model file
        """
        try:
            self.model = joblib.load(model_path)
            self.is_loaded = True
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_loaded = False
    
    def save(self, output_path: str):
        """
        Save model to file
        
        Args:
            output_path: Path to save model
        """
        try:
            output_dir = Path(output_path).parent
            output_dir.mkdir(parents=True, exist_ok=True)
            
            joblib.dump(self.model, output_path)
            logger.info(f"Model saved to {output_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def is_ready(self) -> bool:
        """Check if model is loaded and ready"""
        return self.is_loaded and self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model_type': self.__class__.__name__,
            'is_loaded': self.is_loaded,
            'model_path': self.model_path
        }