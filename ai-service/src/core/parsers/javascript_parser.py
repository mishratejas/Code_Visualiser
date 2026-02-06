"""
JavaScript code parser using regex patterns
"""
import re
from typing import Dict, List, Any


class JavaScriptParser:
    """Parse JavaScript code and extract structural information"""
    
    def __init__(self):
        self.function_pattern = r'(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|(\w+)\s*:\s*(?:async\s+)?function)'
        self.class_pattern = r'class\s+(\w+)(?:\s+extends\s+(\w+))?'
        self.import_pattern = r'import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+["\']([^"\']+)["\']'
        self.export_pattern = r'export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)'
    
    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse JavaScript code and extract information
        
        Args:
            code: JavaScript source code
            
        Returns:
            Dictionary with parsed information
        """
        # Remove comments
        code = self._remove_comments(code)
        
        return {
            'functions': self._extract_functions(code),
            'classes': self._extract_classes(code),
            'imports': self._extract_imports(code),
            'exports': self._extract_exports(code),
            'arrow_functions': self._count_arrow_functions(code),
            'async_functions': self._count_async_functions(code),
            'promises': self._detect_promises(code),
            'complexity': self._calculate_complexity(code),
            'lines_of_code': len([l for l in code.split('\n') if l.strip()]),
            'uses_es6': self._detect_es6_features(code)
        }
    
    def _remove_comments(self, code: str) -> str:
        """Remove JavaScript comments"""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*[\s\S]*?\*/', '', code)
        return code
    
    def _extract_functions(self, code: str) -> List[Dict[str, Any]]:
        """Extract function definitions"""
        functions = []
        
        # Regular function declarations
        for match in re.finditer(r'function\s+(\w+)\s*\(([^)]*)\)', code):
            functions.append({
                'name': match.group(1),
                'parameters': [p.strip() for p in match.group(2).split(',') if p.strip()],
                'line': code[:match.start()].count('\n') + 1,
                'type': 'function'
            })
        
        # Arrow functions assigned to const/let/var
        for match in re.finditer(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>', code):
            functions.append({
                'name': match.group(1),
                'parameters': [p.strip() for p in match.group(2).split(',') if p.strip()],
                'line': code[:match.start()].count('\n') + 1,
                'type': 'arrow'
            })
        
        return functions
    
    def _extract_classes(self, code: str) -> List[Dict[str, Any]]:
        """Extract class definitions"""
        classes = []
        
        for match in re.finditer(self.class_pattern, code):
            class_name = match.group(1)
            parent_class = match.group(2) if len(match.groups()) > 1 else None
            line_number = code[:match.start()].count('\n') + 1
            
            # Try to extract methods
            class_start = match.end()
            methods = self._extract_class_methods(code, class_start)
            
            classes.append({
                'name': class_name,
                'extends': parent_class,
                'line': line_number,
                'methods': methods,
                'method_count': len(methods)
            })
        
        return classes
    
    def _extract_class_methods(self, code: str, start_pos: int) -> List[str]:
        """Extract methods from class body"""
        methods = []
        
        # Find class body
        brace_start = code.find('{', start_pos)
        if brace_start == -1:
            return methods
        
        brace_count = 0
        body_end = brace_start
        
        for i in range(brace_start, len(code)):
            if code[i] == '{':
                brace_count += 1
            elif code[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    body_end = i
                    break
        
        body = code[brace_start:body_end]
        
        # Extract method names
        for match in re.finditer(r'(\w+)\s*\([^)]*\)\s*\{', body):
            method_name = match.group(1)
            if method_name not in ['if', 'for', 'while', 'switch']:
                methods.append(method_name)
        
        return methods
    
    def _extract_imports(self, code: str) -> List[str]:
        """Extract import statements"""
        imports = []
        
        for match in re.finditer(self.import_pattern, code):
            imports.append(match.group(1))
        
        return imports
    
    def _extract_exports(self, code: str) -> List[str]:
        """Extract export statements"""
        exports = []
        
        for match in re.finditer(self.export_pattern, code):
            exports.append(match.group(1))
        
        return exports
    
    def _count_arrow_functions(self, code: str) -> int:
        """Count arrow functions"""
        return len(re.findall(r'=>', code))
    
    def _count_async_functions(self, code: str) -> int:
        """Count async functions"""
        return len(re.findall(r'\basync\s+(?:function|\()', code))
    
    def _detect_promises(self, code: str) -> bool:
        """Detect Promise usage"""
        return bool(re.search(r'Promise\.|\.then\(|\.catch\(|await\s+', code))
    
    def _calculate_complexity(self, code: str) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1
        
        complexity += len(re.findall(r'\bif\s*\(', code))
        complexity += len(re.findall(r'\belse\s+if\s*\(', code))
        complexity += len(re.findall(r'\bwhile\s*\(', code))
        complexity += len(re.findall(r'\bfor\s*\(', code))
        complexity += len(re.findall(r'\bcase\s+', code))
        complexity += len(re.findall(r'\bcatch\s*\(', code))
        complexity += len(re.findall(r'\&\&', code))
        complexity += len(re.findall(r'\|\|', code))
        complexity += len(re.findall(r'\?[^:]', code))  # Ternary
        
        return complexity
    
    def _detect_es6_features(self, code: str) -> Dict[str, bool]:
        """Detect ES6+ features"""
        return {
            'arrow_functions': '=>' in code,
            'template_literals': '`' in code,
            'destructuring': re.search(r'const\s*\{[^}]+\}\s*=', code) is not None,
            'spread_operator': '...' in code,
            'classes': 'class ' in code,
            'modules': 'import ' in code or 'export ' in code,
            'async_await': 'async ' in code or 'await ' in code
        }


# Global instance
_parser = JavaScriptParser()


def parse_javascript(code: str) -> Dict[str, Any]:
    """Parse JavaScript code"""
    return _parser.parse(code)