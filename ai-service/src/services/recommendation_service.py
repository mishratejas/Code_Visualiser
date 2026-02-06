"""
Problem recommendation service using ML
"""
from typing import List, Dict, Any
import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class RecommendationService:
    """Generate personalized problem recommendations"""
    
    def __init__(self):
        self.user_profiles = {}  # Cache user profiles
    
    async def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        difficulty: str = None,
        topics: List[str] = None,
        include_solved: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get personalized problem recommendations
        
        Args:
            user_id: User ID
            limit: Number of recommendations
            difficulty: Filter by difficulty
            topics: Filter by topics
            include_solved: Include already solved problems
            
        Returns:
            List of recommended problems
        """
        try:
            # Get user profile
            profile = await self._get_user_profile(user_id)
            
            # Get candidate problems
            candidates = await self._get_candidate_problems(
                profile,
                difficulty,
                topics,
                include_solved
            )
            
            # Score and rank problems
            scored = self._score_problems(profile, candidates)
            
            # Return top N
            return scored[:limit]
            
        except Exception as e:
            logger.error(f"Recommendation failed: {e}")
            return []
    
    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get or build user profile"""
        if user_id in self.user_profiles:
            return self.user_profiles[user_id]
        
        # Build profile from submission history
        profile = {
            'user_id': user_id,
            'solved_problems': [],
            'attempted_problems': [],
            'strong_topics': [],
            'weak_topics': [],
            'preferred_difficulty': 'medium',
            'avg_solve_time': 0,
            'success_rate': 0.0,
        }
        
        # TODO: Fetch from database and analyze
        # For now, return empty profile
        self.user_profiles[user_id] = profile
        return profile
    
    async def _get_candidate_problems(
        self,
        profile: Dict,
        difficulty: str,
        topics: List[str],
        include_solved: bool
    ) -> List[Dict[str, Any]]:
        """Get candidate problems for recommendation"""
        # TODO: Fetch from database
        # For now, return dummy problems
        return [
            {
                'problem_id': f'problem_{i}',
                'title': f'Problem {i}',
                'difficulty': difficulty or 'medium',
                'topics': topics or ['array', 'hash-table'],
                'acceptance_rate': 0.5,
                'likes': 100,
            }
            for i in range(50)
        ]
    
    def _score_problems(
        self,
        profile: Dict,
        candidates: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Score and rank problems"""
        scored_problems = []
        
        for problem in candidates:
            # Skip already solved unless included
            if problem['problem_id'] in profile['solved_problems']:
                continue
            
            score = self._calculate_score(profile, problem)
            
            scored_problems.append({
                **problem,
                'recommendation_score': score,
                'reasons': self._get_recommendation_reasons(profile, problem)
            })
        
        # Sort by score
        scored_problems.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return scored_problems
    
    def _calculate_score(self, profile: Dict, problem: Dict) -> float:
        """Calculate recommendation score for a problem"""
        score = 0.0
        
        # Difficulty match (0-0.3)
        difficulty_score = self._difficulty_match_score(
            profile.get('preferred_difficulty', 'medium'),
            problem['difficulty']
        )
        score += difficulty_score * 0.3
        
        # Topic relevance (0-0.3)
        topic_score = self._topic_relevance_score(
            profile.get('strong_topics', []),
            profile.get('weak_topics', []),
            problem['topics']
        )
        score += topic_score * 0.3
        
        # Popularity (0-0.2)
        popularity_score = min(problem.get('likes', 0) / 1000, 1.0)
        score += popularity_score * 0.2
        
        # Acceptance rate (0-0.2)
        acceptance_score = problem.get('acceptance_rate', 0.5)
        score += acceptance_score * 0.2
        
        return score
    
    def _difficulty_match_score(self, user_level: str, problem_difficulty: str) -> float:
        """Score based on difficulty match"""
        difficulty_map = {'easy': 0, 'medium': 1, 'hard': 2}
        
        user_idx = difficulty_map.get(user_level, 1)
        problem_idx = difficulty_map.get(problem_difficulty, 1)
        
        # Perfect match = 1.0, one level off = 0.5, two levels off = 0.0
        diff = abs(user_idx - problem_idx)
        
        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.5
        else:
            return 0.0
    
    def _topic_relevance_score(
        self,
        strong_topics: List[str],
        weak_topics: List[str],
        problem_topics: List[str]
    ) -> float:
        """Score based on topic relevance"""
        if not problem_topics:
            return 0.5
        
        # Prefer problems in weak topics (for learning)
        weak_overlap = len(set(weak_topics) & set(problem_topics))
        strong_overlap = len(set(strong_topics) & set(problem_topics))
        
        if weak_overlap > 0:
            return 0.8  # High score for weak topics
        elif strong_overlap > 0:
            return 0.6  # Medium score for strong topics
        else:
            return 0.4  # Lower score for new topics
    
    def _get_recommendation_reasons(
        self,
        profile: Dict,
        problem: Dict
    ) -> List[str]:
        """Generate human-readable recommendation reasons"""
        reasons = []
        
        # Difficulty reason
        if problem['difficulty'] == profile.get('preferred_difficulty'):
            reasons.append(f"Matches your skill level ({problem['difficulty']})")
        
        # Topic reasons
        weak_topics = set(profile.get('weak_topics', [])) & set(problem['topics'])
        if weak_topics:
            reasons.append(f"Helps improve in: {', '.join(weak_topics)}")
        
        # Popularity reason
        if problem.get('likes', 0) > 500:
            reasons.append("Highly rated by the community")
        
        # Acceptance rate reason
        if problem.get('acceptance_rate', 0) > 0.6:
            reasons.append("Good success rate for learners")
        
        return reasons or ["Recommended based on your profile"]
    
    async def analyze_skill_gap(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's skill gaps"""
        # TODO: Implement actual skill gap analysis
        return {
            'weak_topics': ['dynamic-programming', 'graph'],
            'strong_topics': ['array', 'string'],
            'needs_improvement': ['time-complexity-analysis']
        }
    
    def get_recommended_topics(self, skill_gap: Dict) -> List[str]:
        """Get recommended topics based on skill gap"""
        return skill_gap.get('weak_topics', [])
    
    async def generate_learning_path(self, user_id: str, topic: str = None) -> Dict:
        """Generate personalized learning path"""
        # TODO: Implement learning path generation
        return {
            'user_id': user_id,
            'topic': topic,
            'path': [
                {'step': 1, 'title': 'Learn basics'},
                {'step': 2, 'title': 'Practice easy problems'},
                {'step': 3, 'title': 'Practice medium problems'}
            ]
        }
    
    async def find_similar_problems(self, problem_id: str, limit: int = 5) -> List[Dict]:
        """Find problems similar to given problem"""
        # TODO: Implement similarity search using embeddings
        return [
            {
                'problem_id': f'similar_{i}',
                'title': f'Similar Problem {i}',
                'similarity': 0.9 - (i * 0.1)
            }
            for i in range(limit)
        ]


# Global instance
_recommendation_service = RecommendationService()


async def get_recommendations(user_id: str, limit: int = 10) -> List[Dict]:
    """Get problem recommendations"""
    return await _recommendation_service.get_recommendations(user_id, limit)