"""
C++ code parser using regex patterns
"""
import re
from typing import Dict, List, Any


class CppParser:
    """Parse C++ code and extract structural information"""
    
    def __init__(self):
        self.function_pattern = r'([\w:<>]+)\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*\{'
        self.class_pattern = r'class\s+(\w+)\s*(?::\s*(?:public|private|protected)\s+[\w:<>]+)?\s*\{'
        self.include_pattern = r'#include\s*[<"]([^>"]+)[>"]'
        self.namespace_pattern = r'namespace\s+(\w+)'
    
    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse C++ code and extract information
        
        Args:
            code: C++ source code
            
        Returns:
            Dictionary with parsed information
        """
        # Remove comments
        code = self._remove_comments(code)
        
        return {
            'functions': self._extract_functions(code),
            'classes': self._extract_classes(code),
            'includes': self._extract_includes(code),
            'namespaces': self._extract_namespaces(code),
            'templates': self._extract_templates(code),
            'complexity': self._calculate_complexity(code),
            'lines_of_code': len([l for l in code.split('\n') if l.strip()]),
            'uses_stl': self._detect_stl(code),
            'uses_pointers': self._detect_pointers(code)
        }
    
    def _remove_comments(self, code: str) -> str:
        """Remove C++ comments"""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*[\s\S]*?\*/', '', code)
        return code
    
    def _extract_functions(self, code: str) -> List[Dict[str, Any]]:
        """Extract function definitions"""
        functions = []
        
        for match in re.finditer(self.function_pattern, code):
            return_type = match.group(1)
            function_name = match.group(2)
            parameters = match.group(3)
            line_number = code[:match.start()].count('\n') + 1
            
            # Parse parameters
            params = []
            if parameters.strip():
                for param in parameters.split(','):
                    param = param.strip()
                    if param and param != 'void':
                        params.append(param)
            
            functions.append({
                'name': function_name,
                'return_type': return_type,
                'parameters': params,
                'line': line_number,
                'param_count': len(params)
            })
        
        return functions
    
    def _extract_classes(self, code: str) -> List[Dict[str, Any]]:
        """Extract class definitions"""
        classes = []
        
        for match in re.finditer(self.class_pattern, code):
            class_name = match.group(1)
            line_number = code[:match.start()].count('\n') + 1
            
            classes.append({
                'name': class_name,
                'line': line_number
            })
        
        return classes
    
    def _extract_includes(self, code: str) -> List[str]:
        """Extract #include directives"""
        includes = []
        
        for match in re.finditer(self.include_pattern, code):
            includes.append(match.group(1))
        
        return includes
    
    def _extract_namespaces(self, code: str) -> List[str]:
        """Extract namespace declarations"""
        namespaces = []
        
        for match in re.finditer(self.namespace_pattern, code):
            namespaces.append(match.group(1))
        
        return namespaces
    
    def _extract_templates(self, code: str) -> List[str]:
        """Extract template definitions"""
        templates = []
        pattern = r'template\s*<([^>]+)>'
        
        for match in re.finditer(pattern, code):
            templates.append(match.group(1))
        
        return templates
    
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
        
        return complexity
    
    def _detect_stl(self, code: str) -> bool:
        """Detect STL usage"""
        stl_patterns = [
            r'std::vector',
            r'std::map',
            r'std::set',
            r'std::string',
            r'std::sort',
            r'std::algorithm'
        ]
        
        return any(re.search(pattern, code) for pattern in stl_patterns)
    
    def _detect_pointers(self, code: str) -> bool:
        """Detect pointer usage"""
        return bool(re.search(r'\*\w+|->|\bnew\s+\w+', code))


# Global instance
_parser = CppParser()


def parse_cpp(code: str) -> Dict[str, Any]:
    """Parse C++ code"""
    return _parser.parse(code)