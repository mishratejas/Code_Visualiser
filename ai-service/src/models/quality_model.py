import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from pathlib import Path
import json

class QualityModel:
    """ML model for code quality classification"""
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.scaler = StandardScaler()
        self.labels = ['poor', 'fair', 'good', 'excellent']
        self.model_path = model_path or Path(__file__).parent.parent.parent / 'models' / 'quality'
        
        self.load_model()
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            with open(self.model_path / 'model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            
            with open(self.model_path / 'scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            
            print("✅ Quality model loaded successfully")
        except FileNotFoundError:
            print("⚠️  No trained model found. Using fallback rules.")
            self.model = None
    
    def predict(self, features: dict) -> dict:
        """Predict code quality"""
        if self.model is None:
            return self._fallback_prediction(features)
        
        # Convert features to array
        feature_array = self._prepare_features(features)
        
        if feature_array is None:
            return self._fallback_prediction(features)
        
        # Scale features
        feature_scaled = self.scaler.transform(feature_array.reshape(1, -1))
        
        # Make prediction
        probabilities = self.model.predict_proba(feature_scaled)[0]
        class_idx = np.argmax(probabilities)
        
        return {
            'label': self.labels[class_idx],
            'score': float(probabilities[class_idx]),
            'confidence': float(probabilities[class_idx]),
            'probabilities': {self.labels[i]: float(p) for i, p in enumerate(probabilities)}
        }
    
    def _prepare_features(self, features: dict) -> np.ndarray:
        """Prepare features for model input"""
        # Define expected feature order (based on training)
        expected_features = [
            'lines_of_code',
            'cyclomatic_complexity',
            'max_nesting_depth',
            'function_count',
            'comment_density',
            'loop_count',
            'conditional_count',
            'runtime_ms',
            'test_cases_passed',
            'total_test_cases'
        ]
        
        feature_array = []
        for feat in expected_features:
            value = features.get(feat, 0)
            
            # Handle different data types
            if isinstance(value, bool):
                value = 1.0 if value else 0.0
            elif isinstance(value, (int, float)):
                value = float(value)
            else:
                value = 0.0
            
            feature_array.append(value)
        
        return np.array(feature_array)
    
    def _fallback_prediction(self, features: dict) -> dict:
        """Fallback prediction using rules"""
        score = 0.5  # Default
        
        # Rule-based scoring
        if features.get('comment_density', 0) > 0.1:
            score += 0.1
        
        if features.get('lines_of_code', 0) < 100:
            score += 0.1
        
        if features.get('cyclomatic_complexity', 0) < 10:
            score += 0.1
        
        if features.get('test_cases_passed', 0) == features.get('total_test_cases', 1):
            score += 0.2
        
        # Clamp score
        score = max(0.0, min(1.0, score))
        
        # Determine label
        if score >= 0.8:
            label = 'excellent'
        elif score >= 0.6:
            label = 'good'
        elif score >= 0.4:
            label = 'fair'
        else:
            label = 'poor'
        
        return {
            'label': label,
            'score': score,
            'confidence': 0.5,
            'probabilities': {
                'poor': 1.0 - score if score < 0.4 else 0.0,
                'fair': 0.3 if 0.4 <= score < 0.6 else 0.0,
                'good': 0.3 if 0.6 <= score < 0.8 else 0.0,
                'excellent': score if score >= 0.8 else 0.0
            }
        }
    
    def train(self, X, y):
        """Train the model (to be called from training script)"""
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        
        # Save model
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        with open(self.model_path / 'model.pkl', 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(self.model_path / 'scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        print(f"✅ Model trained and saved to {self.model_path}")