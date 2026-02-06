# Labeled Data

Manually labeled data for supervised learning.

## Labeling Guidelines

### Quality Labels
- **excellent**: 0.8-1.0 - Clean, well-documented, efficient code
- **good**: 0.6-0.8 - Good code with minor improvements needed
- **fair**: 0.4-0.6 - Acceptable but needs significant improvement
- **poor**: 0.0-0.4 - Low quality, many issues

### Complexity Labels
- O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n)

### Anti-Pattern Labels
- brute_force
- unnecessary_sorting
- magic_numbers
- deep_nesting
- repeated_computation

## Format
```json
{
  "submission_id": "sub_001",
  "quality_label": "good",
  "quality_score": 0.75,
  "time_complexity": "O(n)",
  "space_complexity": "O(1)",
  "anti_patterns": ["magic_numbers"],
  "labeled_by": "expert_001",
  "labeled_at": "2024-01-15T10:00:00Z"
}
```