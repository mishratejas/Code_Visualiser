"""
Unified feature extraction service
"""
from typing import Dict, Any
from dataclasses import dataclass
import logging

from src.core.features.structural import extract_structural_features
from src.core.features.algorithmic import extract_algorithmic_features
from src.core.features.quality import extract_quality_features, QualityFeatures
from src.core.features.runtime import extract_runtime_features, RuntimeFeatures
from src.services.code_parser import parse_code

logger = logging.getLogger(__name__)


@dataclass
class CodeFeatures:
    """Container for all code features"""
    # Structural
    lines_of_code: int = 0
    code_lines: int = 0
    blank_lines: int = 0
    comment_lines: int = 0
    total_characters: int = 0
    avg_line_length: float = 0.0
    max_line_length: int = 0
    function_count: int = 0
    class_count: int = 0
    import_count: int = 0
    max_nesting_depth: int = 0
    comment_density: float = 0.0
    
    # Algorithmic
    uses_array: bool = False
    uses_hashmap: bool = False
    uses_recursion: bool = False
    uses_dynamic_programming: bool = False
    uses_sorting: bool = False
    uses_binary_search: bool = False
    nested_loop_depth: int = 0
    total_loops: int = 0
    loop_count: int = 0
    conditional_count: int = 0
    
    # Quality
    has_comments: bool = False
    has_docstrings: bool = False
    has_descriptive_names: bool = False
    has_error_handling: bool = False
    has_type_hints: bool = False
    quality_score: float = 0.5
    
    # Runtime
    runtime_ms: float = None
    memory_kb: float = None
    tests_passed: int = 0
    total_tests: int = 0
    pass_rate: float = 0.0
    verdict: str = "pending"
    
    # Complexity
    cyclomatic_complexity: int = 0


class FeatureExtractor:
    """Extract comprehensive features from code"""
    
    def extract_features(
        self,
        code: str,
        language: str = 'python',
        runtime_info: Dict = None
    ) -> CodeFeatures:
        """
        Extract all features from code
        
        Args:
            code: Source code
            language: Programming language
            runtime_info: Optional runtime execution info
            
        Returns:
            CodeFeatures object with all extracted features
        """
        features = CodeFeatures()
        
        try:
            # Parse code
            parsed = parse_code(code, language)
            
            # Extract structural features
            structural = extract_structural_features(code, language, parsed)
            features = self._merge_structural(features, structural)
            
            # Extract algorithmic features
            algorithmic = extract_algorithmic_features(code, language)
            features = self._merge_algorithmic(features, algorithmic)
            
            # Extract quality features
            quality = extract_quality_features(code, language)
            features = self._merge_quality(features, quality)
            
            # Extract runtime features if available
            if runtime_info:
                runtime = extract_runtime_features(runtime_info)
                features = self._merge_runtime(features, runtime)
            
            # Calculate complexity from parsed info
            features.cyclomatic_complexity = parsed.get('complexity', 0)
            
            logger.debug(f"Extracted features for {language} code")
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
        
        return features
    
    def _merge_structural(self, features: CodeFeatures, structural: Dict) -> CodeFeatures:
        """Merge structural features"""
        features.lines_of_code = structural.get('total_lines', 0)
        features.code_lines = structural.get('code_lines', 0)
        features.blank_lines = structural.get('blank_lines', 0)
        features.comment_lines = structural.get('comment_lines', 0)
        features.total_characters = structural.get('total_characters', 0)
        features.avg_line_length = structural.get('avg_line_length', 0.0)
        features.max_line_length = structural.get('max_line_length', 0)
        features.function_count = structural.get('function_count', 0)
        features.class_count = structural.get('class_count', 0)
        features.import_count = structural.get('import_count', 0)
        features.max_nesting_depth = structural.get('max_nesting_depth', 0)
        features.comment_density = structural.get('comment_density', 0.0)
        
        return features
    
    def _merge_algorithmic(self, features: CodeFeatures, algorithmic: Dict) -> CodeFeatures:
        """Merge algorithmic features"""
        features.uses_array = algorithmic.get('uses_array', False)
        features.uses_hashmap = algorithmic.get('uses_hashmap', False)
        features.uses_recursion = algorithmic.get('uses_recursion', False)
        features.uses_dynamic_programming = algorithmic.get('uses_dynamic_programming', False)
        features.uses_sorting = algorithmic.get('uses_sorting', False)
        features.uses_binary_search = algorithmic.get('uses_binary_search', False)
        features.nested_loop_depth = algorithmic.get('nested_loop_depth', 0)
        features.total_loops = algorithmic.get('total_loops', 0)
        features.loop_count = algorithmic.get('total_loops', 0)
        features.conditional_count = len(algorithmic.keys())  # Simplified
        
        return features
    
    def _merge_quality(self, features: CodeFeatures, quality: QualityFeatures) -> CodeFeatures:
        """Merge quality features"""
        features.has_comments = quality.has_comments
        features.has_docstrings = quality.has_docstrings
        features.has_descriptive_names = quality.has_descriptive_names
        features.has_error_handling = quality.has_error_handling
        features.has_type_hints = quality.has_type_hints
        features.quality_score = quality.quality_score
        
        return features
    
    def _merge_runtime(self, features: CodeFeatures, runtime: RuntimeFeatures) -> CodeFeatures:
        """Merge runtime features"""
        features.runtime_ms = runtime.runtime_ms
        features.memory_kb = runtime.memory_kb
        features.tests_passed = runtime.tests_passed
        features.total_tests = runtime.total_tests
        features.pass_rate = runtime.pass_rate
        features.verdict = runtime.verdict
        
        return features
    
    def features_to_dict(self, features: CodeFeatures) -> Dict[str, Any]:
        """Convert features to dictionary"""
        return {
            'lines_of_code': features.lines_of_code,
            'code_lines': features.code_lines,
            'blank_lines': features.blank_lines,
            'comment_lines': features.comment_lines,
            'total_characters': features.total_characters,
            'avg_line_length': features.avg_line_length,
            'max_line_length': features.max_line_length,
            'function_count': features.function_count,
            'class_count': features.class_count,
            'import_count': features.import_count,
            'max_nesting_depth': features.max_nesting_depth,
            'comment_density': features.comment_density,
            'uses_array': features.uses_array,
            'uses_hashmap': features.uses_hashmap,
            'uses_recursion': features.uses_recursion,
            'uses_dynamic_programming': features.uses_dynamic_programming,
            'uses_sorting': features.uses_sorting,
            'uses_binary_search': features.uses_binary_search,
            'nested_loop_depth': features.nested_loop_depth,
            'total_loops': features.total_loops,
            'loop_count': features.loop_count,
            'conditional_count': features.conditional_count,
            'has_comments': features.has_comments,
            'has_docstrings': features.has_docstrings,
            'has_descriptive_names': features.has_descriptive_names,
            'has_error_handling': features.has_error_handling,
            'has_type_hints': features.has_type_hints,
            'quality_score': features.quality_score,
            'runtime_ms': features.runtime_ms,
            'memory_kb': features.memory_kb,
            'tests_passed': features.tests_passed,
            'total_tests': features.total_tests,
            'pass_rate': features.pass_rate,
            'verdict': features.verdict,
            'cyclomatic_complexity': features.cyclomatic_complexity
        }


# Global instance
_feature_extractor = FeatureExtractor()


def extract_features(code: str, language: str = 'python', runtime_info: Dict = None) -> CodeFeatures:
    """Extract features from code"""
    return _feature_extractor.extract_features(code, language, runtime_info)