"""
Winnowing algorithm for document fingerprinting
Used for plagiarism detection
"""
import hashlib
from typing import List, Set, Tuple
from collections import deque


class Winnowing:
    """
    Winnowing algorithm for detecting similar code
    Based on: "Winnowing: Local Algorithms for Document Fingerprinting" (Schleimer et al.)
    """
    
    def __init__(self, k: int = 5, w: int = 4):
        """
        Initialize winnowing algorithm
        
        Args:
            k: k-gram size (default 5)
            w: Window size (default 4)
        """
        self.k = k  # k-gram size
        self.w = w  # Window size
        self.guarantee_threshold = w + k - 1
    
    def fingerprint(self, text: str) -> Set[Tuple[int, int]]:
        """
        Generate fingerprint for text
        
        Args:
            text: Input text (code)
            
        Returns:
            Set of (hash, position) tuples
        """
        # Normalize text
        text = self._normalize(text)
        
        # Generate k-grams
        kgrams = self._generate_kgrams(text)
        
        if not kgrams:
            return set()
        
        # Hash k-grams
        hashes = [(self._hash(kg), pos) for kg, pos in kgrams]
        
        # Apply winnowing
        return self._winnow(hashes)
    
    def _normalize(self, text: str) -> str:
        """
        Normalize text by removing whitespace and comments
        
        Args:
            text: Input text
            
        Returns:
            Normalized text
        """
        # Remove single-line comments
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove // comments
            if '//' in line:
                line = line[:line.index('//')]
            # Remove # comments
            if '#' in line:
                line = line[:line.index('#')]
            
            # Remove extra whitespace
            line = ' '.join(line.split())
            
            if line:
                cleaned_lines.append(line)
        
        # Join and lowercase
        text = ' '.join(cleaned_lines)
        text = text.lower()
        
        # Remove all whitespace for fingerprinting
        text = ''.join(text.split())
        
        return text
    
    def _generate_kgrams(self, text: str) -> List[Tuple[str, int]]:
        """
        Generate k-grams from text
        
        Args:
            text: Normalized text
            
        Returns:
            List of (k-gram, position) tuples
        """
        if len(text) < self.k:
            return []
        
        kgrams = []
        for i in range(len(text) - self.k + 1):
            kgram = text[i:i + self.k]
            kgrams.append((kgram, i))
        
        return kgrams
    
    def _hash(self, kgram: str) -> int:
        """
        Hash a k-gram
        
        Args:
            kgram: k-gram string
            
        Returns:
            Hash value
        """
        # Use MD5 hash and convert to integer
        hash_obj = hashlib.md5(kgram.encode())
        return int(hash_obj.hexdigest()[:8], 16)
    
    def _winnow(self, hashes: List[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        """
        Apply winnowing algorithm to select fingerprints
        
        Args:
            hashes: List of (hash, position) tuples
            
        Returns:
            Set of selected (hash, position) tuples
        """
        if len(hashes) < self.w:
            # If fewer hashes than window size, return all
            return set(hashes)
        
        fingerprints = set()
        window = deque(maxlen=self.w)
        min_hash = None
        
        for i, (hash_val, pos) in enumerate(hashes):
            window.append((hash_val, pos))
            
            if len(window) == self.w:
                # Find minimum in window
                min_in_window = min(window, key=lambda x: (x[0], x[1]))
                
                # If minimum changed or first window, add to fingerprints
                if min_hash != min_in_window:
                    fingerprints.add(min_in_window)
                    min_hash = min_in_window
        
        return fingerprints
    
    def similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        fp1 = self.fingerprint(text1)
        fp2 = self.fingerprint(text2)
        
        if not fp1 and not fp2:
            return 1.0
        if not fp1 or not fp2:
            return 0.0
        
        # Calculate Jaccard similarity of fingerprints
        intersection = len(fp1 & fp2)
        union = len(fp1 | fp2)
        
        return intersection / union if union > 0 else 0.0
    
    def get_common_segments(
        self,
        text1: str,
        text2: str
    ) -> List[Tuple[int, int, int]]:
        """
        Get common segments between two texts
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            List of (pos1, pos2, length) tuples
        """
        fp1 = self.fingerprint(text1)
        fp2 = self.fingerprint(text2)
        
        # Find matching hashes
        common_hashes = {h for h, _ in fp1} & {h for h, _ in fp2}
        
        segments = []
        for hash_val in common_hashes:
            # Find positions in both texts
            pos1 = [pos for h, pos in fp1 if h == hash_val]
            pos2 = [pos for h, pos in fp2 if h == hash_val]
            
            # Create segments
            for p1 in pos1:
                for p2 in pos2:
                    # Segment length is guaranteed threshold
                    segments.append((p1, p2, self.guarantee_threshold))
        
        return segments
    
    def is_plagiarism(self, text1: str, text2: str, threshold: float = 0.5) -> bool:
        """
        Determine if two texts are likely plagiarized
        
        Args:
            text1: First text
            text2: Second text
            threshold: Similarity threshold for plagiarism
            
        Returns:
            True if similarity >= threshold
        """
        return self.similarity(text1, text2) >= threshold