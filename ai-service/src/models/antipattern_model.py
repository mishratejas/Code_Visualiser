from typing import List, Dict
import re

class AntiPatternModel:
    """Model for detecting anti-patterns in code"""
    
    def __init__(self):
        self.patterns = self._initialize_patterns()
    
    def predict(self, features: dict, code: str) -> dict:
        """Detect anti-patterns in code"""
        detected = []
        
        for pattern in self.patterns:
            if self._check_pattern(pattern, code, features):
                detected.append({
                    "type": pattern["name"],
                    "description": pattern["description"],
                    "severity": pattern["severity"],
                    "confidence": 0.8
                })
        
        return {
            "patterns": detected,
            "count": len(detected)
        }
    
    def _check_pattern(self, pattern: dict, code: str, features: dict) -> bool:
        """Check if a pattern exists in code"""
        # Check regex patterns
        for regex in pattern.get("regex_patterns", []):
            if re.search(regex, code, re.IGNORECASE):
                return True
        
        # Check feature conditions
        conditions = pattern.get("conditions", [])
        for condition in conditions:
            feature_name = condition["feature"]
            operator = condition["operator"]
            value = condition["value"]
            actual_value = features.get(feature_name, 0)
            
            if operator == ">" and actual_value > value:
                return True
            elif operator == "<" and actual_value < value:
                return True
            elif operator == ">=" and actual_value >= value:
                return True
            elif operator == "<=" and actual_value <= value:
                return True
            elif operator == "==" and actual_value == value:
                return True
        
        return False
    
    def _initialize_patterns(self) -> List[Dict]:
        """Initialize anti-pattern database"""
        return [
            {
                "name": "brute_force",
                "description": "Inefficient nested loops for problem that could be solved more efficiently",
                "severity": "medium",
                "regex_patterns": [
                    r"for.*for.*for",
                    r"while.*while.*while"
                ],
                "conditions": [
                    {"feature": "loop_count", "operator": ">", "value": 2}
                ]
            },
            {
                "name": "unnecessary_sorting",
                "description": "Sorting when not required for solution",
                "severity": "low",
                "regex_patterns": [
                    r"\.sort\(",
                    r"sorted\(",
                    r"Collections\.sort",
                    r"Arrays\.sort"
                ]
            },
            {
                "name": "magic_numbers",
                "description": "Using hard-coded numbers instead of named constants",
                "severity": "low",
                "regex_patterns": [
                    r"if.*[0-9]{2,}",
                    r"return.*[0-9]{2,}",
                    r"=[\s]*[0-9]{2,}"
                ]
            },
            {
                "name": "deep_nesting",
                "description": "Excessively nested control structures",
                "severity": "medium",
                "conditions": [
                    {"feature": "max_nesting_depth", "operator": ">", "value": 3}
                ]
            },
            {
                "name": "repeated_computation",
                "description": "Computing same value multiple times",
                "severity": "medium",
                "regex_patterns": [
                    r"len\(.*\).*len\(.*\)",
                    r"\.length.*\.length"
                ]
            }
        ]