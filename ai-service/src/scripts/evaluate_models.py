"""
Script to evaluate trained ML models
"""
import logging
from pathlib import Path
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_models(model_dir='./models'):
    """Load trained models"""
    logger.info("Loading models...")
    
    model_path = Path(model_dir)
    
    # Load quality model
    quality_model = joblib.load(model_path / 'quality' / 'model.pkl')
    quality_scaler = joblib.load(model_path / 'quality' / 'scaler.pkl')
    
    # Load complexity model
    complexity_model = joblib.load(model_path / 'complexity' / 'model.pkl')
    
    return quality_model, quality_scaler, complexity_model


def load_test_data():
    """Load test data"""
    logger.info("Loading test data...")
    
    # TODO: Load actual test data
    # For now, generate dummy data
    n_samples = 200
    X = np.random.rand(n_samples, 20)
    y_quality = np.random.rand(n_samples)
    y_complexity = np.random.choice(['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], n_samples)
    
    return X, y_quality, y_complexity


def evaluate_quality_model(model, scaler, X_test, y_test):
    """Evaluate quality prediction model"""
    logger.info("Evaluating quality model...")
    
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    metrics = {
        'mse': float(mse),
        'rmse': float(rmse),
        'r2': float(r2)
    }
    
    logger.info(f"Quality Model Metrics:")
    logger.info(f"  MSE: {mse:.4f}")
    logger.info(f"  RMSE: {rmse:.4f}")
    logger.info(f"  R²: {r2:.4f}")
    
    return metrics


def evaluate_complexity_model(model, X_test, y_test):
    """Evaluate complexity estimation model"""
    logger.info("Evaluating complexity model...")
    
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    
    metrics = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1)
    }
    
    logger.info(f"Complexity Model Metrics:")
    logger.info(f"  Accuracy: {accuracy:.4f}")
    logger.info(f"  Precision: {precision:.4f}")
    logger.info(f"  Recall: {recall:.4f}")
    logger.info(f"  F1 Score: {f1:.4f}")
    
    return metrics


def save_evaluation_results(quality_metrics, complexity_metrics, output_file='./evaluation_results.json'):
    """Save evaluation results"""
    results = {
        'quality_model': quality_metrics,
        'complexity_model': complexity_metrics
    }
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"Evaluation results saved to {output_file}")


def main():
    """Main evaluation workflow"""
    logger.info("Starting model evaluation...")
    
    # Load models
    quality_model, quality_scaler, complexity_model = load_models()
    
    # Load test data
    X_test, y_quality_test, y_complexity_test = load_test_data()
    
    # Evaluate models
    quality_metrics = evaluate_quality_model(quality_model, quality_scaler, X_test, y_quality_test)
    complexity_metrics = evaluate_complexity_model(complexity_model, X_test, y_complexity_test)
    
    # Save results
    save_evaluation_results(quality_metrics, complexity_metrics)
    
    logger.info("Model evaluation complete!")


if __name__ == '__main__':
    main()