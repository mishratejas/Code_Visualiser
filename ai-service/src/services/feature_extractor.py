import ast # Python ka Abstract Syntax Tree module.
#Isse Python code ko parse karke uska structure (functions, loops, if, etc.) samajh sakte hain.
import re  #Regular Expressions
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import numpy as np

@dataclass
class CodeFeatures:
    """Container for extracted code features"""
    # Structural features
    lines_of_code: int = 0
    cyclomatic_complexity: int = 0
    max_nesting_depth: int = 0
    function_count: int = 0
    class_count: int = 0
    comment_density: float = 0.0
    
    # Control flow features
    loop_count: int = 0
    conditional_count: int = 0
    recursion_present: bool = False
    exception_count: int = 0
    
    # Algorithmic patterns
    uses_sorting: bool = False
    uses_hashing: bool = False
    uses_recursion: bool = False
    uses_dp: bool = False
    uses_bfs_dfs: bool = False
    uses_binary_search: bool = False
    
    # Language-specific features
    python_specific: Dict = None
    java_specific: Dict = None
    cpp_specific: Dict = None
    js_specific: Dict = None
    
    # Runtime metrics (from execution)
    runtime_ms: int = 0
    memory_kb: int = 0
    test_cases_passed: int = 0
    total_test_cases: int = 0

