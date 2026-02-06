from typing import Dict, List, Any, Optional
import asyncio
import numpy as np
from dataclasses import dataclass
import json

from src.services.feature_extractor import FeatureExtractor, CodeFeatures
from src.models.quality_model import QualityModel
from src.models.complexity_model import ComplexityModel
from src.models.antipattern_model import AntiPatternModel
from src.cache import get_cache, set_cache

@dataclass
class AnalysisResult:
    """Container for analysis results"""
    # Quality metrics
    quality_score: float
    quality_label: str  # poor, fair, good, excellent
    quality_confidence: float
    
    # Complexity
    time_complexity: str
    space_complexity: str
    complexity_confidence: float
    
    # Anti-patterns
    anti_patterns: List[Dict]
    
    # Suggestions
    suggestions: List[str]
    
    # Performance insights
    performance_rating: str  # inefficient, acceptable, optimized
    bottleneck_analysis: List[str]
    
    # Code metrics
    cyclomatic_complexity: int
    lines_of_code: int
    function_count: int
    
    # Comparison stats
    percentile_runtime: Optional[float] = None
    percentile_memory: Optional[float] = None

class AnalysisService:
    """Main service for code analysis"""
    
    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.quality_model = QualityModel()
        self.complexity_model = ComplexityModel()
        self.antipattern_model = AntiPatternModel()
        
        # Quality thresholds
        self.quality_thresholds = {
            'excellent': 0.8,
            'good': 0.6,
            'fair': 0.4,
            'poor': 0.0
        }
    
    async def analyze_submission(self, submission_data: Dict) -> AnalysisResult:
        """Analyze a code submission"""
        
        # Check cache first
        cache_key = f"analysis:{submission_data.get('submission_id')}"
        cached_result = await get_cache(cache_key)
        if cached_result:
            return AnalysisResult(**cached_result)
        
        # Extract code and metadata
        code = submission_data['code']
        language = submission_data['language']
        runtime_info = submission_data.get('execution_results', {})
        problem_id = submission_data.get('problem_id')
        user_id = submission_data.get('user_id')
        
        # Extract features
        features = self.feature_extractor.extract_features(code, language, runtime_info)
        feature_dict = self.feature_extractor.features_to_dict(features)
        
        # Run ML models (can be parallelized)
        quality_pred = self.quality_model.predict(feature_dict)
        complexity_pred = self.complexity_model.predict(feature_dict)
        antipattern_pred = self.antipattern_model.predict(feature_dict, code)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(
            quality_pred, complexity_pred, antipattern_pred, features
        )
        
        # Calculate performance rating
        performance_rating = self._calculate_performance_rating(
            features.runtime_ms, features.test_cases_passed, features.total_test_cases
        )
        
        # Create analysis result
        result = AnalysisResult(
            quality_score=quality_pred['score'],
            quality_label=quality_pred['label'],
            quality_confidence=quality_pred['confidence'],
            
            time_complexity=complexity_pred['time_complexity'],
            space_complexity=complexity_pred['space_complexity'],
            complexity_confidence=complexity_pred['confidence'],
            
            anti_patterns=antipattern_pred['patterns'],
            
            suggestions=suggestions,
            
            performance_rating=performance_rating,
            bottleneck_analysis=self._analyze_bottlenecks(features, antipattern_pred),
            
            cyclomatic_complexity=features.cyclomatic_complexity,
            lines_of_code=features.lines_of_code,
            function_count=features.function_count
        )
        
        # Cache the result
        await set_cache(cache_key, result.__dict__, expire=3600)
        
        return result
    
    def _generate_suggestions(self, quality_pred, complexity_pred, 
                             antipattern_pred, features) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        # Quality-based suggestions
        if quality_pred['score'] < 0.6:
            suggestions.append("Consider improving code readability with better variable names.")
            suggestions.append("Add comments to explain complex logic.")
        
        # Complexity-based suggestions
        if complexity_pred['time_complexity'] in ['O(n²)', 'O(n³)', 'O(2^n)']:
            suggestions.append(f"Current time complexity is {complexity_pred['time_complexity']}. Consider optimizing.")
        
        # Anti-pattern based suggestions
        for pattern in antipattern_pred['patterns']:
            if pattern['type'] == 'brute_force':
                suggestions.append("Brute force approach detected. Consider more efficient algorithm.")
            elif pattern['type'] == 'unnecessary_sorting':
                suggestions.append("Unnecessary sorting detected. Check if sorting is needed.")
            elif pattern['type'] == 'repeated_computation':
                suggestions.append("Repeated computation detected. Consider caching results.")
        
        # Performance suggestions
        if features.loop_count > 3:
            suggestions.append(f"Found {features.loop_count} loops. Consider reducing nesting depth.")
        
        if features.cyclomatic_complexity > 10:
            suggestions.append(f"High cyclomatic complexity ({features.cyclomatic_complexity}). Consider refactoring.")
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _calculate_performance_rating(self, runtime_ms, passed, total) -> str:
        """Calculate performance rating"""
        if total == 0:
            return "unknown"
        
        success_rate = passed / total
        
        if success_rate < 1.0:
            return "inefficient"
        elif runtime_ms < 100:
            return "optimized"
        else:
            return "acceptable"
    
    def _analyze_bottlenecks(self, features, antipattern_pred) -> List[str]:
        """Analyze performance bottlenecks"""
        bottlenecks = []
        
        if features.loop_count > 2:
            bottlenecks.append(f"Multiple loops ({features.loop_count}) may cause performance issues.")
        
        if features.max_nesting_depth > 3:
            bottlenecks.append(f"Deep nesting (depth {features.max_nesting_depth}) affects readability and performance.")
        
        for pattern in antipattern_pred['patterns']:
            if pattern['severity'] == 'high':
                bottlenecks.append(f"High severity anti-pattern: {pattern['description']}")
        
        return bottlenecks
    
    async def batch_analyze(self, submissions: List[Dict]) -> List[AnalysisResult]:
        """Analyze multiple submissions in batch"""
        tasks = [self.analyze_submission(sub) for sub in submissions]
        return await asyncio.gather(*tasks)
    
    async def compare_with_benchmark(self, submission_data: Dict, 
                                    benchmark_data: Dict) -> Dict:
        """Compare submission with benchmark solutions"""
        submission_result = await self.analyze_submission(submission_data)
        
        comparison = {
            'quality_comparison': {
                'submission_score': submission_result.quality_score,
                'benchmark_score': benchmark_data.get('quality_score', 0.8),
                'difference': submission_result.quality_score - benchmark_data.get('quality_score', 0.8)
            },
            'complexity_comparison': {
                'submission_time': submission_result.time_complexity,
                'benchmark_time': benchmark_data.get('time_complexity', 'O(n)'),
                'submission_space': submission_result.space_complexity,
                'benchmark_space': benchmark_data.get('space_complexity', 'O(1)')
            },
            'performance_gap': self._calculate_performance_gap(submission_result, benchmark_data)
        }
        
        return comparison
    
    def _calculate_performance_gap(self, submission: AnalysisResult, 
                                  benchmark: Dict) -> Dict:
        """Calculate performance gap analysis"""
        # This is a simplified version
        # In practice, you'd compare runtime, memory usage, etc.
        return {
            'runtime_gap': 'similar',  # similar, slower, faster
            'memory_gap': 'similar',
            'quality_gap': 'needs_improvement' if submission.quality_score < 0.7 else 'good'
        }