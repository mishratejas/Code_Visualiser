# CodeForge — AI Service

Python FastAPI microservice providing AI-powered code analysis, plagiarism detection, interview simulation, and personalised recommendations. Uses Google Gemini 2.5 Flash for language model capabilities and custom algorithms for fast structural analysis.

**Port:** `8001`  
**Never called directly by the frontend** — all requests are proxied through the Node backend at `:8000/api/v1/ai/*` and `:8000/api/v1/plagiarism/*`.

---

## Stack

| Technology | Version | Purpose |
|---|---|---|
| Python | ≥ 3.11 | Runtime |
| FastAPI | 0.104 | Web framework + OpenAPI docs |
| Uvicorn | 0.24 | ASGI server |
| Pydantic | 2.5 | Request / response validation |
| google-generativeai | 0.7.2 | Gemini API client |
| redis (async) | 5.0 | Result caching (falls back to in-memory) |
| httpx | 0.25 | Async HTTP client |
| python-jose | 3.3 | JWT validation |
| Python `ast` module | stdlib | Python AST parsing for structural analysis |

No heavy ML frameworks (no PyTorch, no sklearn). Structural analysis uses Python's built-in `ast` module and custom regex parsers for other languages.

---

## Project Structure

```
ai-service/
├── src/
│   ├── main.py                         # FastAPI app factory, router registration, lifespan
│   ├── config.py                       # Config class — reads .env, multi-key Gemini setup
│   ├── cache.py                        # CacheManager — Redis with in-memory fallback
│   ├── database.py                     # DB connection helpers (if any MongoDB calls needed)
│   │
│   ├── api/
│   │   ├── dependencies.py             # FastAPI dependency injection (auth, rate limit)
│   │   ├── schemas.py                  # Shared Pydantic models (Language, Verdict, AnalysisResponse…)
│   │   └── routes/
│   │       ├── analysis.py             # POST /api/v1/analyze/code, /complexity
│   │       ├── plagiarism.py           # POST /api/v1/plagiarism/check, /compare
│   │       ├── interview.py            # POST /api/v1/interview/question, /evaluate, /hint
│   │       └── recommendations.py     # POST /api/v1/recommendations/problems, /learning-path
│   │
│   ├── services/
│   │   ├── analysis_service.py         # Core analysis logic: structural metrics + Gemini
│   │   ├── plagiarism_service.py       # Winnowing + AST similarity + Gemini explanation
│   │   ├── interview_service.py        # Question generation, solution evaluation, hints
│   │   ├── recommendation_service.py  # Problem recommendations + learning path
│   │   └── code_parser.py             # Language-specific code tokenisers
│   │
│   ├── core/
│   │   └── algorithms/
│   │       ├── winnowing.py            # Winnowing algorithm (k-gram fingerprinting)
│   │       ├── ast_similarity.py       # AST-based structural similarity
│   │       └── dsa_questions.py        # Built-in DSA question bank
│   │
│   └── utils/
│       ├── helpers.py                  # Shared utility functions
│       ├── logger.py                   # Coloured console + rotating file logger
│       ├── metrics.py                  # Performance metrics collection
│       └── validators.py              # Input sanitisation
│
├── logs/
│   └── ai-service.log                  # Rotating log file
├── Dockerfile                          # Docker image
├── docker-compose.yml                  # Compose config (service + Redis)
├── requirements.txt                    # Python dependencies
└── .env                                # Environment config
```

---

## Getting Started

### Local (no Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Add your Gemini API key to .env

# Start server with hot reload
uvicorn src.main:app --port 8001 --reload
```

### Docker

```bash
# Build and start (includes Redis)
docker-compose up --build

# Rebuild after code changes
docker-compose up --build --force-recreate
```

---

## Environment Variables

```env
# Application
APP_NAME=CodeForge AI Service
DEBUG=False

# Server
HOST=0.0.0.0
PORT=8001

# CORS — allow frontend dev server and Node backend
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# Gemini API Key(s)
# Single key:
GEMINI_API_KEY=AIzaSy...

# OR multiple keys (auto-failover if one rate-limits):
GEMINI_API_KEYS=AIzaSy...,AIzaSy...,AIzaSy...

# Model — gemini-2.5-flash is fastest and free-tier friendly
GEMINI_MODEL=gemini-2.5-flash

# Redis
REDIS_URL=redis://localhost:6379

# Node backend (for any cross-service calls)
NODE_BACKEND_URL=http://localhost:8000

