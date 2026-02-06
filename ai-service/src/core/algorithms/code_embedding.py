"""
Code embedding generation using CodeBERT and other models
"""
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class CodeEmbedding:
    """Generate vector embeddings for code using pre-trained models"""
    
    def __init__(self, model_name: str = "microsoft/codebert-base"):
        """
        Initialize code embedding generator
        
        Args:
            model_name: Hugging Face model name
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model and tokenizer"""
        try:
            logger.info(f"Loading model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def encode(self, code: str, language: str = "python") -> np.ndarray:
        """
        Generate embedding vector for code
        
        Args:
            code: Source code
            language: Programming language
            
        Returns:
            Embedding vector (numpy array)
        """
        try:
            # Tokenize code
            inputs = self.tokenizer(
                code,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embedding
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Use [CLS] token embedding (pooled output)
            embedding = outputs.last_hidden_state[:, 0, :].squeeze()
            
            # Convert to numpy
            return embedding.cpu().numpy()
            
        except Exception as e:
            logger.error(f"Encoding failed: {e}")
            # Return zero vector on failure
            return np.zeros(768)  # CodeBERT dimension
    
    def encode_batch(self, codes: List[str], language: str = "python") -> np.ndarray:
        """
        Generate embeddings for multiple code snippets
        
        Args:
            codes: List of source codes
            language: Programming language
            
        Returns:
            Array of embeddings (n_samples x embedding_dim)
        """
        try:
            # Tokenize all codes
            inputs = self.tokenizer(
                codes,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Use [CLS] token embeddings
            embeddings = outputs.last_hidden_state[:, 0, :]
            
            # Convert to numpy
            return embeddings.cpu().numpy()
            
        except Exception as e:
            logger.error(f"Batch encoding failed: {e}")
            return np.zeros((len(codes), 768))
    
    def cosine_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Normalize vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
        
        # Normalize to [0, 1]
        return (similarity + 1) / 2
    
    def find_similar_codes(
        self,
        query_code: str,
        code_database: List[Dict[str, str]],
        top_k: int = 5
    ) -> List[Tuple[Dict, float]]:
        """
        Find most similar codes from database
        
        Args:
            query_code: Query code snippet
            code_database: List of dicts with 'code' and metadata
            top_k: Number of results to return
            
        Returns:
            List of (code_dict, similarity_score) tuples
        """
        # Encode query
        query_embedding = self.encode(query_code)
        
        # Encode database codes
        db_codes = [item['code'] for item in code_database]
        db_embeddings = self.encode_batch(db_codes)
        
        # Calculate similarities
        similarities = []
        for i, db_embedding in enumerate(db_embeddings):
            similarity = self.cosine_similarity(query_embedding, db_embedding)
            similarities.append((code_database[i], similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def cluster_codes(
        self,
        codes: List[str],
        n_clusters: int = 5
    ) -> Dict[int, List[int]]:
        """
        Cluster similar codes together
        
        Args:
            codes: List of code snippets
            n_clusters: Number of clusters
            
        Returns:
            Dict mapping cluster_id to list of code indices
        """
        from sklearn.cluster import KMeans
        
        # Generate embeddings
        embeddings = self.encode_batch(codes)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        labels = kmeans.fit_predict(embeddings)
        
        # Group codes by cluster
        clusters = {}
        for idx, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(idx)
        
        return clusters


# Global instance (lazy-loaded)
_embedding_model = None


def get_embedding_model() -> CodeEmbedding:
    """Get global code embedding model instance"""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = CodeEmbedding()
    return _embedding_model