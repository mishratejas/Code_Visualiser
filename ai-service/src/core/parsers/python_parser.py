"""
Python code parser using AST
"""
import ast
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class ParsedFunction:
    """Represents a parsed function"""
    name: str
    line_number: int
    args: List[str]
    returns: Optional[str]
    docstring: Optional[str]
    decorators: List[str]
    is_async: bool
    complexity: int


@dataclass
class ParsedClass:
    """Represents a parsed class"""
    name: str
    line_number: int
    bases: List[str]
    methods: List[ParsedFunction]
    docstring: Optional[str]


class PythonParser:
    """Parse Python code and extract structural information"""
    
    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse Python code and extract information
        
        Args:
            code: Python source code
            
        Returns:
            Dictionary with parsed information
        """
        try:
            tree = ast.parse(code)
            
            return {
                'functions': self._extract_functions(tree),
                'classes': self._extract_classes(tree),
                'imports': self._extract_imports(tree),
                'global_vars': self._extract_globals(tree),
                'complexity': self._calculate_complexity(tree),
                'lines_of_code': len(code.split('\n')),
                'docstring': ast.get_docstring(tree)
            }
        except SyntaxError as e:
            return {
                'error': str(e),
                'line': e.lineno,
                'offset': e.offset
            }
    
    def _extract_functions(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract all function definitions"""
        functions = []
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_info = {
                    'name': node.name,
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'returns': self._get_return_type(node),
                    'docstring': ast.get_docstring(node),
                    'decorators': [self._get_decorator_name(d) for d in node.decorator_list],
                    'is_async': isinstance(node, ast.AsyncFunctionDef),
                    'complexity': self._function_complexity(node)
                }
                functions.append(func_info)
        
        return functions
    
    def _extract_classes(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract all class definitions"""
        classes = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                methods = []
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append({
                            'name': item.name,
                            'line': item.lineno,
                            'is_async': isinstance(item, ast.AsyncFunctionDef)
                        })
                
                class_info = {
                    'name': node.name,
                    'line': node.lineno,
                    'bases': [self._get_base_name(base) for base in node.bases],
                    'methods': methods,
                    'docstring': ast.get_docstring(node)
                }
                classes.append(class_info)
        
        return classes
    
    def _extract_imports(self, tree: ast.AST) -> List[Dict[str, str]]:
        """Extract all imports"""
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({
                        'module': alias.name,
                        'alias': alias.asname,
                        'type': 'import'
                    })
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    imports.append({
                        'module': f"{module}.{alias.name}",
                        'alias': alias.asname,
                        'type': 'from'
                    })
        
        return imports
    
    def _extract_globals(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """Extract global variable assignments"""
        globals_list = []
        
        for node in tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        globals_list.append({
                            'name': target.id,
                            'line': node.lineno,
                            'type': self._infer_type(node.value)
                        })
        
        return globals_list
    
    def _calculate_complexity(self, tree: ast.AST) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(node, ast.ExceptHandler):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
        
        return complexity
    
    def _function_complexity(self, func_node: ast.FunctionDef) -> int:
        """Calculate complexity for a specific function"""
        complexity = 1
        
        for node in ast.walk(func_node):
            if isinstance(node, (ast.If, ast.While, ast.For)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
        
        return complexity
    
    def _get_return_type(self, node: ast.FunctionDef) -> Optional[str]:
        """Get return type annotation"""
        if node.returns:
            return ast.unparse(node.returns)
        return None
    
    def _get_decorator_name(self, decorator: ast.AST) -> str:
        """Get decorator name"""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call):
            return ast.unparse(decorator.func)
        return ast.unparse(decorator)
    
    def _get_base_name(self, base: ast.AST) -> str:
        """Get base class name"""
        if isinstance(base, ast.Name):
            return base.id
        return ast.unparse(base)
    
    def _infer_type(self, node: ast.AST) -> str:
        """Infer variable type from assignment"""
        if isinstance(node, ast.Constant):
            return type(node.value).__name__
        elif isinstance(node, ast.List):
            return 'list'
        elif isinstance(node, ast.Dict):
            return 'dict'
        elif isinstance(node, ast.Set):
            return 'set'
        elif isinstance(node, ast.Tuple):
            return 'tuple'
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                return node.func.id
        return 'unknown'


# Global instance
_parser = PythonParser()


def parse_python(code: str) -> Dict[str, Any]:
    """Parse Python code"""
    return _parser.parse(code)