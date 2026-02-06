"""
Code quality feature extraction
"""
import re
from typing import Dict, Any, List
from dataclasses import dataclass


@dataclass
class QualityFeatures:
    """Container for code quality features"""
    # Readability
    has_comments: bool = False
    comment_density: float = 0.0
    has_docstrings: bool = False
    avg_line_length: float = 0.0
    max_line_length: int = 0
    
    # Naming
    has_descriptive_names: bool = False
    uses_snake_case: bool = False
    uses_camel_case: bool = False
    
    # Organization
    has_functions: bool = False
    has_classes: bool = False
    function_count: int = 0
    
    # Maintainability
    has_magic_numbers: bool = False
    has_global_variables: bool = False
    max_nesting_depth: int = 0
    
    # Best practices
    has_error_handling: bool = False
    has_type_hints: bool = False
    
    # Code smells
    has_code_duplication: bool = False
    has_long_parameters: bool = False
    
    # Overall score
    quality_score: float = 0.5


class QualityFeatureExtractor:
    """Extract code quality features"""
    
    def extract(self, code: str, language: str = 'python') -> QualityFeatures:
        """
        Extract quality features
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            QualityFeatures object
        """
        features = QualityFeatures()
        lines = code.split('\n')
        
        # Readability
        features.has_comments = self._has_comments(code, language)
        features.comment_density = self._comment_density(code, language)
        features.has_docstrings = self._has_docstrings(code, language)
        features.avg_line_length = self._avg_line_length(lines)
        features.max_line_length = self._max_line_length(lines)
        
        # Naming
        features.has_descriptive_names = self._has_descriptive_names(code)
        features.uses_snake_case = '_' in code
        features.uses_camel_case = bool(re.search(r'[a-z][A-Z]', code))
        
        # Organization
        features.has_functions = self._has_functions(code, language)
        features.has_classes = 'class ' in code
        features.function_count = self._count_functions(code, language)
        
        # Maintainability
        features.has_magic_numbers = self._has_magic_numbers(code)
        features.has_global_variables = self._has_globals(code, language)
        features.max_nesting_depth = self._max_nesting(code, language)
        
        # Best practices
        features.has_error_handling = self._has_error_handling(code, language)
        features.has_type_hints = self._has_type_hints(code, language)
        
        # Code smells
        features.has_code_duplication = self._has_duplication(lines)
        features.has_long_parameters = self._has_long_params(code, language)
        
        # Calculate quality score
        features.quality_score = self._calculate_score(features)
        
        return features
    
    def _has_comments(self, code: str, language: str) -> bool:
        """Check if code has comments"""
        if language == 'python':
            return '#' in code
        return '//' in code or '/*' in code
    
    def _comment_density(self, code: str, language: str) -> float:
        """Calculate comment density"""
        lines = code.split('\n')
        if not lines:
            return 0.0
        
        comment_lines = 0
        for line in lines:
            stripped = line.strip()
            if language == 'python' and stripped.startswith('#'):
                comment_lines += 1
            elif stripped.startswith('//') or stripped.startswith('/*'):
                comment_lines += 1
        
        return comment_lines / len(lines)
    
    def _has_docstrings(self, code: str, language: str) -> bool:
        """Check for docstrings"""
        if language == 'python':
            return '"""' in code or "'''" in code
        elif language == 'java':
            return '/**' in code
        return False
    
    def _avg_line_length(self, lines: List[str]) -> float:
        """Calculate average line length"""
        non_empty = [l for l in lines if l.strip()]
        if not non_empty:
            return 0.0
        return sum(len(l) for l in non_empty) / len(non_empty)
    
    def _max_line_length(self, lines: List[str]) -> int:
        """Get maximum line length"""
        return max((len(l) for l in lines), default=0)
    
    def _has_descriptive_names(self, code: str) -> bool:
        """Check for descriptive variable names"""
        # Look for names longer than 2 characters
        vars = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b', code)
        return len(vars) >= 3
    
    def _has_functions(self, code: str, language: str) -> bool:
        """Check if code defines functions"""
        if language == 'python':
            return 'def ' in code
        return 'function ' in code or bool(re.search(r'\w+\s*\(', code))
    
    def _count_functions(self, code: str, language: str) -> int:
        """Count functions"""
        if language == 'python':
            return len(re.findall(r'def\s+\w+', code))
        return len(re.findall(r'function\s+\w+', code))
    
    def _has_magic_numbers(self, code: str) -> bool:
        """Check for magic numbers"""
        # Find numbers other than 0, 1, -1
        numbers = re.findall(r'\b\d{2,}\b', code)
        return len(numbers) >= 3
    
    def _has_globals(self, code: str, language: str) -> bool:
        """Check for global variables"""
        if language == 'python':
            return bool(re.search(r'^[A-Z_]{2,}\s*=', code, re.MULTILINE))
        return False
    
    def _max_nesting(self, code: str, language: str) -> int:
        """Calculate maximum nesting depth"""
        lines = code.split('\n')
        max_depth = 0
        current_depth = 0
        
        for line in lines:
            if language == 'python':
                indent = len(line) - len(line.lstrip())
                depth = indent // 4
                max_depth = max(max_depth, depth)
            else:
                current_depth += line.count('{')
                current_depth -= line.count('}')
                max_depth = max(max_depth, current_depth)
        
        return max_depth
    
    def _has_error_handling(self, code: str, language: str) -> bool:
        """Check for error handling"""
        if language == 'python':
            return 'try:' in code or 'except' in code
        return 'try' in code or 'catch' in code
    
    def _has_type_hints(self, code: str, language: str) -> bool:
        """Check for type hints"""
        if language == 'python':
            return '->' in code or ': ' in code
        return True  # Java/C++ are statically typed
    
    def _has_duplication(self, lines: List[str]) -> bool:
        """Check for code duplication"""
        non_empty = [l.strip() for l in lines if l.strip()]
        unique = set(non_empty)
        
        if not non_empty:
            return False
        
        duplication_ratio = 1 - (len(unique) / len(non_empty))
        return duplication_ratio > 0.3
    
    def _has_long_params(self, code: str, language: str) -> bool:
        """Check for long parameter lists"""
        if language == 'python':
            pattern = r'def\s+\w+\s*\(([^)]+)\)'
        else:
            pattern = r'\w+\s*\(([^)]+)\)'
        
        for match in re.finditer(pattern, code):
            params = match.group(1)
            param_count = len([p for p in params.split(',') if p.strip()])
            if param_count > 5:
                return True
        
        return False
    
    def _calculate_score(self, features: QualityFeatures) -> float:
        """Calculate overall quality score"""
        score = 0.5  # Base score
        
        # Positive factors
        if features.has_comments:
            score += 0.05
        if features.has_docstrings:
            score += 0.05
        if features.has_descriptive_names:
            score += 0.1
        if features.has_functions:
            score += 0.1
        if features.has_error_handling:
            score += 0.1
        if features.has_type_hints:
            score += 0.05
        
        # Negative factors
        if features.has_magic_numbers:
            score -= 0.1
        if features.max_nesting_depth > 3:
            score -= 0.1
        if features.has_code_duplication:
            score -= 0.1
        if features.has_long_parameters:
            score -= 0.05
        if features.max_line_length > 120:
            score -= 0.05
        
        return max(0.0, min(1.0, score))
    
    def to_dict(self, features: QualityFeatures) -> Dict[str, Any]:
        """Convert features to dictionary"""
        return {
            'has_comments': features.has_comments,
            'comment_density': features.comment_density,
            'has_docstrings': features.has_docstrings,
            'avg_line_length': features.avg_line_length,
            'max_line_length': features.max_line_length,
            'has_descriptive_names': features.has_descriptive_names,
            'uses_snake_case': features.uses_snake_case,
            'uses_camel_case': features.uses_camel_case,
            'has_functions': features.has_functions,
            'has_classes': features.has_classes,
            'function_count': features.function_count,
            'has_magic_numbers': features.has_magic_numbers,
            'has_global_variables': features.has_global_variables,
            'max_nesting_depth': features.max_nesting_depth,
            'has_error_handling': features.has_error_handling,
            'has_type_hints': features.has_type_hints,
            'has_code_duplication': features.has_code_duplication,
            'has_long_parameters': features.has_long_parameters,
            'quality_score': features.quality_score
        }


# Global instance
_extractor = QualityFeatureExtractor()


def extract_quality_features(code: str, language: str = 'python') -> QualityFeatures:
    """Extract quality features from code"""
    return _extractor.extract(code, language)