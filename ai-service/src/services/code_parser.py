"""
Unified code parser service
"""
from typing import Dict, Any
import logging

from src.core.parsers.python_parser import parse_python
from src.core.parsers.java_parser import parse_java
from src.core.parsers.cpp_parser import parse_cpp
from src.core.parsers.javascript_parser import parse_javascript

logger = logging.getLogger(__name__)


class CodeParser:
    """Unified parser for multiple programming languages"""
    
    def __init__(self):
        self.parsers = {
            'python': parse_python,
            'java': parse_java,
            'cpp': parse_cpp,
            'c++': parse_cpp,
            'javascript': parse_javascript,
            'js': parse_javascript,
        }
    
    def parse(self, code: str, language: str) -> Dict[str, Any]:
        """
        Parse code in any supported language
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            Parsed code information
        """
        language = language.lower()
        
        if language not in self.parsers:
            logger.warning(f"Unsupported language: {language}")
            return self._fallback_parse(code)
        
        try:
            parser = self.parsers[language]
            return parser(code)
        except Exception as e:
            logger.error(f"Parsing failed for {language}: {e}")
            return self._fallback_parse(code)
    
    def _fallback_parse(self, code: str) -> Dict[str, Any]:
        """Fallback parser for unsupported languages"""
        lines = code.split('\n')
        
        return {
            'lines_of_code': len([l for l in lines if l.strip()]),
            'total_lines': len(lines),
            'character_count': len(code),
            'language': 'unknown',
            'error': 'Language not supported, using fallback parser'
        }
    
    def supports_language(self, language: str) -> bool:
        """Check if language is supported"""
        return language.lower() in self.parsers
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return list(set(self.parsers.keys()))


# Global instance
_code_parser = CodeParser()


def parse_code(code: str, language: str) -> Dict[str, Any]:
    """Parse code using unified parser"""
    return _code_parser.parse(code, language)