"""
Runtime feature extraction from code execution results
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class RuntimeFeatures:
    """Container for runtime execution features"""
    # Execution metrics
    runtime_ms: Optional[float] = None
    memory_kb: Optional[float] = None
    cpu_usage: Optional[float] = None
    
    # Test results
    tests_passed: int = 0
    total_tests: int = 0
    pass_rate: float = 0.0
    
    # Performance
    avg_runtime_per_test: Optional[float] = None
    max_runtime: Optional[float] = None
    min_runtime: Optional[float] = None
    
    # Verdict
    verdict: str = "pending"
    error_message: Optional[str] = None


class RuntimeFeatureExtractor:
    """Extract features from code execution"""
    
    def extract(self, execution_data: Dict[str, Any]) -> RuntimeFeatures:
        """
        Extract runtime features
        
        Args:
            execution_data: Execution results dictionary
            
        Returns:
            RuntimeFeatures object
        """
        features = RuntimeFeatures()
        
        # Basic metrics
        features.runtime_ms = execution_data.get('runtime_ms')
        features.memory_kb = execution_data.get('memory_kb')
        features.cpu_usage = execution_data.get('cpu_usage')
        
        # Test results
        features.tests_passed = execution_data.get('tests_passed', 0)
        features.total_tests = execution_data.get('total_tests', 0)
        
        if features.total_tests > 0:
            features.pass_rate = features.tests_passed / features.total_tests
        
        # Test-level metrics
        test_runtimes = execution_data.get('test_runtimes', [])
        if test_runtimes:
            features.avg_runtime_per_test = sum(test_runtimes) / len(test_runtimes)
            features.max_runtime = max(test_runtimes)
            features.min_runtime = min(test_runtimes)
        
        # Verdict
        features.verdict = execution_data.get('verdict', 'pending')
        features.error_message = execution_data.get('error')
        
        return features
    
    def to_dict(self, features: RuntimeFeatures) -> Dict[str, Any]:
        """Convert features to dictionary"""
        return {
            'runtime_ms': features.runtime_ms,
            'memory_kb': features.memory_kb,
            'cpu_usage': features.cpu_usage,
            'tests_passed': features.tests_passed,
            'total_tests': features.total_tests,
            'pass_rate': features.pass_rate,
            'avg_runtime_per_test': features.avg_runtime_per_test,
            'max_runtime': features.max_runtime,
            'min_runtime': features.min_runtime,
            'verdict': features.verdict,
            'error_message': features.error_message
        }


# Global instance
_extractor = RuntimeFeatureExtractor()


def extract_runtime_features(execution_data: Dict) -> RuntimeFeatures:
    """Extract runtime features from execution data"""
    return _extractor.extract(execution_data)