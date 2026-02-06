# Processed Data

Preprocessed data ready for model training.

## Files

- **features.json**: Extracted features
- **embeddings.npy**: Code embeddings (if using CodeBERT)
- **train.json**: Training dataset
- **val.json**: Validation dataset
- **test.json**: Test dataset

## Feature Schema
```json
{
  "submission_id": "sub_001",
  "features": {
    "structural": {...},
    "algorithmic": {...},
    "quality": {...}
  },
  "labels": {
    "quality_score": 0.8,
    "time_complexity": "O(n)"
  }
}
```