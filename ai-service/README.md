# 🤖 CodeForge AI Service

> Python FastAPI microservice for ML-powered code analysis, interviews, and recommendations

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?logo=fastapi)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.3+-orange?logo=scikit-learn)
![Redis](https://img.shields.io/badge/Redis-5.0-red?logo=redis)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [ML Models](#-ml-models)
- [API Documentation](#-api-documentation)
- [Code Analysis](#-code-analysis)
- [Plagiarism Detection](#-plagiarism-detection)
- [Interview System](#-interview-system)
- [Training Models](#-training-models)
- [Deployment](#-deployment)
- [Testing](#-testing)

---

## ✨ Features

### Code Analysis
- 🎯 **Quality Assessment** - Code quality scoring (0-1 scale)
- ⏱️ **Complexity Prediction** - Time & space complexity analysis
- 🚫 **Anti-pattern Detection** - Identify code smells and bad practices
- 💡 **Smart Suggestions** - Context-aware improvement recommendations
- 📊 **Performance Insights** - Bottleneck analysis and optimization tips

### Plagiarism Detection
- 🔍 **Multiple Algorithms** - Winnowing, AST similarity, code embedding
- 🎯 **High Accuracy** - Token-level and structure similarity
- 📈 **Confidence Scores** - Similarity percentage with confidence metrics
- 🔗 **Pair Detection** - Identify suspicious code pairs
- 📊 **Visualization** - Side-by-side code comparison

### AI Interview
- 🎓 **Question Generation** - DSA problems based on difficulty and topics
- 💬 **Follow-up Questions** - Adaptive questioning based on answers
- 📊 **Performance Tracking** - Real-time evaluation metrics
- 📝 **Report Generation** - Comprehensive interview reports
- 🎯 **Difficulty Adjustment** - Dynamic difficulty scaling

### Recommendations
- 🎯 **Personalized Suggestions** - Based on user history and skills
- 📊 **Skill Gap Analysis** - Identify areas for improvement
- 📚 **Learning Paths** - Structured topic progression
- 🔗 **Similar Problems** - Find related coding challenges
- 🏆 **Difficulty Matching** - Appropriate challenge level

### Smart Hints (NEW)
- 💡 **Progressive Hints** - Multi-level hint system
- 🎯 **Context-aware** - Based on current code and problem
- 🚫 **No Spoilers** - Gradual guidance without full solutions
- 📊 **Approach Suggestions** - Algorithm and data structure hints
- 🔗 **Similar Problem References** - Learn from related problems

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Backend API    │
│  (Node.js)      │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────┐
│  FastAPI        │
│  AI Service     │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬─────────┐
    ▼          ▼          ▼         ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐
│Parser  │ │Feature│ │ML Model│ │Cache │
│(tree-  │ │Extract│ │(sklearn│ │(Redis│
│sitter) │ │       │ │)       │ │)     │
└────────┘ └──────┘ └────────┘ └──────┘
```

---

## 🛠️ Tech Stack

### Core Framework
- **Python 3.12** - Programming language
- **FastAPI 0.104.1** - Web framework
- **Uvicorn 0.24.0** - ASGI server
- **Pydantic 2.5.0** - Data validation

### Machine Learning
- **NumPy ≥1.26.0** - Numerical computing
- **Pandas ≥2.1.0** - Data manipulation
- **Scikit-learn ≥1.3.0** - ML algorithms
- **Joblib ≥1.3.0** - Model persistence

### Code Analysis
- **tree-sitter 0.20.4** - Parsing C++, Java, Python, JavaScript
- **AST Analysis** - Abstract Syntax Tree manipulation
- **Code Metrics** - Cyclomatic complexity, LOC, etc.

### Database & Cache
- **SQLAlchemy 2.0.23** - ORM
- **AsyncPG 0.29.0** - PostgreSQL async driver
- **Redis 5.0.1** - Caching layer
- **Alembic 1.13.0** - Database migrations

### HTTP & Security
- **httpx 0.25.1** - Async HTTP client
- **aiohttp 3.9.0** - Async HTTP framework
- **python-jose** - JWT tokens
- **passlib** - Password hashing

### Development
- **pytest 7.4.3** - Testing framework
- **pytest-asyncio 0.21.1** - Async testing
- **black 23.11.0** - Code formatting
- **flake8 6.1.0** - Linting
- **mypy 1.7.1** - Type checking

---

## 🚀 Getting Started

### Prerequisites

```bash
Python >= 3.12
pip >= 23.0
Redis >= 6.0 (for caching)
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
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

4. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/codeforge_ai

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/ai-service.log

# Model Paths
QUALITY_MODEL_PATH=models/quality/model.pkl
COMPLEXITY_MODEL_PATH=models/complexity/model.pkl

# Features
ENABLE_CACHING=True
CACHE_TTL=3600
```

5. **Download/Train ML models** (optional)
```bash
# Use pre-trained models (recommended)
# Models are included in models/ directory

# OR train from scratch
python src/scripts/train_models.py
```

6. **Start development server**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at `http://localhost:8000`

### Quick Start with Docker

```bash
docker-compose up ai-service
```

---

## 📁 Project Structure

```
ai-service/
├── data/                      # Training & test data
│   ├── raw/                  # Raw data files
│   ├── processed/            # Processed features
│   ├── labeled/              # Labeled training data
│   └── codeforces/          # Codeforces problem data
├── logs/                     # Application logs
│   └── ai-service.log
├── models/                   # Trained ML models
│   ├── quality/             # Code quality model
│   │   ├── model.pkl
│   │   ├── scaler.pkl
│   │   └── metadata.json
│   └── complexity/          # Complexity prediction model
│       ├── model.pkl
│       ├── scaler.pkl
│       └── metadata.json
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── cache.py             # Redis cache
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── dependencies.py  # API dependencies
│   │   ├── schemas.py       # Pydantic models
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── analysis.py        # Code analysis endpoints
│   │       ├── interview.py       # Interview endpoints
│   │       ├── plagiarism.py      # Plagiarism detection
│   │       ├── recommendations.py # Problem recommendations
│   │       └── hints.py           # NEW - Smart hints
│   ├── core/                # Core algorithms
│   │   ├── algorithms/
│   │   │   ├── __init__.py
│   │   │   ├── ast_similarity.py  # AST-based comparison
│   │   │   ├── code_embedding.py  # Code vectorization
│   │   │   ├── winnowing.py       # Fingerprinting
│   │   │   └── dsa_questions.py   # Question bank
│   │   ├── features/
│   │   │   ├── __init__.py
│   │   │   ├── algorithmic.py     # Algorithm detection
│   │   │   ├── quality.py         # Quality metrics
│   │   │   ├── runtime.py         # Runtime features
│   │   │   └── structural.py      # Code structure
│   │   └── parsers/
│   │       ├── __init__.py
│   │       ├── cpp_parser.py      # C++ parser
│   │       ├── java_parser.py     # Java parser
│   │       ├── javascript_parser.py
│   │       └── python_parser.py   # Python parser
│   ├── models/              # ML model classes
│   │   ├── __init__.py
│   │   ├── base.py              # Base model class
│   │   ├── quality_model.py     # Quality prediction
│   │   ├── complexity_model.py  # Complexity prediction
│   │   └── antipattern_model.py # Anti-pattern detection
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── analysis_service.py       # Main analysis
│   │   ├── code_parser.py            # Multi-language parser
│   │   ├── feature_extractor.py      # Feature engineering
│   │   ├── interview_service.py      # Interview logic
│   │   ├── plagiarism_service.py     # Plagiarism detection
│   │   ├── recommendation_service.py # Recommendations
│   │   ├── hint_service.py           # NEW - Hint generation
│   │   └── solution_service.py       # NEW - Solution analysis
│   ├── scripts/             # Utility scripts
│   │   ├── __init__.py
│   │   ├── collect_data.py          # Data collection
│   │   ├── prepare_cf_data.py       # Codeforces data prep
│   │   ├── train_models.py          # Train all models
│   │   ├── evaluate_models.py       # Model evaluation
│   │   └── scrape_codeforces_github.py
│   └── utils/               # Utilities
│       ├── __init__.py
│       ├── helpers.py       # Helper functions
│       ├── logger.py        # Logging setup
│       ├── metrics.py       # Evaluation metrics
│       └── validators.py    # Input validation
├── tests/                   # Test files
│   ├── __init__.py
│   ├── test_analysis.py
│   ├── test_plagiarism.py
│   └── test_interview.py
├── .dockerignore
├── .env.example            # Environment template
├── .gitignore
├── docker-compose.yml      # Docker compose config
├── Dockerfile              # Docker build file
├── README.md               # This file
└── requirements.txt        # Python dependencies
```

---

## 🧠 ML Models

### 1. Code Quality Model

**Purpose**: Predict code quality score (0-1)

**Features** (50+ features):
- Lines of code
- Cyclomatic complexity
- Function/method count
- Variable naming conventions
- Comment ratio
- Nesting depth
- Code duplication
- Import statements
- Error handling patterns

**Model**: Random Forest Classifier
```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    random_state=42
)
```

**Output**:
```python
{
    "quality_score": 0.85,
    "quality_label": "excellent",  # poor|fair|good|excellent
    "confidence": 0.92
}
```

### 2. Complexity Prediction Model

**Purpose**: Predict time/space complexity

**Features**:
- Loop structures (nested, single)
- Recursion patterns
- Data structure usage
- Algorithm patterns
- Input size relationships

**Model**: Multi-class Classification
```python
from sklearn.ensemble import GradientBoostingClassifier

complexity_classes = [
    'O(1)', 'O(log n)', 'O(n)', 
    'O(n log n)', 'O(n²)', 'O(2^n)'
]
```

**Output**:
```python
{
    "time_complexity": "O(n log n)",
    "space_complexity": "O(n)",
    "confidence": 0.88
}
```

### 3. Anti-pattern Detection

**Purpose**: Identify code smells and bad practices

**Patterns Detected**:
- Nested loops (>3 levels)
- Magic numbers
- Long methods (>50 lines)
- Deep nesting (>4 levels)
- Duplicate code
- Missing error handling
- Inefficient algorithms

**Output**:
```python
{
    "anti_patterns": [
        {
            "type": "nested_loops",
            "severity": "high",
            "line": 15,
            "suggestion": "Consider using hash map instead"
        }
    ]
}
```

---

## 📡 API Documentation

### Interactive Docs
Access at: `http://localhost:8000/api/docs`

### Base URL
```
http://localhost:8000/api/v1
```

### Code Analysis Endpoints

#### Analyze Submission
```http
POST /analyze/submission
Content-Type: application/json

{
  "submission_id": "sub_123",
  "code": "def two_sum(nums, target):\n    ...",
  "language": "python",
  "problem_id": "prob_123",
  "user_id": "user_123",
  "execution_results": {
    "runtime_ms": 45,
    "memory_kb": 2048,
    "test_cases_passed": 10,
    "total_test_cases": 10
  }
}

Response: 200 OK
{
  "quality_score": 0.85,
  "quality_label": "excellent",
  "quality_confidence": 0.92,
  "time_complexity": "O(n)",
  "space_complexity": "O(n)",
  "complexity_confidence": 0.88,
  "anti_patterns": [],
  "suggestions": [
    "Consider adding type hints",
    "Add docstring to explain the algorithm"
  ],
  "performance_rating": "optimized",
  "bottleneck_analysis": [],
  "cyclomatic_complexity": 3,
  "lines_of_code": 8,
  "function_count": 1
}
```

#### Real-time Code Analysis
```http
POST /analyze/code
Content-Type: application/json

{
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}

Response: 200 OK
{
  "quality_score": 0.75,
  "time_complexity": "O(n²)",
  "suggestions": [
    "Use hash map for O(n) solution",
    "Add input validation"
  ]
}
```

### Plagiarism Detection

#### Check Contest Plagiarism
```http
POST /plagiarism/check
Content-Type: application/json

{
  "contest_id": "contest_123",
  "submissions": [
    {
      "user_id": "user1",
      "problem_id": "prob1",
      "code": "...",
      "language": "python"
    },
    {
      "user_id": "user2",
      "problem_id": "prob1",
      "code": "...",
      "language": "python"
    }
  ]
}

Response: 200 OK
{
  "contest_id": "contest_123",
  "total_submissions": 50,
  "suspicious_pairs": [
    {
      "user1_id": "user1",
      "user2_id": "user2",
      "problem_id": "prob1",
      "similarity_score": 0.92,
      "algorithm": "winnowing",
      "confidence": 0.95,
      "flagged": true
    }
  ],
  "plagiarism_detected": true
}
```

### Interview Endpoints

#### Start Interview
```http
POST /interview/start
Content-Type: application/json

{
  "user_id": "user_123",
  "difficulty": "medium",
  "topics": ["arrays", "hash-tables"],
  "duration_minutes": 45
}

Response: 201 Created
{
  "session_id": "session_123",
  "questions": [
    {
      "id": "q1",
      "title": "Two Sum",
      "difficulty": "medium",
      "topics": ["arrays", "hash-tables"],
      "description": "...",
      "hints_available": 3
    }
  ],
  "duration_minutes": 45,
  "started_at": "2024-02-15T10:00:00Z"
}
```

#### Get Interview Details
```http
GET /interview/{session_id}

Response: 200 OK
{
  "session_id": "session_123",
  "status": "in_progress",
  "questions_answered": 2,
  "total_questions": 3,
  "time_remaining_minutes": 30,
  "current_question": { ... }
}
```

#### Submit Interview Answer
```http
POST /interview/{session_id}/submit
Content-Type: application/json

{
  "question_id": "q1",
  "code": "...",
  "language": "python"
}

Response: 200 OK
{
  "correct": true,
  "feedback": "Excellent solution with O(n) complexity",
  "next_question": { ... }
}
```

### Recommendation Endpoints

#### Get Problem Recommendations
```http
POST /recommendations/problems
Content-Type: application/json

{
  "user_id": "user_123",
  "limit": 10,
  "include_solved": false
}

Response: 200 OK
{
  "recommendations": [
    {
      "problem_id": "prob_456",
      "title": "Valid Parentheses",
      "difficulty": "easy",
      "relevance_score": 0.92,
      "reason": "Based on your recent stack problems"
    }
  ],
  "skill_gaps": [
    {
      "topic": "dynamic-programming",
      "proficiency": 0.3,
      "recommended_problems": 5
    }
  ]
}
```

### Smart Hints (NEW)

#### Get Progressive Hints
```http
POST /hints/generate
Content-Type: application/json

{
  "problem_id": "prob_123",
  "current_code": "def solution():\n    pass",
  "language": "python",
  "hint_level": 1
}

Response: 200 OK
{
  "hints": [
    {
      "level": 1,
      "type": "approach",
      "content": "Consider using a hash table to store seen values"
    },
    {
      "level": 2,
      "type": "algorithm",
      "content": "Two-pass approach: first pass to build map, second to find complement"
    },
    {
      "level": 3,
      "type": "implementation",
      "content": "Use enumerate() to get both index and value"
    }
  ],
  "max_hints": 5,
  "current_level": 1
}
```

---

## 🔍 Code Analysis

### Feature Extraction Process

```python
from src.services.feature_extractor import FeatureExtractor

extractor = FeatureExtractor()

# Extract features
features = extractor.extract_features(
    code="def solution(n): return n * 2",
    language="python",
    runtime_info={
        "runtime_ms": 10,
        "memory_kb": 1024,
        "test_cases_passed": 10
    }
)

# Features object contains:
# - Lines of code
# - Cyclomatic complexity
# - Function count
# - Variable count
# - Loop structures
# - Conditional statements
# - Comment ratio
# - Naming conventions
# - And 40+ more features
```

### Complexity Analysis

```python
from src.models.complexity_model import ComplexityModel

model = ComplexityModel()

prediction = model.predict(features)
# {
#     "time_complexity": "O(n)",
#     "space_complexity": "O(1)",
#     "confidence": 0.92
# }
```

### Quality Assessment

```python
from src.models.quality_model import QualityModel

model = QualityModel()

quality = model.predict(features)
# {
#     "score": 0.85,
#     "label": "excellent",
#     "confidence": 0.90
# }
```

---

## 🔎 Plagiarism Detection

### Algorithms

#### 1. Winnowing Algorithm
- Token-based fingerprinting
- Robust to minor changes
- Fast comparison

```python
from src.core.algorithms.winnowing import winnowing_similarity

similarity = winnowing_similarity(code1, code2, language="python")
# Returns: 0.0 - 1.0
```

#### 2. AST Similarity
- Structure-based comparison
- Detects renamed variables
- Language-specific

```python
from src.core.algorithms.ast_similarity import compute_ast_similarity

similarity = compute_ast_similarity(code1, code2, language="python")
# Returns: 0.0 - 1.0
```

#### 3. Code Embedding
- Semantic similarity
- Context-aware
- ML-based

```python
from src.core.algorithms.code_embedding import get_code_similarity

similarity = get_code_similarity(code1, code2, language="python")
# Returns: 0.0 - 1.0
```

### Combining Results

```python
final_similarity = (
    0.4 * winnowing_score +
    0.3 * ast_score +
    0.3 * embedding_score
)

if final_similarity > 0.8:
    flag_as_plagiarism()
```

---

## 🎓 Interview System

### Question Bank

Located in `src/core/algorithms/dsa_questions.py`

```python
QUESTION_BANK = {
    "easy": {
        "arrays": [...],
        "strings": [...],
        "hash-tables": [...]
    },
    "medium": {
        "trees": [...],
        "graphs": [...],
        "dynamic-programming": [...]
    },
    "hard": {
        "advanced-dp": [...],
        "advanced-graphs": [...]
    }
}
```

### Adaptive Difficulty

```python
def adjust_difficulty(user_performance):
    """
    Adjust question difficulty based on user's answers
    """
    if user_performance["accuracy"] > 0.8:
        return increase_difficulty()
    elif user_performance["accuracy"] < 0.4:
        return decrease_difficulty()
    return current_difficulty()
```

---

## 🏋️ Training Models

### Data Collection

```bash
# Collect data from Codeforces
python src/scripts/scrape_codeforces_github.py

# Prepare data for training
python src/scripts/prepare_cf_data.py
```

### Train Models

```bash
# Train all models
python src/scripts/train_models.py

# Train specific model
python src/scripts/train_models.py --model quality

# With custom config
python src/scripts/train_models.py --config config/training.yaml
```

### Evaluate Models

```bash
# Evaluate all models
python src/scripts/evaluate_models.py

# Generate performance report
python src/scripts/evaluate_models.py --report
```

### Model Performance

```
Quality Model:
  - Accuracy: 0.87
  - Precision: 0.85
  - Recall: 0.89
  - F1-Score: 0.87

Complexity Model:
  - Accuracy: 0.82
  - Precision: 0.80
  - Recall: 0.84
  - F1-Score: 0.82
```

---

## 🚀 Deployment

### Production Build

```bash
# Install production dependencies
pip install -r requirements.txt --no-cache-dir

# Set environment
export ENV=production
export DEBUG=False

# Start with Gunicorn
gunicorn src.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Docker Deployment

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Copy models
COPY models/ models/

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  ai-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENV=production
      - DEBUG=False
      - DATABASE_URL=postgresql://postgres:5432/ai_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ai_db
      POSTGRES_PASSWORD: password
    volumes:
      - ai-db-data:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine
    volumes:
      - ai-cache-data:/data

volumes:
  ai-db-data:
  ai-cache-data:
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test file
pytest tests/test_analysis.py

# Verbose output
pytest -v
```

### Test Examples

```python
# tests/test_analysis.py
import pytest
from src.services.analysis_service import AnalysisService

@pytest.fixture
def analysis_service():
    return AnalysisService()

def test_code_quality_analysis(analysis_service):
    result = analysis_service.analyze_submission({
        "code": "def hello():\n    print('world')",
        "language": "python",
        "problem_id": "test_prob",
        "user_id": "test_user"
    })
    
    assert "quality_score" in result
    assert 0 <= result["quality_score"] <= 1
    assert result["quality_label"] in ["poor", "fair", "good", "excellent"]
```

---

## 📊 Performance Optimization

### Caching Strategy

```python
from src.cache import get_cache, set_cache

@cached(ttl=3600)
async def analyze_submission(submission_data):
    # Expensive ML operations
    result = run_models(submission_data)
    return result
```

### Async Operations

```python
import asyncio

async def analyze_multiple_submissions(submissions):
    tasks = [analyze_submission(sub) for sub in submissions]
    results = await asyncio.gather(*tasks)
    return results
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Scikit-learn Guide](https://scikit-learn.org/stable/)
- [tree-sitter Documentation](https://tree-sitter.github.io/)
- [Redis Python Client](https://redis-py.readthedocs.io/)

---

## 📄 License

MIT License

---

## 👥 Contributors

- **ML Engineer**: [Your Name]
- **Backend Developer**: [Name]
- **Data Scientist**: [Name]

---

**Made with ❤️ by the CodeForge Team**