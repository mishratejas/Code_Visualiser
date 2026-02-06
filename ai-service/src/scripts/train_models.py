"""
Script to train ML models
"""
import logging
from pathlib import Path
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_training_data(data_path='./data/processed'):
    """Load preprocessed training data"""
    logger.info(f"Loading data from {data_path}...")
    
    # TODO: Load actual data
    # For now, generate dummy data
    n_samples = 1000
    X = np.random.rand(n_samples, 20)  # 20 features
    y_quality = np.random.rand(n_samples)  # Quality scores
    y_complexity = np.random.choice(['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], n_samples)
    
    return X, y_quality, y_complexity


def train_quality_model(X, y):
    """Train code quality prediction model"""
    logger.info("Training quality model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    logger.info(f"Quality model - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
    
    return model, scaler


def train_complexity_model(X, y):
    """Train complexity estimation model"""
    logger.info("Training complexity model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    logger.info(f"Complexity model - Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
    
    return model


def save_models(quality_model, quality_scaler, complexity_model, output_dir='./models'):
    """Save trained models"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save quality model
    quality_dir = output_path / 'quality'
    quality_dir.mkdir(exist_ok=True)
    joblib.dump(quality_model, quality_dir / 'model.pkl')
    joblib.dump(quality_scaler, quality_dir / 'scaler.pkl')
    logger.info(f"Quality model saved to {quality_dir}")
    
    # Save complexity model
    complexity_dir = output_path / 'complexity'
    complexity_dir.mkdir(exist_ok=True)
    joblib.dump(complexity_model, complexity_dir / 'model.pkl')
    logger.info(f"Complexity model saved to {complexity_dir}")


def main():
    """Main training workflow"""
    logger.info("Starting model training...")
    
    # Load data
    X, y_quality, y_complexity = load_training_data()
    
    # Train models
    quality_model, quality_scaler = train_quality_model(X, y_quality)
    complexity_model = train_complexity_model(X, y_complexity)
    
    # Save models
    save_models(quality_model, quality_scaler, complexity_model)
    
    logger.info("Model training complete!")


if __name__ == '__main__':
    main()