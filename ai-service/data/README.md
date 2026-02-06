# Data Directory

This directory contains datasets for training and evaluating ML models.

## Structure

- **raw/**: Raw, unprocessed data
  - Original code submissions
  - Problem statements
  - Test cases
  
- **processed/**: Preprocessed and cleaned data
  - Extracted features
  - Normalized submissions
  - Ready for model training
  
- **labeled/**: Manually labeled data
  - Quality scores
  - Complexity labels
  - Anti-pattern annotations

## Data Format

### Raw Submissions
```json
{
  "submission_id": "sub_123",
  "user_id": "user_456",
  "problem_id": "prob_789",
  "code": "...",
  "language": "python",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Processed Features
```json
{
  "submission_id": "sub_123",
  "features": {
    "lines_of_code": 45,
    "cyclomatic_complexity": 8,
    "comment_density": 0.15,
    ...
  }
}
```

### Labeled Data
```json
{
  "submission_id": "sub_123",
  "labels": {
    "quality_score": 0.85,
    "quality_label": "good",
    "time_complexity": "O(n log n)",
    "has_anti_patterns": false
  }
}
```

## Data Collection

Run the data collection script:
```bash
python -m src.scripts.collect_data
```

## Privacy

⚠️ **Important**: Ensure all data is anonymized and follows privacy regulations.
- Remove identifying information
- Hash user IDs
- Do not store sensitive data