# Analysis limits
MAX_CODE_LENGTH=50000
PLAGIARISM_THRESHOLD=0.75

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/ai-service.log

# Security (optional — internal service key)
VALID_API_KEYS=your-internal-key
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service status + Gemini configuration check |
| GET | `/api/v1/gemini-test` | Live Gemini API test — sends real prompt and reports latency |
| GET | `/` | Service info + links to docs |

### Analysis — `/api/v1/analyze`

#### `POST /code` — Full AI Code Analysis

Analyses code for time/space complexity, quality, anti-patterns, and improvements. Calls Gemini for semantic analysis; falls back to rule-based if Gemini is unavailable.

**Request:**
```json
{
  "code": "def solve(nums):\n    return sorted(nums)",
  "language": "python",
  "submission_id": "sub_abc123",
  "runtime_ms": 150,
  "test_cases_passed": 8,
  "total_test_cases": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "sub_abc123",
    "quality_score": 0.72,
    "quality_label": "good",
    "time_complexity": "O(n log n)",
    "space_complexity": "O(n)",
    "anti_patterns": [
      {
        "type": "no_early_termination",
        "description": "Could return early if input is already sorted",
        "severity": "low",
        "confidence": 0.6
      }
    ],
    "suggestions": [
      "Consider using a heap if you only need the k smallest elements",
      "Add input validation for empty lists"
    ],
    "cyclomatic_complexity": 1,
    "lines_of_code": 2,
    "performance_rating": "acceptable",
    "bottleneck_analysis": [],
    "confidence": 0.85
  }
}
```

#### `POST /complexity` — Structural Metrics Only (instant, no Gemini)

Returns only structural metrics computed from the AST. No network call to Gemini. Response time < 50ms.

**Response includes:** `lines_of_code`, `function_count`, `loop_count`, `max_nesting_depth`, `cyclomatic_complexity`, `comment_density`, `uses_recursion`, `uses_dp`, `uses_sorting`, `uses_binary_search`

---

### Plagiarism — `/api/v1/plagiarism`

#### `POST /check` — Contest-wide Detection

Runs O(n²) pairwise comparison across all contest submissions using Winnowing + AST similarity. Suitable for contests with up to ~500 submissions.

**Request:**
```json
{
  "contest_id": "contest_xyz",
  "submissions": [
    {
      "id": "sub_1",
      "user_id": "user_a",
      "code": "def solve(n):\n    return n * 2",
      "language": "python"
    },
    {
      "id": "sub_2",
      "user_id": "user_b",
      "code": "def solution(x):\n    return x * 2",
      "language": "python"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contest_id": "contest_xyz",
    "total_submissions": 2,
    "suspicious_pairs": [
      {
        "submission1": "sub_1",
        "submission2": "sub_2",
        "user1": "user_a",
        "user2": "user_b",
        "similarity_score": 0.94,
        "winnowing_similarity": 0.96,
        "ast_similarity": 0.92,
        "explanation": "Both solutions implement identical logic with only variable name differences.",
        "verdict": "pending"
      }
    ],
    "checked_at": "2025-01-01T12:00:00Z"
  }
}
```

#### `POST /compare` — Two-Submission Comparison

Direct pairwise comparison with full AI explanation.

---

### Interview — `/api/v1/interview`

#### `POST /question` — Generate DSA Question

```json
{ "difficulty": "medium", "topic": "graphs", "user_id": "u123" }
```

Returns a full problem statement with constraints, examples, and expected complexity hints.

#### `POST /evaluate` — Evaluate User's Solution

Sends code + question to Gemini for detailed feedback: correctness, complexity, style, edge cases missed.

#### `POST /hint` — Progressive Hints

`hint_level` 1–3: from conceptual direction → approach hint → partial pseudocode.

#### `POST /check-explanation` — Evaluate Code Explanation

Assesses how well the user has explained their own solution (used in mock interview flow).

---

### Recommendations — `/api/v1/recommendations`

#### `POST /problems` — Personalised Problem List

```json
{
  "user_stats": {
    "rating": 1600,
    "easySolved": 45,
    "mediumSolved": 20,
    "hardSolved": 3
  },
  "solved_problems": [{ "_id": "p1", "tags": ["arrays"] }],
  "available_problems": [...],
  "limit": 8
}
```

Returns 8 problems ranked by predicted educational value given the user's profile.

#### `POST /learning-path` — Custom Study Roadmap

