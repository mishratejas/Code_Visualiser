import pickle
import numpy as np
from pathlib import Path

class ComplexityModel:
    """Model for predicting time and space complexity"""
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path or Path(__file__).parent.parent.parent / 'models' / 'complexity'
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load trained model"""
        try:
            with open(self.model_path / 'model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            print("✅ Complexity model loaded")
        except FileNotFoundError:
            print("⚠️  Complexity model not found, using fallback")
            self.model = None
    
    def predict(self, features: dict) -> dict:
        """Predict time and space complexity"""
        if self.model is None:
            return self._fallback_prediction(features)
        
        # Feature preparation would go here
        # For now, return fallback
        return self._fallback_prediction(features)
    
    def _fallback_prediction(self, features: dict) -> dict:
        """Fallback prediction using rules"""
        lines = features.get('lines_of_code', 0)
        loops = features.get('loop_count', 0)
        
        if loops == 0:
            complexity = "O(1)"
        elif loops == 1:
            complexity = "O(n)"
        elif loops == 2:
            complexity = "O(n²)"
        else:
            complexity = "O(n³)"
        
        return {
            "time_complexity": complexity,
            "space_complexity": "O(1)",
            "confidence": 0.7
        }