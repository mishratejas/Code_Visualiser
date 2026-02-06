import random
from typing import List, Dict

class QuestionBank:
    """Bank of DSA questions for interviews"""
    
    def __init__(self):
        self.questions = self._initialize_questions()
    
    def get_question(self, difficulty: str = "medium", topics: List[str] = None) -> Dict:
        """Get a random question based on difficulty and topics"""
        filtered = [
            q for q in self.questions
            if q["difficulty"] == difficulty
            and (not topics or any(topic in q["topics"] for topic in topics))
        ]
        
        if not filtered:
            # Fallback to any question with given difficulty
            filtered = [q for q in self.questions if q["difficulty"] == difficulty]
        
        if not filtered:
            # Fallback to any medium question
            filtered = [q for q in self.questions if q["difficulty"] == "medium"]
        
        if not filtered:
            # Last resort
            filtered = [self.questions[0]]
        
        return random.choice(filtered)
    
    def _initialize_questions(self) -> List[Dict]:
        """Initialize question database"""
        return [
            {
                "id": "two-sum",
                "title": "Two Sum",
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "difficulty": "easy",
                "topics": ["array", "hash-table"],
                "constraints": {
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)"
                },
                "examples": [
                    {
                        "input": "nums = [2,7,11,15], target = 9",
                        "output": "[0,1]",
                        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                    }
                ],
                "follow_up_questions": [
                    "What if the array is sorted?",
                    "What if you need to return the numbers instead of indices?",
                    "What if there are multiple solutions?"
                ]
            },
            {
                "id": "reverse-linked-list",
                "title": "Reverse Linked List",
                "description": "Given the head of a singly linked list, reverse the list and return the new head.",
                "difficulty": "easy",
                "topics": ["linked-list"],
                "constraints": {
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)"
                },
                "examples": [
                    {
                        "input": "head = [1,2,3,4,5]",
                        "output": "[5,4,3,2,1]",
                        "explanation": "The list is reversed."
                    }
                ],
                "follow_up_questions": [
                    "Can you do it recursively?",
                    "What about reversing only a portion of the list?",
                    "How would you handle a doubly linked list?"
                ]
            },
            {
                "id": "valid-parentheses",
                "title": "Valid Parentheses",
                "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "difficulty": "easy",
                "topics": ["string", "stack"],
                "constraints": {
                    "time_complexity": "O(n)",
                    "space_complexity": "O(n)"
                },
                "examples": [
                    {
                        "input": "s = \"()\"",
                        "output": "true",
                        "explanation": "The parentheses are properly closed."
                    }
                ],
                "follow_up_questions": [
                    "What if we add more bracket types?",
                    "Can you solve it with constant space?",
                    "How would you find the longest valid substring?"
                ]
            },
            {
                "id": "merge-two-sorted-lists",
                "title": "Merge Two Sorted Lists",
                "description": "Merge two sorted linked lists and return it as a sorted list.",
                "difficulty": "easy",
                "topics": ["linked-list", "sorting"],
                "constraints": {
                    "time_complexity": "O(n+m)",
                    "space_complexity": "O(1)"
                },
                "examples": [
                    {
                        "input": "l1 = [1,2,4], l2 = [1,3,4]",
                        "output": "[1,1,2,3,4,4]",
                        "explanation": "The lists are merged in sorted order."
                    }
                ],
                "follow_up_questions": [
                    "What about merging k sorted lists?",
                    "Can you do it recursively?",
                    "What if the lists are very large?"
                ]
            },
            {
                "id": "binary-search",
                "title": "Binary Search",
                "description": "Given a sorted array of integers and a target value, return the index if target is found. If not, return -1.",
                "difficulty": "easy",
                "topics": ["array", "binary-search"],
                "constraints": {
                    "time_complexity": "O(log n)",
                    "space_complexity": "O(1)"
                },
                "examples": [
                    {
                        "input": "nums = [-1,0,3,5,9,12], target = 9",
                        "output": "4",
                        "explanation": "9 exists in nums and its index is 4."
                    }
                ],
                "follow_up_questions": [
                    "What if the array has duplicates?",
                    "What about searching in a rotated sorted array?",
                    "How would you implement lower_bound and upper_bound?"
                ]
            },
            {
                "id": "maximum-subarray",
                "title": "Maximum Subarray",
                "description": "Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
                "difficulty": "medium",
                "topics": ["array", "dynamic-programming"],
                "constraints": {
                    "time_complexity": "O(n)",
                    "space_complexity": "O(1)"
                },
                "examples": [
                    {
                        "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
                        "output": "6",
                        "explanation": "[4,-1,2,1] has the largest sum = 6."
                    }
                ],
                "follow_up_questions": [
                    "Can you also return the subarray itself?",
                    "What about maximum product subarray?",
                    "How would you solve it in O(n log n) using divide and conquer?"
                ]
            },
            {
                "id": "valid-sudoku",
                "title": "Valid Sudoku",
                "description": "Determine if a 9x9 Sudoku board is valid.",
                "difficulty": "medium",
                "topics": ["array", "hash-table"],
                "constraints": {
                    "time_complexity": "O(1)",
                    "space_complexity": "O(1)"
                },
                "examples": [
                    {
                        "input": "board = [[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"]...]",
                        "output": "true",
                        "explanation": "The board follows Sudoku rules."
                    }
                ],
                "follow_up_questions": [
                    "How would you solve the Sudoku puzzle?",
                    "What about validating NxN Sudoku?",
                    "Can you count all valid Sudoku boards?"
                ]
            }
        ]