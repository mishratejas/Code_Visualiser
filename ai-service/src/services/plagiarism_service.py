"""
Plagiarism Detection Service
Uses:
  1. Winnowing algorithm — document fingerprinting (token k-grams, sliding window)
  2. AST similarity — structural code comparison (ignores variable names)
  3. No ML models or sklearn needed

Why Winnowing?
  - Creates a compact fingerprint of code by picking minimum hashes from sliding windows
  - Jaccard similarity of fingerprints detects copied sections even after renaming
  - Guaranteed to detect any copied block longer than (k + w - 1) tokens

Why AST?
  - Parses code into a tree of types/structure (ignoring identifiers & literals)
  - Two submissions that renamed all variables still show near-100% AST similarity
  - Combined with Winnowing gives robust detection
"""
import ast
import re
import hashlib
import logging
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass
from collections import deque
from datetime import datetime

logger = logging.getLogger(__name__)


# ── Winnowing ─────────────────────────────────────────────────────────────────

class Winnowing:
    """
    Winnowing algorithm for code fingerprinting.
    Reference: Schleimer et al., "Winnowing: Local Algorithms for Document Fingerprinting"

    Steps:
    1. Normalize code (remove comments, lowercase, collapse whitespace)
    2. Tokenize into meaningful tokens
    3. Generate k-grams (overlapping windows of k tokens)
    4. Hash each k-gram
    5. Slide a window of size w over hashes; select the minimum in each window
    6. The set of selected hashes = fingerprint
    7. Compare via Jaccard: |A ∩ B| / |A ∪ B|
    """

    def __init__(self, k: int = 7, w: int = 5):
        """
        k: k-gram size (larger = fewer false positives, may miss short copies)
        w: window size (guarantee threshold = k + w - 1 tokens)
        """
        self.k = k
        self.w = w
        self.guarantee_threshold = k + w - 1  # Any match >= this length WILL be detected

    def fingerprint(self, code: str, language: str = "python") -> Set[int]:
        tokens = self._tokenize(code, language)
        if len(tokens) < self.k:
            return {self._hash(t) for t in tokens}

        # k-grams
        kgrams = [' '.join(tokens[i:i+self.k]) for i in range(len(tokens) - self.k + 1)]
        hashes = [self._hash(kg) for kg in kgrams]

        # Winnowing: pick min hash in each sliding window
        fingerprints: Set[int] = set()
        window: deque = deque(maxlen=self.w)
        prev_min = None

        for h in hashes:
            window.append(h)
            if len(window) == self.w:
                cur_min = min(window)
                if cur_min != prev_min:
                    fingerprints.add(cur_min)
                    prev_min = cur_min

        return fingerprints

    def similarity(self, fp1: Set[int], fp2: Set[int]) -> float:
        if not fp1 and not fp2:
            return 1.0
        if not fp1 or not fp2:
            return 0.0
        intersection = len(fp1 & fp2)
        union = len(fp1 | fp2)
        return intersection / union

    def _tokenize(self, code: str, language: str) -> List[str]:
        """Remove comments, normalize identifiers, keep structure tokens"""
        # Remove comments
        if language in ("java", "cpp", "javascript"):
            code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
            code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        elif language == "python":
            code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
            code = re.sub(r'""".*?"""|\'\'\'.*?\'\'\'', '', code, flags=re.DOTALL)

        # Normalize string literals → STR, numbers → NUM
        code = re.sub(r'"[^"]*"|\'[^\']*\'', 'STR', code)
        code = re.sub(r'\b\d+(\.\d+)?\b', 'NUM', code)

        # Extract meaningful tokens (identifiers + operators + punctuation)
        tokens = re.findall(r'\b\w+\b|[{}()\[\];=+\-*/<>!&|]', code)

        # Normalize variable/function names to generic tokens
        keywords = {
            # Python
            'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while',
            'import', 'from', 'in', 'not', 'and', 'or', 'True', 'False', 'None',
            'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue',
            'lambda', 'yield', 'print', 'range', 'len', 'self',
            # Java/C++
            'int', 'long', 'void', 'bool', 'boolean', 'string', 'String', 'char',
            'public', 'private', 'static', 'new', 'null', 'true', 'false',
            'this', 'extends', 'implements', 'interface',
            # JS
            'const', 'let', 'var', 'function', 'arrow', 'async', 'await',
            'undefined', 'typeof', 'instanceof',
            # Structure tokens — keep as-is
            'STR', 'NUM',
        }
        operators_and_punctuation = set('{}()[];=+-*/<>!&|')
        normalized = []
        for t in tokens:
            if t in keywords or t in operators_and_punctuation or t in ('STR', 'NUM'):
                normalized.append(t)
            else:
                normalized.append('ID')  # Normalize user-defined names to ID

        return normalized

    def _hash(self, text: str) -> int:
        return int(hashlib.md5(text.encode()).hexdigest()[:8], 16)


