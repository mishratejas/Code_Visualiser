# AI Code Analysis Service

AI-powered code analysis service for CodeForge platform. Provides code quality assessment, complexity estimation, plagiarism detection, and AI-driven interviews.

## Features

✅ **Code Quality Analysis**
- Multi-language support (Python, Java, C++, JavaScript)
- Quality scoring and labeling
- Anti-pattern detection
- Improvement suggestions

✅ **Complexity Estimation**
- Time complexity prediction
- Space complexity analysis
- Performance bottleneck identification

✅ **Plagiarism Detection**
- Token-based similarity (Winnowing algorithm)
- AST-based comparison
- Structural analysis
- Contest-wide checking

✅ **AI Interview System**
- Adaptive question selection
- Real-time code evaluation
- Explanation verification
- Follow-up questions

✅ **Recommendations**
- Personalized problem suggestions
- Skill gap analysis
- Learning path generation

## Tech Stack

- **Framework**: FastAPI
- **ML**: scikit-learn, PyTorch, Transformers
- **Code Analysis**: AST, tree-sitter
- **Database**: PostgreSQL, Redis
- **Embeddings**: CodeBERT

## Installation

### Prerequisites

- Python 3.9+
- PostgreSQL
- Redis (optional, for caching)

### Setup

1. **Clone the repository**
```bash
cd ai-service
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Train models** (optional)
```bash
python -m src.scripts.train_models
```

6. **Run the service**
```bash
python -m src.main
```

Service will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## API Endpoints

### Analysis
```bash
POST /api/v1/analyze/submission
POST /api/v1/analyze/batch
POST /api/v1/analyze/complexity
POST /api/v1/analyze/compare
```

### Interview
```bash
POST /api/v1/interview/start
POST /api/v1/interview/{interview_id}/submit
POST /api/v1/interview/check-explanation
GET  /api/v1/interview/{interview_id}/report
```

### Plagiarism
```bash
POST /api/v1/plagiarism/check
POST /api/v1/plagiarism/compare
GET  /api/v1/plagiarism/contest/{contest_id}/results
```

### Recommendations
```bash
POST /api/v1/recommendations/problems
GET  /api/v1/recommendations/user/{user_id}/skill-gap
GET  /api/v1/recommendations/user/{user_id}/learning-path
GET  /api/v1/recommendations/similar/{problem_id}
```

## Usage Examples

### Analyze Code Submission
```python
import requests

response = requests.post('http://localhost:8000/api/v1/analyze/submission', json={
    "submission_id": "sub_123",
    "user_id": "user_456",
    "problem_id": "two-sum",
    "code": "def twoSum(nums, target): ...",
    "language": "python"
})

result = response.json()
print(f"Quality: {result['quality_label']}")
print(f"Complexity: {result['time_complexity']}")
```

### Check Plagiarism
```python
response = requests.post('http://localhost:8000/api/v1/plagiarism/check', json={
    "contest_id": "contest_001",
    "submissions": [
        {"id": "sub_1", "code": "...", "user_id": "user_1"},
        {"id": "sub_2", "code": "...", "user_id": "user_2"}
    ]
})

result = response.json()
print(f"Suspicious pairs: {len(result['suspicious_pairs'])}")
```

## Development

### Run Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black src/
flake8 src/
```

### Type Checking
```bash
mypy src/
```

## Model Training

### Collect Data
```bash
python -m src.scripts.collect_data
```

### Train Models
```bash
python -m src.scripts.train_models
```

### Evaluate Models
```bash
python -m src.scripts.evaluate_models
```

## Docker Deployment
```bash
docker-compose up -d
```

## Architecture