class FeatureExtractor:
    """Extract features from code for ML analysis"""
    
    def __init__(self):
        self.language_parsers = {
            'python': self._parse_python,
            'java': self._parse_java,
            'cpp': self._parse_cpp,
            'javascript': self._parse_javascript
        }
    
    def extract_features(self, code: str, language: str, 
                        runtime_info: Dict = None) -> CodeFeatures:
        """Extract all features from code"""
        features = CodeFeatures()
        
        # Basic metrics
        features.lines_of_code = self._count_lines(code)
        features.comment_density = self._calculate_comment_density(code, language)
        
        # Parse code based on language
        if language in self.language_parsers:
            try:
                lang_features = self.language_parsers[language](code)
                features = self._merge_features(features, lang_features)
            except Exception as e:
                print(f"Warning: Failed to parse {language} code: {e}")
        
        # Runtime features
        if runtime_info:
            features.runtime_ms = runtime_info.get('runtime', 0)
            features.memory_kb = runtime_info.get('memory', 0)
            features.test_cases_passed = runtime_info.get('test_cases_passed', 0)
            features.total_test_cases = runtime_info.get('total_test_cases', 0)
        
        # Detect algorithmic patterns
        features.uses_sorting = self._detect_sorting(code, language)
        features.uses_hashing = self._detect_hashing(code, language)
        features.uses_recursion = self._detect_recursion(code, language)
        features.uses_dp = self._detect_dp_patterns(code, language)
        features.uses_bfs_dfs = self._detect_graph_traversal(code, language)
        features.uses_binary_search = self._detect_binary_search(code, language)
        
        return features
    
    def _parse_python(self, code: str) -> CodeFeatures:
        """Parse Python code and extract features"""
        features = CodeFeatures()
        
        try:
            tree = ast.parse(code)
            
            # Count functions and classes
            features.function_count = len([node for node in ast.walk(tree) 
                                          if isinstance(node, ast.FunctionDef)])
            features.class_count = len([node for node in ast.walk(tree) 
                                       if isinstance(node, ast.ClassDef)])
            
            # Calculate cyclomatic complexity
            features.cyclomatic_complexity = self._calculate_python_complexity(tree)
            
            # Count loops and conditionals
            for node in ast.walk(tree):
                if isinstance(node, (ast.For, ast.While, ast.AsyncFor)):
                    features.loop_count += 1
                elif isinstance(node, (ast.If, ast.IfExp)):
                    features.conditional_count += 1
                elif isinstance(node, ast.Try):
                    features.exception_count += 1
            
            # Python-specific features
            features.python_specific = {
                'list_comprehensions': len([n for n in ast.walk(tree) 
                                           if isinstance(n, ast.ListComp)]),
                'generator_expressions': len([n for n in ast.walk(tree) 
                                             if isinstance(n, ast.GeneratorExp)]),
                'decorators': len([n for n in ast.walk(tree) 
                                  if isinstance(n, ast.decorator_list)]),
                'lambda_functions': len([n for n in ast.walk(tree) 
                                        if isinstance(n, ast.Lambda)])
            }
            
        except SyntaxError:
            pass
        
        return features
    
    def _parse_cpp(self, code: str) -> CodeFeatures:
        """Parse C++ code and extract features"""
        features = CodeFeatures()
        
        # Count functions (simplified regex approach)
        function_pattern = r'\w+\s+\w+\s*\([^)]*\)\s*\{'
        features.function_count = len(re.findall(function_pattern, code))
        
        # Count classes
        class_pattern = r'class\s+\w+'
        features.class_count = len(re.findall(class_pattern, code))
        
        # Count loops
        loop_pattern = r'\b(for|while|do)\s*\([^)]*\)'
        features.loop_count = len(re.findall(loop_pattern, code))
        
        # Count conditionals
        conditional_pattern = r'\b(if|else if|switch)\s*\([^)]*\)'
        features.conditional_count = len(re.findall(conditional_pattern, code))
        
        # C++ specific features
        features.cpp_specific = {
            'pointer_usage': len(re.findall(r'[*&]', code)),
            'stl_usage': len(re.findall(r'std::|#include <.*>', code)),
            'template_usage': len(re.findall(r'template\s*<', code))
        }
        
        return features
    
    def _parse_java(self, code: str) -> CodeFeatures:
        """Parse Java code and extract features"""
        features = CodeFeatures()
        
        # Similar patterns to C++
        function_pattern = r'(public|private|protected|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])'
        features.function_count = len(re.findall(function_pattern, code))
        
        class_pattern = r'class\s+\w+'
        features.class_count = len(re.findall(class_pattern, code))
        
        # Java specific features
        features.java_specific = {
            'interface_usage': len(re.findall(r'interface\s+\w+', code)),
            'exception_handling': len(re.findall(r'throws\s+\w+|try\s*\{|catch\s*\(', code)),
            'stream_usage': len(re.findall(r'\.stream\(|Stream\.', code))
        }
        
        return features
    
    def _parse_javascript(self, code: str) -> CodeFeatures:
        """Parse JavaScript code and extract features"""
        features = CodeFeatures()
        
        # Function patterns for JS
        function_pattern = r'function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*\{'
        features.function_count = len(re.findall(function_pattern, code))
        
        # JS specific features
        features.js_specific = {
            'async_await': len(re.findall(r'async\s+function|\bawait\b', code)),
            'arrow_functions': len(re.findall(r'=>', code)),
            'promise_usage': len(re.findall(r'Promise\.|\.then\(|\.catch\(', code))
        }
        
        return features
    
    def _count_lines(self, code: str) -> int:
        """Count non-empty lines of code"""
        lines = code.strip().split('\n')
        return len([line for line in lines if line.strip()])
    
    def _calculate_comment_density(self, code: str, language: str) -> float:
        """Calculate comment density (comments/total lines)"""
        lines = code.split('\n')
        total_lines = len(lines)
        
        if total_lines == 0:
            return 0.0
        
        comment_count = 0
        in_block_comment = False
        
        for line in lines:
            stripped = line.strip()
            
            if language in ['python']:
                if stripped.startswith('#'):
                    comment_count += 1
                elif '"""' in line or "'''" in line:
                    # Handle Python block comments
                    comment_count += 1
                    
            elif language in ['java', 'cpp', 'javascript']:
                if stripped.startswith('//'):
                    comment_count += 1
                elif '/*' in line:
                    in_block_comment = True
                    comment_count += 1
                elif '*/' in line:
                    in_block_comment = False
                    comment_count += 1
                elif in_block_comment:
                    comment_count += 1
        
        return comment_count / total_lines if total_lines > 0 else 0.0
    
    def _detect_sorting(self, code: str, language: str) -> bool:
        """Detect if sorting is used"""
        patterns = {
            'python': [r'\.sort\(\)', r'sorted\(', r'heapq\.', 'sort='],
            'java': [r'Collections\.sort', r'Arrays\.sort', r'\.sort\('],
            'cpp': [r'std::sort', r'std::stable_sort', 'sort('],
            'javascript': [r'\.sort\(\)', r'sort\(']
        }
        
        if language in patterns:
            for pattern in patterns[language]:
                if re.search(pattern, code):
                    return True
        return False
    
    def _detect_hashing(self, code: str, language: str) -> bool:
        """Detect if hashing data structures are used"""
        patterns = {
            'python': [r'dict\(', r'\{\}', r'collections\.defaultdict'],
            'java': [r'HashMap', r'HashSet', r'Hashtable'],
            'cpp': [r'std::unordered_map', r'std::unordered_set', r'std::map'],
            'javascript': [r'Map\(', r'Set\(', r'\{\}']
        }
        
        if language in patterns:
            for pattern in patterns[language]:
                if re.search(pattern, code):
                    return True
        return False
    
    def _detect_recursion(self, code: str, language: str) -> bool:
        """Detect if recursion is used"""
        # Simple pattern matching for function calls
        # This is a simplified version - would need more sophisticated analysis
        return False
    
    def _detect_dp_patterns(self, code: str, language: str) -> bool:
        """Detect dynamic programming patterns"""
        dp_keywords = ['memo', 'dp[', 'memoization', 'tabulation']
        for keyword in dp_keywords:
            if keyword in code.lower():
                return True
        return False
    
    def _detect_graph_traversal(self, code: str, language: str) -> bool:
        """Detect BFS/DFS patterns"""
        traversal_patterns = ['queue.append', 'queue.push', 'stack.push', 
                             'deque.append', 'bfs', 'dfs', 'visited.add']
        for pattern in traversal_patterns:
            if pattern in code:
                return True
        return False
    
    def _detect_binary_search(self, code: str, language: str) -> bool:
        """Detect binary search patterns"""
        bs_patterns = ['mid =', 'left <= right', 'binary_search', 
                      'lower_bound', 'upper_bound']
        for pattern in bs_patterns:
            if pattern in code:
                return True
        return False
    
    def _calculate_python_complexity(self, tree) -> int:
        """Calculate cyclomatic complexity for Python code"""
        complexity = 1  # Start at 1
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(node, ast.Try):
                complexity += len(node.handlers)
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
        
        return complexity
    
    def _merge_features(self, base: CodeFeatures, new: CodeFeatures) -> CodeFeatures:
        """Merge two feature sets"""
        for attr in vars(base):
            if hasattr(new, attr):
                new_value = getattr(new, attr)
                if new_value is not None:
                    setattr(base, attr, new_value)
        return base
    
    def features_to_dict(self, features: CodeFeatures) -> Dict[str, Any]:
        """Convert features to dictionary for ML models"""
        feature_dict = {}
        
        for key, value in vars(features).items():
            if isinstance(value, (int, float, bool, str)):
                feature_dict[key] = value
            elif isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    feature_dict[f"{key}_{sub_key}"] = sub_value
        
        return feature_dict