# ── AST Similarity ────────────────────────────────────────────────────────────

class ASTSimilarity:
    """
    AST-based similarity for Python code.
    Builds a canonical string from the AST node types (ignoring variable names
    and literal values). Two submissions that differ only in names/values show
    near-100% similarity.
    """

    def get_ast_signature(self, code: str) -> Optional[str]:
        """Returns a string of node types from the Python AST, ignoring names/values"""
        try:
            tree = ast.parse(code)
            parts = []
            for node in ast.walk(tree):
                type_name = type(node).__name__
                # Skip pure value nodes — we want structure
                if type_name in ('Load', 'Store', 'Del', 'Add', 'Sub', 'Mult', 'Div',
                                  'Mod', 'Pow', 'LShift', 'RShift', 'BitOr', 'BitXor',
                                  'BitAnd', 'FloorDiv', 'Invert', 'Not', 'UAdd', 'USub',
                                  'Eq', 'NotEq', 'Lt', 'LtE', 'Gt', 'GtE', 'Is', 'IsNot',
                                  'In', 'NotIn', 'And', 'Or'):
                    continue
                # Skip Name/Constant values — only keep type
                parts.append(type_name)
            return ' '.join(parts)
        except Exception:
            return None

    def similarity(self, code1: str, code2: str, language: str) -> float:
        if language != 'python':
            return self._structure_similarity_regex(code1, code2, language)

        sig1 = self.get_ast_signature(code1)
        sig2 = self.get_ast_signature(code2)

        if sig1 is None or sig2 is None:
            return self._structure_similarity_regex(code1, code2, language)

        # Token-level Jaccard on AST type sequences
        set1 = set(sig1.split())
        set2 = set(sig2.split())
        if not set1 and not set2:
            return 1.0
        if not set1 or not set2:
            return 0.0
        return len(set1 & set2) / len(set1 | set2)

    def _structure_similarity_regex(self, code1: str, code2: str, language: str) -> float:
        """Fallback: compare control structure counts"""
        patterns = [
            r'\bfor\b', r'\bwhile\b', r'\bif\b', r'\belse\b',
            r'\bswitch\b', r'\breturn\b', r'\bbreak\b', r'\bcontinue\b',
        ]
        vec1 = [len(re.findall(p, code1)) for p in patterns]
        vec2 = [len(re.findall(p, code2)) for p in patterns]
        total = sum(max(a, b) for a, b in zip(vec1, vec2))
        if total == 0:
            return 0.5
        agreement = sum(min(a, b) for a, b in zip(vec1, vec2))
        return agreement / total


# ── Main Service ──────────────────────────────────────────────────────────────

@dataclass
class SimilarityResult:
    submission1_id: str
    submission2_id: str
    user1_id: str
    user2_id: str
    overall_similarity: float
    winnowing_similarity: float
    ast_similarity: float
    is_suspicious: bool