```json
{ "user_stats": {...}, "target_role": "sde" }
```

Returns a multi-week structured study plan with topic progression, recommended resources, and milestone checkpoints.

---

## Plagiarism Algorithms

### Winnowing (Token Fingerprinting)

Based on: *Schleimer et al., "Winnowing: Local Algorithms for Document Fingerprinting"*

**How it works:**

1. **Normalise** — strip comments, lowercase everything, collapse whitespace
2. **Tokenise** — convert code to a sequence of meaningful tokens (identifiers, operators, keywords)
3. **k-grams** — create overlapping windows of k tokens and hash each window (default `k=7`)
4. **Sliding window** — slide a window of size `w` over the hashes; pick the minimum hash in each position (default `w=5`)
5. **Fingerprint** — the set of selected minimum hashes represents the document
6. **Jaccard similarity** — `|A ∩ B| / |A ∪ B|` between two fingerprints gives the similarity score

**Guarantee:** Any copied block ≥ `k + w - 1 = 11` tokens will be detected.

**Why it's effective:** Two students who copied code and renamed variables will still produce nearly identical token sequences, so the fingerprints will match even after superficial obfuscation.

### AST Similarity

Parses code into an Abstract Syntax Tree (Python `ast` module for Python; regex-based structural extraction for other languages). Compares tree structure while **ignoring identifier names and literal values**.

Two submissions with different variable names but identical control flow will show near-100% AST similarity. Combined with Winnowing:

| Score combination | Interpretation |
|---|---|
| High Winnowing + High AST | Strong evidence of copy-paste with renaming |
| High Winnowing + Low AST | Same token patterns but different structure (e.g. common algorithm) |
| Low Winnowing + High AST | Same structure but very different implementation (less suspicious) |

### Gemini Explanation

For pairs above the threshold (`PLAGIARISM_THRESHOLD=0.75`), a Gemini prompt is sent asking for a natural language explanation of the similarities. This explanation appears in the admin's Plagiarism Panel to help make the verdict decision.

---

## Multi-Key Gemini Failover

The service supports multiple Gemini API keys with automatic rotation:

```env
GEMINI_API_KEYS=key1,key2,key3
```

- Keys are loaded in order; the first valid key is tried first
- If a key throws an error (rate limit, quota exceeded), the service automatically tries the next key
- Duplicate keys are deduplicated at startup
- The `/health` endpoint reports how many keys are loaded and active

**Fallback behaviour:** If all Gemini keys fail or none are configured, the service falls back to **rule-based analysis only** — structural metrics are still returned but AI-generated suggestions and explanations are omitted. The service never returns 503 just because Gemini is unavailable.

---

## Caching

Analysis results are cached to avoid redundant Gemini calls:

| Cache key | TTL | Content |
|---|---|---|
| `analysis:{submission_id}` | 1 hour | Full analysis result |
| `plagiarism:{contest_id}` | 30 mins | Plagiarism report |
| `interview:{user_id}:{topic}` | 15 mins | Generated question |

Cache backend: **Redis** (async client). Automatically falls back to an in-memory Python dict if Redis is unavailable — no configuration required for local development without Redis.

---

## Logging

Coloured console output + rotating file logs:

```
logs/
└── ai-service.log    # rotates at 10MB, keeps 5 backups
```

Log format: `2025-01-01 12:00:00 - ai-service - INFO - analysis.py:45 - Analyzed submission sub_123`

Level controlled by `LOG_LEVEL` env var (DEBUG / INFO / WARNING / ERROR).

---

## Docker

```yaml
# docker-compose.yml (simplified)
services:
  ai-service:
    build: .
    ports: ["8001:8001"]
    environment:
      - GEMINI_API_KEYS=${GEMINI_API_KEYS}
      - REDIS_URL=redis://redis:6379
    depends_on: [redis]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
docker-compose up --build
```

---

## API Documentation

FastAPI auto-generates interactive API docs:

- **Swagger UI:** http://localhost:8001/api/docs
- **ReDoc:** http://localhost:8001/api/redoc

---

## Supported Languages

| Language | Structural Analysis | Plagiarism Detection |
|---|---|---|
| Python | Full AST (built-in `ast` module) | Winnowing + AST |
| JavaScript | Regex-based metrics | Winnowing |
| Java | Regex-based metrics | Winnowing |
| C++ | Regex-based metrics | Winnowing |
| C | Regex-based metrics | Winnowing |