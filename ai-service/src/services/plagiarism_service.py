import hashlib
import re
from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class SimilarityResult:
    submission1_id: str
    submission2_id: str
    overall_similarity: float
    token_similarity: float
    ast_similarity: float
    structural_similarity: float
    is_suspicious: bool

class PlagiarismService:
    """Service for plagiarism detection"""
    
    def __init__(self, threshold: float = 0.85):
        self.threshold = threshold
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=1000)
    
    async def check_contest(self, contest_id: str, submissions: List[Dict]) -> Dict:
        """Check all submissions in a contest for plagiarism"""
        print(f"Checking plagiarism for contest {contest_id} with {len(submissions)} submissions")
        
        # Preprocess all submissions
        processed_submissions = []
        for sub in submissions:
            processed = self._preprocess_submission(sub)
            processed_submissions.append(processed)
        
        # Compare all pairs
        similarities = []
        suspicious_pairs = []
        
        for i in range(len(processed_submissions)):
            for j in range(i + 1, len(processed_submissions)):
                sim = await self._compare_submissions(
                    processed_submissions[i],
                    processed_submissions[j]
                )
                
                similarities.append(sim.overall_similarity)
                
                if sim.is_suspicious:
                    suspicious_pairs.append(sim)
        
        # Return results
        return {
            "contest_id": contest_id,
            "total_submissions": len(submissions),
            "suspicious_pairs": [
                {
                    "submission1_id": pair.submission1_id,
                    "submission2_id": pair.submission2_id,
                    "similarity_score": pair.overall_similarity,
                    "token_similarity": pair.token_similarity,
                    "ast_similarity": pair.ast_similarity,
                    "structural_similarity": pair.structural_similarity
                }
                for pair in suspicious_pairs
            ],
            "average_similarity": np.mean(similarities) if similarities else 0,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    async def compare_pair(self, submission1: Dict, submission2: Dict) -> SimilarityResult:
        """Compare two specific submissions"""
        sub1_processed = self._preprocess_submission(submission1)
        sub2_processed = self._preprocess_submission(submission2)
        
        return await self._compare_submissions(sub1_processed, sub2_processed)
    
    def _preprocess_submission(self, submission: Dict) -> Dict:
        """Preprocess submission for comparison"""
        code = submission.get("code", "")
        
        # Remove comments and normalize
        cleaned_code = self._remove_comments(code, submission.get("language", "python"))
        
        # Tokenize
        tokens = self._tokenize_code(cleaned_code)
        
        # Generate fingerprint (Winnowing algorithm)
        fingerprint = self._winnowing_fingerprint(tokens)
        
        return {
            "id": submission.get("id", ""),
            "user_id": submission.get("user_id", ""),
            "original_code": code,
            "cleaned_code": cleaned_code,
            "tokens": tokens,
            "fingerprint": fingerprint,
            "language": submission.get("language", "python")
        }
    
    async def _compare_submissions(self, sub1: Dict, sub2: Dict) -> SimilarityResult:
        """Compare two processed submissions"""
        # 1. Token-based similarity (Winnowing)
        token_sim = self._fingerprint_similarity(sub1["fingerprint"], sub2["fingerprint"])
        
        # 2. Structural similarity
        structural_sim = self._structural_similarity(sub1["cleaned_code"], sub2["cleaned_code"])
        
        # 3. AST similarity (simplified)
        ast_sim = self._ast_similarity(sub1["cleaned_code"], sub2["cleaned_code"], 
                                      sub1["language"], sub2["language"])
        
        # 4. Overall similarity (weighted average)
        overall_sim = (0.4 * token_sim + 0.3 * structural_sim + 0.3 * ast_sim)
        
        return SimilarityResult(
            submission1_id=sub1["id"],
            submission2_id=sub2["id"],
            overall_similarity=overall_sim,
            token_similarity=token_sim,
            ast_similarity=ast_sim,
            structural_similarity=structural_sim,
            is_suspicious=overall_sim > self.threshold
        )
    
    def _remove_comments(self, code: str, language: str) -> str:
        """Remove comments from code"""
        if language == "python":
            # Remove single-line comments
            code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
            # Remove multi-line comments (docstrings)
            code = re.sub(r'\"\"\"[\s\S]*?\"\"\"|\'\'\'[\s\S]*?\'\'\'', '', code)
        elif language in ["java", "cpp", "javascript"]:
            # Remove single-line comments
            code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
            # Remove multi-line comments
            code = re.sub(r'/\*[\s\S]*?\*/', '', code)
        
        return code.strip()
    
    def _tokenize_code(self, code: str) -> List[str]:
        """Tokenize code into meaningful tokens"""
        # Remove whitespace and split
        tokens = re.findall(r'\b\w+\b|[^\w\s]', code)
        # Filter out very short tokens and common operators
        filtered = [token for token in tokens if len(token) > 1 or token in '{}()[];=+-*/%<>!&|']
        return filtered
    
    def _winnowing_fingerprint(self, tokens: List[str], k: int = 5, w: int = 10) -> set:
        """Generate fingerprint using Winnowing algorithm"""
        if len(tokens) < k:
            return set(tokens)
        
        # Generate k-grams
        kgrams = [' '.join(tokens[i:i+k]) for i in range(len(tokens) - k + 1)]
        
        # Hash each k-gram
        hashes = [hashlib.md5(kg.encode()).hexdigest() for kg in kgrams]
        
        # Convert hex to integer for comparison
        hash_ints = [int(h, 16) for h in hashes]
        
        # Apply winnowing
        fingerprints = set()
        for i in range(len(hash_ints) - w + 1):
            window = hash_ints[i:i+w]
            min_hash = min(window)
            min_index = window.index(min_hash) + i
            fingerprints.add(min_hash)
        
        return fingerprints
    
    def _fingerprint_similarity(self, fp1: set, fp2: set) -> float:
        """Calculate Jaccard similarity between fingerprints"""
        if not fp1 and not fp2:
            return 1.0
        if not fp1 or not fp2:
            return 0.0
        
        intersection = len(fp1.intersection(fp2))
        union = len(fp1.union(fp2))
        return intersection / union
    
    def _structural_similarity(self, code1: str, code2: str) -> float:
        """Calculate structural similarity"""
        # Compare line structures, indentation patterns
        lines1 = code1.split('\n')
        lines2 = code2.split('\n')
        
        # Simple line count similarity
        line_sim = 1 - abs(len(lines1) - len(lines2)) / max(len(lines1), len(lines2), 1)
        
        # Compare indentation patterns
        indent1 = [len(line) - len(line.lstrip()) for line in lines1]
        indent2 = [len(line) - len(line.lstrip()) for line in lines2]
        
        if indent1 and indent2:
            avg_indent1 = sum(indent1) / len(indent1)
            avg_indent2 = sum(indent2) / len(indent2)
            indent_sim = 1 - abs(avg_indent1 - avg_indent2) / max(avg_indent1, avg_indent2, 1)
        else:
            indent_sim = 0.5
        
        return (line_sim + indent_sim) / 2
    
    def _ast_similarity(self, code1: str, code2: str, lang1: str, lang2: str) -> float:
        """Calculate AST similarity (simplified version)"""
        if lang1 != lang2:
            return 0.0
        
        # For now, use a simple pattern matching approach
        # In production, you'd use tree-sitter or similar
        
        # Extract function signatures
        func_patterns = {
            'python': r'def\s+(\w+)\s*\([^)]*\)\s*:',
            'java': r'(public|private|protected|static|\s)+[\w\<\>\[\]]+\s+(\w+)\s*\([^)]*\)',
            'cpp': r'\w+\s+\w+\s*\([^)]*\)\s*\{',
            'javascript': r'function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>'
        }
        
        if lang1 in func_patterns:
            funcs1 = re.findall(func_patterns[lang1], code1)
            funcs2 = re.findall(func_patterns[lang1], code2)
            
            if funcs1 and funcs2:
                # Simple count-based similarity
                return len(set(funcs1).intersection(set(funcs2))) / max(len(set(funcs1)), len(set(funcs2)), 1)
        
        return 0.5  # Default medium similarity