class PlagiarismService:
    """
    Orchestrates plagiarism detection using Winnowing + AST.
    No ML models needed.
    """

    def __init__(self, threshold: float = 0.75):
        self.threshold = threshold
        self.winnowing = Winnowing(k=7, w=5)
        self.ast_sim   = ASTSimilarity()

    async def check_contest(self, contest_id: str, submissions: List[Dict]) -> Dict:
        """Check all pairs in a contest. O(n²) comparisons."""
        if len(submissions) < 2:
            return {
                "contest_id": contest_id,
                "total_submissions": len(submissions),
                "suspicious_pairs": [],
                "average_similarity": 0.0,
                "checked_at": datetime.utcnow().isoformat(),
            }

        # Pre-compute fingerprints
        processed = []
        for sub in submissions:
            fp = self.winnowing.fingerprint(sub.get("code", ""), sub.get("language", "python"))
            processed.append({**sub, "fingerprint": fp})

        suspicious_pairs = []
        all_similarities = []

        for i in range(len(processed)):
            for j in range(i + 1, len(processed)):
                result = self._compare(processed[i], processed[j])
                all_similarities.append(result.overall_similarity)
                if result.is_suspicious:
                    suspicious_pairs.append(result)

        return {
            "contest_id": contest_id,
            "total_submissions": len(submissions),
            "suspicious_pairs": [
                {
                    "submission1_id":    p.submission1_id,
                    "submission2_id":    p.submission2_id,
                    "user1_id":          p.user1_id,
                    "user2_id":          p.user2_id,
                    "similarity_score":  round(p.overall_similarity, 3),
                    "winnowing_similarity": round(p.winnowing_similarity, 3),
                    "ast_similarity":    round(p.ast_similarity, 3),
                    "is_suspicious":     p.is_suspicious,
                }
                for p in suspicious_pairs
            ],
            "average_similarity": round(
                sum(all_similarities) / len(all_similarities) if all_similarities else 0.0, 3
            ),
            "checked_at": datetime.utcnow().isoformat(),
        }

    async def compare_pair(self, sub1: Dict, sub2: Dict) -> Dict:
        """Compare exactly two submissions"""
        fp1 = self.winnowing.fingerprint(sub1.get("code", ""), sub1.get("language", "python"))
        fp2 = self.winnowing.fingerprint(sub2.get("code", ""), sub2.get("language", "python"))
        p1 = {**sub1, "fingerprint": fp1}
        p2 = {**sub2, "fingerprint": fp2}
        result = self._compare(p1, p2)
        return {
            "submission1_id":       result.submission1_id,
            "submission2_id":       result.submission2_id,
            "overall_similarity":   round(result.overall_similarity, 3),
            "winnowing_similarity": round(result.winnowing_similarity, 3),
            "ast_similarity":       round(result.ast_similarity, 3),
            "is_suspicious":        result.is_suspicious,
            "threshold":            self.threshold,
        }

    def _compare(self, s1: Dict, s2: Dict) -> SimilarityResult:
        lang1 = s1.get("language", "python")
        lang2 = s2.get("language", "python")

        # Winnowing similarity (language-agnostic)
        w_sim = self.winnowing.similarity(s1["fingerprint"], s2["fingerprint"])

        # AST similarity (Python exact, others regex-based)
        if lang1 == lang2:
            a_sim = self.ast_sim.similarity(s1.get("code", ""), s2.get("code", ""), lang1)
        else:
            a_sim = 0.0  # Different languages → can't be plagiarism

        # Weighted: Winnowing 60%, AST 40%
        overall = 0.6 * w_sim + 0.4 * a_sim

        return SimilarityResult(
            submission1_id=str(s1.get("id", s1.get("submission_id", ""))),
            submission2_id=str(s2.get("id", s2.get("submission_id", ""))),
            user1_id=str(s1.get("user_id", "")),
            user2_id=str(s2.get("user_id", "")),
            overall_similarity=overall,
            winnowing_similarity=w_sim,
            ast_similarity=a_sim,
            is_suspicious=overall >= self.threshold,
        )


plagiarism_service = PlagiarismService()