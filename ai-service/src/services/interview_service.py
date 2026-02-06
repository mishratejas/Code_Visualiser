from typing import Dict, List, Optional
import asyncio
from dataclasses import dataclass
import random
from datetime import datetime

@dataclass
class EvaluationResult:
    code_quality: float
    correctness: float
    efficiency: float
    explanation_quality: float
    overall_score: float
    feedback: str
    suggestions: List[str]

class InterviewService:
    """Service for conducting AI-powered DSA interviews"""
    
    def __init__(self):
        self.question_bank = self._load_question_bank()
    
    async def evaluate_solution(self, code: str, question: Dict, 
                               explanation: str = "") -> Dict:
        """Evaluate a solution to an interview question"""
        
        # 1. Code quality analysis
        quality_score = self._analyze_code_quality(code, question.get("language", "python"))
        
        # 2. Correctness check (simplified - in practice would run tests)
        correctness_score = self._estimate_correctness(code, question)
        
        # 3. Efficiency analysis
        efficiency_score = self._analyze_efficiency(code, question)
        
        # 4. Explanation quality
        explanation_score = self._evaluate_explanation(explanation, question)
        
        # 5. Overall score
        overall = (quality_score * 0.2 + 
                  correctness_score * 0.4 + 
                  efficiency_score * 0.3 + 
                  explanation_score * 0.1)
        
        # Generate feedback
        feedback = self._generate_feedback(
            quality_score, correctness_score, 
            efficiency_score, explanation_score
        )
        
        return {
            "code_quality": quality_score,
            "correctness": correctness_score,
            "efficiency": efficiency_score,
            "explanation_quality": explanation_score,
            "overall_score": overall,
            "feedback": feedback,
            "suggestions": self._generate_suggestions(quality_score, efficiency_score)
        }
    
    async def check_explanation(self, code: str, explanation: str, 
                               question_id: str) -> Dict:
        """Check if explanation covers all required aspects"""
        
        required_elements = [
            "time_complexity",
            "space_complexity",
            "approach_description",
            "edge_cases"
        ]
        
        missing = []
        explanation_lower = explanation.lower()
        
        # Check for each required element
        if "time" not in explanation_lower and "complexity" not in explanation_lower:
            missing.append("time_complexity")
        
        if "space" not in explanation_lower and "memory" not in explanation_lower:
            missing.append("space_complexity")
        
        if not any(word in explanation_lower for word in ["approach", "algorithm", "method"]):
            missing.append("approach_description")
        
        if "edge" not in explanation_lower and "corner" not in explanation_lower:
            missing.append("edge_cases")
        
        # Calculate score
        score = 1.0 - (len(missing) * 0.25)
        
        return {
            "is_correct": len(missing) == 0,
            "missing_elements": missing,
            "feedback": self._generate_explanation_feedback(missing),
            "score": score
        }
    
    def generate_follow_up_question(self, question: Dict, 
                                   evaluation: Dict) -> Optional[Dict]:
        """Generate a follow-up question based on performance"""
        
        if evaluation["overall_score"] < 0.7:
            # Generate easier follow-up
            return self._get_easier_question(question)
        elif evaluation["efficiency"] < 0.8:
            # Ask about optimization
            return {
                "type": "optimization",
                "question": f"How would you optimize your solution to improve time/space complexity?",
                "hint": "Consider alternative data structures or algorithms"
            }
        elif evaluation["explanation_quality"] < 0.7:
            # Ask for better explanation
            return {
                "type": "explanation",
                "question": f"Can you explain the time and space complexity of your solution in more detail?",
                "hint": "Break down the complexity analysis step by step"
            }
        
        return None
    
    def provide_hint(self, question: Dict, current_approach: str = "") -> str:
        """Provide a hint based on the question and current approach"""
        
        hints = {
            "two-sum": [
                "Think about using a hash map to store seen numbers",
                "What if you store numbers and their indices?",
                "Can you find the complement of each number?"
            ],
            "binary-search": [
                "Remember binary search works on sorted arrays",
                "Think about the midpoint calculation",
                "How do you adjust left and right pointers?"
            ],
            "linked-list": [
                "Consider using two pointers",
                "What about a slow and fast pointer approach?",
                "Can you reverse the list in-place?"
            ]
        }
        
        # Get question title
        title = question.get("title", "").lower().replace(" ", "-")
        
        if title in hints:
            return random.choice(hints[title])
        else:
            return "Try breaking the problem into smaller parts"
    
    async def generate_report(self, interview_session: Dict) -> Dict:
        """Generate comprehensive interview report"""
        
        answers = interview_session.get("answers", [])
        
        if not answers:
            return {
                "status": "incomplete",
                "message": "No solutions submitted"
            }
        
        # Calculate average scores
        scores = [ans.get("evaluation", {}).get("overall_score", 0) 
                 for ans in answers]
        
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Determine rating
        if avg_score >= 0.8:
            rating = "Excellent"
        elif avg_score >= 0.6:
            rating = "Good"
        elif avg_score >= 0.4:
            rating = "Fair"
        else:
            rating = "Needs Improvement"
        
        # Generate feedback
        strengths, weaknesses = self._identify_strengths_weaknesses(answers)
        
        return {
            "interview_id": interview_session.get("id", ""),
            "user_id": interview_session.get("user_id", ""),
            "average_score": avg_score,
            "rating": rating,
            "total_questions": len(answers),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": self._generate_recommendations(strengths, weaknesses),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _analyze_code_quality(self, code: str, language: str) -> float:
        """Analyze code quality"""
        # Simplified analysis
        score = 0.7  # Base score
        
        # Check for good practices
        if len(code.split('\n')) < 50:
            score += 0.1
        
        if "TODO" not in code and "FIXME" not in code:
            score += 0.1
        
        # Check for bad practices
        if "import *" in code:
            score -= 0.1
        
        if code.count("\t") > 10:  # Too many tabs
            score -= 0.05
        
        return max(0.0, min(1.0, score))
    
    def _estimate_correctness(self, code: str, question: Dict) -> float:
        """Estimate correctness (simplified)"""
        # In practice, you'd run test cases
        # For now, use pattern matching
        
        keywords = question.get("keywords", [])
        score = 0.5  # Base score
        
        for keyword in keywords:
            if keyword.lower() in code.lower():
                score += 0.1
        
        return min(1.0, score)
    
    def _analyze_efficiency(self, code: str, question: Dict) -> float:
        """Analyze code efficiency"""
        expected_complexity = question.get("expected_complexity", "O(n)")
        
        # Simple pattern matching for complexity
        if "O(1)" in code or "constant" in code:
            detected = "O(1)"
        elif "O(log n)" in code or "logarithmic" in code:
            detected = "O(log n)"
        elif "O(n)" in code or "linear" in code:
            detected = "O(n)"
        elif "O(n²)" in code or "quadratic" in code:
            detected = "O(n²)"
        else:
            detected = "O(n)"  # Default
        
        # Score based on match with expected
        complexity_scores = {
            "O(1)": 1.0,
            "O(log n)": 0.9,
            "O(n)": 0.8,
            "O(n log n)": 0.7,
            "O(n²)": 0.5,
            "O(n³)": 0.3,
            "O(2^n)": 0.1
        }
        
        score = complexity_scores.get(detected, 0.5)
        
        # Check for inefficient patterns
        if "for" in code and code.count("for") > 2:
            score *= 0.8  # Penalize multiple nested loops
        
        return score
    
    def _evaluate_explanation(self, explanation: str, question: Dict) -> float:
        """Evaluate explanation quality"""
        if not explanation:
            return 0.0
        
        score = 0.5  # Base score
        
        # Length check
        words = explanation.split()
        if 50 <= len(words) <= 200:
            score += 0.2
        elif len(words) > 200:
            score += 0.1
        
        # Check for key elements
        key_elements = ["time", "space", "complexity", "algorithm", "approach"]
        found = sum(1 for elem in key_elements if elem in explanation.lower())
        
        score += (found / len(key_elements)) * 0.3
        
        return min(1.0, score)
    
    def _generate_feedback(self, quality: float, correctness: float, 
                          efficiency: float, explanation: float) -> str:
        """Generate feedback based on scores"""
        
        feedback_parts = []
        
        if quality >= 0.8:
            feedback_parts.append("Great code quality with clean structure.")
        elif quality >= 0.6:
            feedback_parts.append("Good code quality, could be more readable.")
        else:
            feedback_parts.append("Consider improving code readability and structure.")
        
        if correctness >= 0.8:
            feedback_parts.append("Solution appears to be correct.")
        elif correctness >= 0.6:
            feedback_parts.append("Solution is mostly correct, check edge cases.")
        else:
            feedback_parts.append("Solution may have logical errors.")
        
        if efficiency >= 0.8:
            feedback_parts.append("Efficient algorithm chosen.")
        elif efficiency >= 0.6:
            feedback_parts.append("Moderately efficient, consider optimization.")
        else:
            feedback_parts.append("Algorithm could be more efficient.")
        
        if explanation >= 0.7:
            feedback_parts.append("Good explanation of your approach.")
        elif explanation > 0.3:
            feedback_parts.append("Explanation could be more detailed.")
        else:
            feedback_parts.append("Please provide a more detailed explanation.")
        
        return " ".join(feedback_parts)
    
    def _generate_suggestions(self, quality: float, efficiency: float) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []
        
        if quality < 0.7:
            suggestions.append("Add more comments to explain complex logic.")
            suggestions.append("Use more descriptive variable names.")
        
        if efficiency < 0.7:
            suggestions.append("Consider time and space complexity of your approach.")
            suggestions.append("Look for opportunities to reduce nested loops.")
        
        return suggestions
    
    def _generate_explanation_feedback(self, missing: List[str]) -> str:
        """Generate feedback for missing explanation elements"""
        
        if not missing:
            return "Great explanation! Covers all important aspects."
        
        feedback = "Your explanation is missing: "
        
        element_names = {
            "time_complexity": "time complexity analysis",
            "space_complexity": "space complexity analysis",
            "approach_description": "description of your approach",
            "edge_cases": "discussion of edge cases"
        }
        
        missing_names = [element_names.get(m, m) for m in missing]
        
        return feedback + ", ".join(missing_names) + "."
    
    def _get_easier_question(self, question: Dict) -> Dict:
        """Get an easier version of the question"""
        # Simplified - in practice would query question bank
        easier_versions = {
            "two-sum": {
                "title": "Two Sum (Sorted Array)",
                "description": "Given a sorted array of integers, find two numbers that add up to a target.",
                "difficulty": "easy"
            },
            "binary-search": {
                "title": "Binary Search Basic",
                "description": "Implement binary search to find a target in a sorted array.",
                "difficulty": "easy"
            }
        }
        
        title = question.get("title", "")
        
        return easier_versions.get(title.lower().replace(" ", "-"), question)
    
    def _identify_strengths_weaknesses(self, answers: List[Dict]) -> tuple:
        """Identify strengths and weaknesses from answers"""
        
        if not answers:
            return [], []
        
        # Calculate average scores by category
        categories = ["code_quality", "correctness", "efficiency", "explanation_quality"]
        scores = {cat: [] for cat in categories}
        
        for ans in answers:
            eval_data = ans.get("evaluation", {})
            for cat in categories:
                if cat in eval_data:
                    scores[cat].append(eval_data[cat])
        
        # Find strengths (categories with highest average)
        avg_scores = {cat: sum(scores[cat])/len(scores[cat]) 
                     for cat in categories if scores[cat]}
        
        strengths = []
        weaknesses = []
        
        for cat, avg in avg_scores.items():
            if avg >= 0.7:
                strengths.append(cat.replace("_", " ").title())
            elif avg <= 0.5:
                weaknesses.append(cat.replace("_", " ").title())
        
        return strengths[:2], weaknesses[:2]
    
    def _generate_recommendations(self, strengths: List[str], 
                                 weaknesses: List[str]) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if "Code Quality" in weaknesses:
            recommendations.append("Practice writing cleaner, more readable code.")
        
        if "Efficiency" in weaknesses:
            recommendations.append("Study algorithm optimization techniques.")
            recommendations.append("Practice analyzing time and space complexity.")
        
        if "Explanation Quality" in weaknesses:
            recommendations.append("Practice explaining your solutions out loud.")
            recommendations.append("Focus on clearly describing your approach.")
        
        if "Code Quality" in strengths and "Efficiency" in strengths:
            recommendations.append("Great job! Consider tackling more advanced problems.")
        
        return recommendations
    
    def _load_question_bank(self) -> Dict:
        """Load question bank"""
        # Simplified - in practice would load from database
        return {
            "two-sum": {
                "id": "two-sum",
                "title": "Two Sum",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "difficulty": "easy",
                "topics": ["array", "hash-table"],
                "keywords": ["hash map", "complement", "indices"],
                "expected_complexity": "O(n)"
            },
            "binary-search": {
                "id": "binary-search",
                "title": "Binary Search",
                "description": "Given a sorted array of integers and a target value, return the index if target is found. If not, return -1.",
                "difficulty": "easy",
                "topics": ["array", "binary-search"],
                "keywords": ["midpoint", "sorted", "logarithmic"],
                "expected_complexity": "O(log n)"
            }
        }