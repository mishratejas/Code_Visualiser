"""
Java code parser using regex patterns
(For full AST parsing, would need tree-sitter or similar)
"""
import re
from typing import Dict, List, Any, Tuple


class JavaParser:
    """Parse Java code and extract structural information"""
    
    def __init__(self):
        self.class_pattern = r'(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*class\s+(\w+)'
        self.method_pattern = r'(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*([\w<>\[\]]+)\s+(\w+)\s*\((.*?)\)'
        self.import_pattern = r'import\s+([\w.]+(?:\.\*)?);'
        self.field_pattern = r'(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*([\w<>\[\]]+)\s+(\w+)\s*(?:=|;)'
    
    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse Java code and extract information
        
        Args:
            code: Java source code
            
        Returns:
            Dictionary with parsed information
        """
        # Remove comments first
        code = self._remove_comments(code)
        
        return {
            'classes': self._extract_classes(code),
            'methods': self._extract_methods(code),
            'imports': self._extract_imports(code),
            'fields': self._extract_fields(code),
            'interfaces': self._extract_interfaces(code),
            'complexity': self._calculate_complexity(code),
            'lines_of_code': len([l for l in code.split('\n') if l.strip()])
        }
    
    def _remove_comments(self, code: str) -> str:
        """Remove single and multi-line comments"""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*[\s\S]*?\*/', '', code)
        return code
    
    def _extract_classes(self, code: str) -> List[Dict[str, Any]]:
        """Extract class definitions"""
        classes = []
        
        for match in re.finditer(self.class_pattern, code):
            class_name = match.group(1)
            line_number = code[:match.start()].count('\n') + 1
            
            # Try to find class body
            start = match.end()
            brace_count = 0
            body_start = code.find('{', start)
            body_end = body_start
            
            if body_start != -1:
                for i in range(body_start, len(code)):
                    if code[i] == '{':
                        brace_count += 1
                    elif code[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            body_end = i
                            break
                
                body = code[body_start:body_end+1]
                methods = self._extract_methods(body)
            else:
                methods = []
            
            classes.append({
                'name': class_name,
                'line': line_number,
                'methods': methods,
                'method_count': len(methods)
            })
        
        return classes
    
    def _extract_methods(self, code: str) -> List[Dict[str, Any]]:
        """Extract method definitions"""
        methods = []
        
        for match in re.finditer(self.method_pattern, code):
            return_type = match.group(1)
            method_name = match.group(2)
            parameters = match.group(3)
            line_number = code[:match.start()].count('\n') + 1
            
            # Parse parameters
            params = []
            if parameters.strip():
                for param in parameters.split(','):
                    param = param.strip()
                    if param:
                        parts = param.split()
                        if len(parts) >= 2:
                            params.append({
                                'type': ' '.join(parts[:-1]),
                                'name': parts[-1]
                            })
            
            methods.append({
                'name': method_name,
                'return_type': return_type,
                'parameters': params,
                'line': line_number,
                'param_count': len(params)
            })
        
        return methods
    
    def _extract_imports(self, code: str) -> List[str]:
        """Extract import statements"""
        imports = []
        
        for match in re.finditer(self.import_pattern, code):
            imports.append(match.group(1))
        
        return imports
    
    def _extract_fields(self, code: str) -> List[Dict[str, Any]]:
        """Extract field declarations"""
        fields = []
        
        for match in re.finditer(self.field_pattern, code):
            field_type = match.group(1)
            field_name = match.group(2)
            line_number = code[:match.start()].count('\n') + 1
            
            fields.append({
                'name': field_name,
                'type': field_type,
                'line': line_number
            })
        
        return fields
    
    def _extract_interfaces(self, code: str) -> List[str]:
        """Extract interface definitions"""
        interfaces = []
        pattern = r'interface\s+(\w+)'
        
        for match in re.finditer(pattern, code):
            interfaces.append(match.group(1))
        
        return interfaces
    
    def _calculate_complexity(self, code: str) -> int:
        """Calculate approximate cyclomatic complexity"""
        complexity = 1
        
        # Count decision points
        complexity += len(re.findall(r'\bif\s*\(', code))
        complexity += len(re.findall(r'\belse\s+if\s*\(', code))
        complexity += len(re.findall(r'\bwhile\s*\(', code))
        complexity += len(re.findall(r'\bfor\s*\(', code))
        complexity += len(re.findall(r'\bcase\s+', code))
        complexity += len(re.findall(r'\bcatch\s*\(', code))
        complexity += len(re.findall(r'\&\&', code))
        complexity += len(re.findall(r'\|\|', code))
        
        return complexity


# Global instance
_parser = JavaParser()


def parse_java(code: str) -> Dict[str, Any]:
    """Parse Java code"""
    return _parser.parse(code)