"""
Extract algorithmic features from code
"""
import re
from typing import Dict, Any, List


class AlgorithmicFeatures:
    """Extract algorithmic patterns and features"""
    
    def extract(self, code: str, language: str) -> Dict[str, Any]:
        """
        Extract algorithmic features
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            Dictionary of algorithmic features
        """
        return {
            # Data structure usage
            'uses_array': self._detect_array(code, language),
            'uses_list': self._detect_list(code, language),
            'uses_hashmap': self._detect_hashmap(code, language),
            'uses_set': self._detect_set(code, language),
            'uses_tree': self._detect_tree(code, language),
            'uses_graph': self._detect_graph(code, language),
            'uses_heap': self._detect_heap(code, language),
            'uses_queue': self._detect_queue(code, language),
            'uses_stack': self._detect_stack(code, language),
            
            # Algorithmic patterns
            'uses_sorting': self._detect_sorting(code, language),
            'uses_searching': self._detect_searching(code, language),
            'uses_recursion': self._detect_recursion(code, language),
            'uses_dynamic_programming': self._detect_dp(code, language),
            'uses_greedy': self._detect_greedy(code),
            'uses_backtracking': self._detect_backtracking(code),
            'uses_divide_conquer': self._detect_divide_conquer(code),
            'uses_two_pointers': self._detect_two_pointers(code),
            'uses_sliding_window': self._detect_sliding_window(code),
            'uses_binary_search': self._detect_binary_search(code),
            
            # Graph algorithms
            'uses_bfs': self._detect_bfs(code),
            'uses_dfs': self._detect_dfs(code),
            'uses_dijkstra': self._detect_dijkstra(code),
            'uses_union_find': self._detect_union_find(code),
            
            # Loop patterns
            'nested_loop_depth': self._count_nested_loops(code, language),
            'total_loops': self._count_total_loops(code, language),
            
            # Mathematical operations
            'uses_math_ops': self._detect_math_ops(code),
            'uses_bit_manipulation': self._detect_bit_manipulation(code)
        }
    
    def _detect_array(self, code: str, language: str) -> bool:
        """Detect array usage"""
        patterns = {
            'python': [r'\[.*\]', r'list\(', r'array'],
            'java': [r'\[\]', r'Array', r'ArrayList'],
            'cpp': [r'vector', r'\[\]', r'array'],
            'javascript': [r'\[.*\]', r'Array', r'new Array']
        }
        return self._match_any(code, patterns.get(language, patterns['python']))
    
    def _detect_list(self, code: str, language: str) -> bool:
        """Detect list usage"""
        if language == 'python':
            return bool(re.search(r'\[.*\]|list\(', code))
        elif language in ['java', 'cpp']:
            return 'List' in code or 'vector' in code
        return False
    
    def _detect_hashmap(self, code: str, language: str) -> bool:
        """Detect hashmap/dictionary usage"""
        patterns = {
            'python': ['dict', '{', 'defaultdict', 'Counter'],
            'java': ['HashMap', 'Hashtable', 'Map'],
            'cpp': ['unordered_map', 'map'],
            'javascript': ['Map', 'Object', '{}']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_set(self, code: str, language: str) -> bool:
        """Detect set usage"""
        patterns = {
            'python': ['set(', '{', 'frozenset'],
            'java': ['HashSet', 'TreeSet', 'Set'],
            'cpp': ['unordered_set', 'set'],
            'javascript': ['Set']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_tree(self, code: str, language: str) -> bool:
        """Detect tree data structure usage"""
        keywords = ['tree', 'node', 'left', 'right', 'root', 'TreeNode', 'BST']
        return self._match_any(code.lower(), keywords)
    
    def _detect_graph(self, code: str, language: str) -> bool:
        """Detect graph usage"""
        keywords = ['graph', 'vertex', 'edge', 'adjacency', 'neighbor']
        return self._match_any(code.lower(), keywords)
    
    def _detect_heap(self, code: str, language: str) -> bool:
        """Detect heap usage"""
        patterns = {
            'python': ['heapq', 'PriorityQueue'],
            'java': ['PriorityQueue', 'Heap'],
            'cpp': ['priority_queue', 'heap'],
            'javascript': ['heap', 'priority']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_queue(self, code: str, language: str) -> bool:
        """Detect queue usage"""
        patterns = {
            'python': ['queue', 'deque', 'Queue'],
            'java': ['Queue', 'LinkedList'],
            'cpp': ['queue'],
            'javascript': ['queue']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_stack(self, code: str, language: str) -> bool:
        """Detect stack usage"""
        patterns = {
            'python': ['stack', 'append', 'pop'],
            'java': ['Stack', 'push', 'pop'],
            'cpp': ['stack'],
            'javascript': ['stack', 'push', 'pop']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_sorting(self, code: str, language: str) -> bool:
        """Detect sorting algorithms"""
        patterns = {
            'python': ['sort(', 'sorted(', 'heapq'],
            'java': ['sort(', 'Arrays.sort', 'Collections.sort'],
            'cpp': ['sort(', 'std::sort'],
            'javascript': ['sort(']
        }
        return self._match_any(code, patterns.get(language, []))
    
    def _detect_searching(self, code: str, language: str) -> bool:
        """Detect searching algorithms"""
        keywords = ['search', 'find', 'binary_search', 'linear_search']
        return self._match_any(code.lower(), keywords)
    
    def _detect_recursion(self, code: str, language: str) -> bool:
        """Detect recursion (simplified)"""
        # Look for function calling itself
        # This is a simplification - real detection needs parsing
        return 'return' in code and '(' in code
    
    def _detect_dp(self, code: str, language: str) -> bool:
        """Detect dynamic programming patterns"""
        keywords = ['dp[', 'memo', 'cache', 'memoization', 'tabulation']
        return self._match_any(code.lower(), keywords)
    
    def _detect_greedy(self, code: str) -> bool:
        """Detect greedy algorithm patterns"""
        keywords = ['greedy', 'max(', 'min(', 'sort']
        return self._match_any(code.lower(), keywords)
    
    def _detect_backtracking(self, code: str) -> bool:
        """Detect backtracking patterns"""
        keywords = ['backtrack', 'undo', 'restore']
        return self._match_any(code.lower(), keywords)
    
    def _detect_divide_conquer(self, code: str) -> bool:
        """Detect divide and conquer patterns"""
        keywords = ['merge', 'divide', 'conquer', 'mid']
        count = sum(1 for kw in keywords if kw in code.lower())
        return count >= 2
    
    def _detect_two_pointers(self, code: str) -> bool:
        """Detect two pointer technique"""
        keywords = ['left', 'right', 'start', 'end', 'pointer']
        count = sum(1 for kw in keywords if kw in code.lower())
        return count >= 2
    
    def _detect_sliding_window(self, code: str) -> bool:
        """Detect sliding window pattern"""
        keywords = ['window', 'slide', 'left', 'right']
        count = sum(1 for kw in keywords if kw in code.lower())
        return count >= 2
    
    def _detect_binary_search(self, code: str) -> bool:
        """Detect binary search"""
        keywords = ['mid', 'left', 'right', 'binary']
        count = sum(1 for kw in keywords if kw in code.lower())
        return count >= 3
    
    def _detect_bfs(self, code: str) -> bool:
        """Detect BFS algorithm"""
        keywords = ['queue', 'bfs', 'level', 'breadth']
        return self._match_any(code.lower(), keywords)
    
    def _detect_dfs(self, code: str) -> bool:
        """Detect DFS algorithm"""
        keywords = ['dfs', 'depth', 'stack', 'visited']
        return self._match_any(code.lower(), keywords)
    
    def _detect_dijkstra(self, code: str) -> bool:
        """Detect Dijkstra's algorithm"""
        keywords = ['dijkstra', 'distance', 'priority']
        return self._match_any(code.lower(), keywords)
    
    def _detect_union_find(self, code: str) -> bool:
        """Detect Union-Find"""
        keywords = ['union', 'find', 'parent', 'rank']
        count = sum(1 for kw in keywords if kw in code.lower())
        return count >= 2
    
    def _count_nested_loops(self, code: str, language: str) -> int:
        """Count maximum nesting depth of loops"""
        lines = code.split('\n')
        max_depth = 0
        current_depth = 0
        
        loop_keywords = ['for', 'while']
        
        for line in lines:
            stripped = line.strip()
            
            # Check if line starts a loop
            if any(stripped.startswith(kw) for kw in loop_keywords):
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            
            # Decrease depth on closing brace
            if language != 'python' and '}' in stripped:
                current_depth = max(0, current_depth - 1)
        
        return max_depth
    
    def _count_total_loops(self, code: str, language: str) -> int:
        """Count total number of loops"""
        patterns = {
            'python': [r'\bfor\s+', r'\bwhile\s+'],
            'java': [r'\bfor\s*\(', r'\bwhile\s*\('],
            'cpp': [r'\bfor\s*\(', r'\bwhile\s*\('],
            'javascript': [r'\bfor\s*\(', r'\bwhile\s*\(']
        }
        
        count = 0
        for pattern in patterns.get(language, patterns['python']):
            count += len(re.findall(pattern, code))
        
        return count
    
    def _detect_math_ops(self, code: str) -> bool:
        """Detect mathematical operations"""
        return bool(re.search(r'[+\-*/%]|pow|sqrt|abs|max|min', code))
    
    def _detect_bit_manipulation(self, code: str) -> bool:
        """Detect bit manipulation"""
        return bool(re.search(r'[&|^~]|<<|>>|bit', code))
    
    def _match_any(self, code: str, patterns: List[str]) -> bool:
        """Check if any pattern matches"""
        return any(pattern in code for pattern in patterns)


# Global instance
_extractor = AlgorithmicFeatures()


def extract_algorithmic_features(code: str, language: str) -> Dict[str, Any]:
    """Extract algorithmic features from code"""
    return _extractor.extract(code, language)