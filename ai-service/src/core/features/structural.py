"""
Extract structural features from code
"""
from typing import Dict, Any


class StructuralFeatures:
    """Extract structural metrics from code"""
    
    def extract(self, code: str, language: str, parsed_info: Dict = None) -> Dict[str, Any]:
        """
        Extract structural features
        
        Args:
            code: Source code
            language: Programming language
            parsed_info: Pre-parsed code information
            
        Returns:
            Dictionary of structural features
        """
        if parsed_info is None:
            parsed_info = {}
        
        return {
            # Basic metrics
            'total_lines': len(code.split('\n')),
            'code_lines': self._count_code_lines(code, language),
            'blank_lines': self._count_blank_lines(code),
            'comment_lines': self._count_comment_lines(code, language),
            
            # Character metrics
            'total_characters': len(code),
            'avg_line_length': self._avg_line_length(code),
            'max_line_length': self._max_line_length(code),
            
            # Structural counts
            'function_count': len(parsed_info.get('functions', [])),
            'class_count': len(parsed_info.get('classes', [])),
            'import_count': len(parsed_info.get('imports', [])),
            
            # Nesting and complexity
            'max_nesting_depth': self._calculate_nesting(code, language),
            'avg_function_length': self._avg_function_length(parsed_info),
            
            # Code organization
            'comment_density': self._calculate_comment_density(code, language),
            'blank_line_density': self._blank_line_density(code)
        }
    
    def _count_code_lines(self, code: str, language: str) -> int:
        """Count lines with actual code"""
        lines = code.split('\n')
        code_lines = 0
        
        for line in lines:
            stripped = line.strip()
            if stripped and not self._is_comment_line(stripped, language):
                code_lines += 1
        
        return code_lines
    
    def _count_blank_lines(self, code: str) -> int:
        """Count blank lines"""
        return len([l for l in code.split('\n') if not l.strip()])
    
    def _count_comment_lines(self, code: str, language: str) -> int:
        """Count comment lines"""
        lines = code.split('\n')
        comment_count = 0
        in_block_comment = False
        
        for line in lines:
            stripped = line.strip()
            
            if language == 'python':
                if stripped.startswith('#'):
                    comment_count += 1
                elif '"""' in line or "'''" in line:
                    comment_count += 1
            else:
                if stripped.startswith('//'):
                    comment_count += 1
                elif stripped.startswith('/*'):
                    in_block_comment = True
                    comment_count += 1
                elif stripped.startswith('*') and in_block_comment:
                    comment_count += 1
                elif '*/' in line:
                    in_block_comment = False
                    comment_count += 1
                elif in_block_comment:
                    comment_count += 1
        
        return comment_count
    
    def _is_comment_line(self, line: str, language: str) -> bool:
        """Check if line is a comment"""
        if language == 'python':
            return line.startswith('#')
        else:
            return line.startswith('//') or line.startswith('/*') or line.startswith('*')
    
    def _avg_line_length(self, code: str) -> float:
        """Calculate average line length"""
        lines = [l for l in code.split('\n') if l.strip()]
        if not lines:
            return 0
        return sum(len(l) for l in lines) / len(lines)
    
    def _max_line_length(self, code: str) -> int:
        """Find maximum line length"""
        return max((len(l) for l in code.split('\n')), default=0)
    
    def _calculate_nesting(self, code: str, language: str) -> int:
        """Calculate maximum nesting depth"""
        lines = code.split('\n')
        max_depth = 0
        current_depth = 0
        
        for line in lines:
            if language == 'python':
                # Count leading spaces
                spaces = len(line) - len(line.lstrip())
                depth = spaces // 4  # Assuming 4-space indentation
                max_depth = max(max_depth, depth)
            else:
                # Count braces
                stripped = line.strip()
                if '{' in stripped:
                    current_depth += stripped.count('{')
                if '}' in stripped:
                    current_depth -= stripped.count('}')
                max_depth = max(max_depth, current_depth)
                current_depth = max(0, current_depth)
        
        return max_depth
    
    def _avg_function_length(self, parsed_info: Dict) -> float:
        """Calculate average function length"""
        functions = parsed_info.get('functions', [])
        if not functions:
            return 0
        
        # This is approximate - would need actual function body lengths
        # For now, return a placeholder
        return 10.0
    
    def _calculate_comment_density(self, code: str, language: str) -> float:
        """Calculate comment density (comments / total lines)"""
        total_lines = len(code.split('\n'))
        if total_lines == 0:
            return 0
        
        comment_lines = self._count_comment_lines(code, language)
        return comment_lines / total_lines
    
    def _blank_line_density(self, code: str) -> float:
        """Calculate blank line density"""
        total_lines = len(code.split('\n'))
        if total_lines == 0:
            return 0
        
        blank_lines = self._count_blank_lines(code)
        return blank_lines / total_lines


# Global instance
_extractor = StructuralFeatures()


def extract_structural_features(code: str, language: str, parsed_info: Dict = None) -> Dict[str, Any]:
    """Extract structural features from code"""
    return _extractor.extract(code, language, parsed_info)