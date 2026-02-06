"""
AST-based code similarity calculation
"""
import ast
import hashlib
from typing import List, Tuple, Dict
from dataclasses import dataclass


@dataclass
class ASTNode:
    """Simplified AST node representation"""
    type: str
    children: List['ASTNode']
    value: str = ""


class ASTSimilarity:
    """Calculate similarity between code using Abstract Syntax Trees"""
    
    def __init__(self):
        self.ignore_names = True  # Ignore variable names
        self.ignore_literals = True  # Ignore literal values
    
    def calculate_similarity(self, code1: str, code2: str, language: str = 'python') -> float:
        """
        Calculate AST similarity between two code snippets
        
        Args:
            code1: First code snippet
            code2: Second code snippet
            language: Programming language
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        try:
            if language == 'python':
                tree1 = self._parse_python(code1)
                tree2 = self._parse_python(code2)
            else:
                # For other languages, use approximation
                return self._approximate_similarity(code1, code2)
            
            # Calculate tree edit distance
            distance = self._tree_edit_distance(tree1, tree2)
            
            # Normalize to similarity score
            max_nodes = max(self._count_nodes(tree1), self._count_nodes(tree2))
            if max_nodes == 0:
                return 0.0
            
            similarity = 1.0 - (distance / max_nodes)
            return max(0.0, min(1.0, similarity))
            
        except Exception as e:
            print(f"AST similarity calculation failed: {e}")
            return 0.0
    
    def _parse_python(self, code: str) -> ast.AST:
        """Parse Python code into AST"""
        try:
            return ast.parse(code)
        except SyntaxError:
            # If parsing fails, try to fix common issues
            code = code.strip()
            return ast.parse(code)
    
    def _tree_edit_distance(self, tree1: ast.AST, tree2: ast.AST) -> int:
        """
        Calculate edit distance between two ASTs
        Uses a simplified version of Zhang-Shasha algorithm
        """
        nodes1 = list(ast.walk(tree1))
        nodes2 = list(ast.walk(tree2))
        
        # Create DP table
        m, n = len(nodes1), len(nodes2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        # Initialize base cases
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        
        # Fill DP table
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if self._nodes_equal(nodes1[i-1], nodes2[j-1]):
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = 1 + min(
                        dp[i-1][j],      # Delete
                        dp[i][j-1],      # Insert
                        dp[i-1][j-1]     # Replace
                    )
        
        return dp[m][n]
    
    def _nodes_equal(self, node1: ast.AST, node2: ast.AST) -> bool:
        """Check if two AST nodes are equivalent"""
        # Compare node types
        if type(node1) != type(node2):
            return False
        
        # For certain nodes, compare values
        if isinstance(node1, ast.Num) and isinstance(node2, ast.Num):
            if self.ignore_literals:
                return True
            return node1.n == node2.n
        
        if isinstance(node1, ast.Str) and isinstance(node2, ast.Str):
            if self.ignore_literals:
                return True
            return node1.s == node2.s
        
        if isinstance(node1, ast.Name) and isinstance(node2, ast.Name):
            if self.ignore_names:
                return True
            return node1.id == node2.id
        
        # For other nodes, just compare type
        return True
    
    def _count_nodes(self, tree: ast.AST) -> int:
        """Count total nodes in AST"""
        return len(list(ast.walk(tree)))
    
    def _approximate_similarity(self, code1: str, code2: str) -> float:
        """
        Approximate AST similarity for non-Python languages
        Uses structural patterns
        """
        # Extract structural patterns
        patterns1 = self._extract_patterns(code1)
        patterns2 = self._extract_patterns(code2)
        
        # Calculate Jaccard similarity of patterns
        if not patterns1 and not patterns2:
            return 1.0
        
        intersection = len(patterns1.intersection(patterns2))
        union = len(patterns1.union(patterns2))
        
        return intersection / union if union > 0 else 0.0
    
    def _extract_patterns(self, code: str) -> set:
        """Extract structural patterns from code"""
        patterns = set()
        
        # Control structures
        if 'if' in code:
            patterns.add('if_statement')
        if 'for' in code:
            patterns.add('for_loop')
        if 'while' in code:
            patterns.add('while_loop')
        if 'function' in code or 'def ' in code:
            patterns.add('function_def')
        if 'class' in code:
            patterns.add('class_def')
        
        # Operators
        if '==' in code:
            patterns.add('equality_check')
        if '+' in code:
            patterns.add('addition')
        if '*' in code:
            patterns.add('multiplication')
        
        # Data structures
        if '[' in code:
            patterns.add('array_access')
        if '{' in code:
            patterns.add('object_access')
        
        return patterns
    
    def get_ast_fingerprint(self, code: str, language: str = 'python') -> str:
        """
        Generate a fingerprint for code based on AST structure
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            Hexadecimal fingerprint string
        """
        try:
            if language == 'python':
                tree = self._parse_python(code)
                structure = self._serialize_ast(tree)
            else:
                structure = str(self._extract_patterns(code))
            
            # Create hash of structure
            return hashlib.sha256(structure.encode()).hexdigest()
            
        except Exception:
            return hashlib.sha256(code.encode()).hexdigest()
    
    def _serialize_ast(self, tree: ast.AST) -> str:
        """Serialize AST to string representation"""
        parts = []
        
        for node in ast.walk(tree):
            node_type = type(node).__name__
            
            if self.ignore_names and isinstance(node, ast.Name):
                parts.append('Name')
            elif self.ignore_literals and isinstance(node, (ast.Num, ast.Str)):
                parts.append(node_type)
            else:
                parts.append(node_type)
        
        return '|'.join(parts)