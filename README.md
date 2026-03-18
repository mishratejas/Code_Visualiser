# CodeForge — Competitive Programming Platform

A full-stack competitive programming platform with AI-powered code analysis, real-time contests, plagiarism detection, and a rich social layer. Inspired by LeetCode and Codeforces.

---

## Repository Structure

```
codeforge/
├── frontend/          # React + Vite client application
├── backend/           # Node.js + Express REST API + Socket.IO server  
├── ai-service/        # Python FastAPI AI microservice (Gemini + algorithms)
└── README.md          # This file
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│           React + Vite (port 5173)                  │
└──────────┬────────────────────────┬─────────────────┘
           │ REST (HTTP)            │ WebSocket
           ▼                        ▼
┌──────────────────────────────────────────────────────┐
│           Node.js Backend (port 8000)                │
│   Express REST API + Socket.IO + Bull Queues         │
│                                                      │
│  ┌──────────┐  ┌───────┐  ┌──────────────────────┐  │
│  │ MongoDB  │  │ Redis │  │  HTTP Proxy → :8001   │  │
│  └──────────┘  └───────┘  └──────────────────────┘  │
└──────────────────────────────┬───────────────────────┘
                               │ HTTP (internal)
                               ▼
┌──────────────────────────────────────────────────────┐
│           Python AI Service (port 8001)              │
│   FastAPI + Gemini API + Winnowing + AST Analysis    │
└──────────────────────────────────────────────────────┘
```

The frontend **never** contacts the AI service directly. All AI calls are proxied through the Node backend (`/api/v1/ai/*` → `:8001`).

---

## Services at a Glance

| Service | Port | Stack | README |
|---|---|---|---|
| Frontend | 5173 | React 19, Vite, Tailwind CSS v4, Socket.IO client | [frontend/README.md](frontend/README.md) |
| Backend | 8000 | Node.js, Express, MongoDB, Redis, Socket.IO, Bull | [backend/README.md](backend/README.md) |
| AI Service | 8001 | Python 3.11+, FastAPI, Gemini 2.5 Flash, Redis cache | [ai-service/README.md](ai-service/README.md) |

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- MongoDB (local or Atlas URI)
- Redis (local; AI service falls back to in-memory if unavailable)
- Google Gemini API key (free tier works; get one at https://aistudio.google.com)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, GEMINI proxy config
npm run dev               # starts on :8000
```

### 2. AI Service

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env      # fill in GEMINI_API_KEY
uvicorn src.main:app --port 8001 --reload
```

Verify Gemini is working:
```
GET http://localhost:8001/api/v1/gemini-test
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000/api/v1
npm run dev               # starts on :5173
```

Open http://localhost:5173

---

## Core Features

### For Users
- **Problem solving** — 300+ problems with Easy / Medium / Hard difficulty, tags, and categories; Monaco code editor with 10 language options
- **Contests** — timed competitions with live leaderboard via WebSocket; automatic rating updates on contest end
- **AI Code Analysis** — instant Gemini-powered feedback: time/space complexity, quality score, anti-patterns, improvement suggestions
- **AI Interview** — full mock technical interview with a real-time AI examiner; hint system; solution evaluation
- **Rating system** — Codeforces-style integer rating; ranks from Newbie to Grandmaster; history chart with cheated markers
- **Achievements** — badges for milestones (first solve, 100 problems, 30-day streak, contest champion, etc.)
- **Discussion forum** — per-problem and general discussion with voting and nested comments
- **Groups** — team/organisation spaces with shared problem sets

### For Admins / Organisers
- Create and manage contests; attach problems; view registration
- **Plagiarism Detection Panel** — run AI + algorithmic similarity analysis across all contest submissions; pairwise side-by-side code diff; three verdict outcomes; automatic 7-day ban + 200 rating penalty on `plagiarism_confirmed`
- Real-time contest monitoring via WebSocket

---

## Environment Variables Summary

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/codeforge
JWT_SECRET=your_jwt_secret
PORT=8000
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8001
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=...        # for OAuth
GOOGLE_CLIENT_SECRET=...
```

### AI Service (`ai-service/.env`)
```env
PORT=8001
GEMINI_API_KEY=AIza...                    # single key
# OR
GEMINI_API_KEYS=AIza...,AIza...,AIza...   # comma-separated for auto-failover
GEMINI_MODEL=gemini-2.5-flash
REDIS_URL=redis://localhost:6379
NODE_BACKEND_URL=http://localhost:8000
PLAGIARISM_THRESHOLD=0.75
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
VITE_APP_NAME=CodeForge
```

---

## API Overview

All REST endpoints are served at `http://localhost:8000/api/v1/`.

| Group | Base path | Description |
|---|---|---|
| Auth | `/auth` | login, register, logout, Google OAuth, token refresh |
| Problems | `/problems` | CRUD, categories, favorites, tags |
| Submissions | `/submissions` | submit, run, get history |
| Contests | `/contests` | CRUD, register, live leaderboard |
| Users | `/users` | profile, stats, rating history, avatar |
| Notifications | `/notifications` | list, unread count, mark read, delete |
| Leaderboard | `/leaderboard` | global and per-contest rankings |
| Achievements | `/achievements` | list, user progress |
| Discuss | `/discuss` | posts, comments, voting |
| Groups | `/groups` | CRUD, membership |
| AI (proxied) | `/ai` | analyze, complexity, interview, recommendations, learning path |
| Plagiarism (proxied) | `/plagiarism` | check contest, compare pair, get report, review verdict |

## WebSocket Events

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `join_user_room` | `{ userId }` | Subscribe to personal notifications |
| Client → Server | `join_contest` | `{ contestId, userId }` | Join live contest room |
| Client → Server | `leave_contest` | `{ contestId }` | Leave contest room |
| Server → Client | `notification` | notification object | Real-time notification push |
| Server → Client | `leaderboard_update` | rankings array | Live contest rank changes |
| Server → Client | `contest_status` | `{ status, contestId }` | Contest start / end event |
| Server → Client | `new_submission` | submission object | Submission judged |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite (rolldown-vite) |
| Frontend styling | Tailwind CSS v4 |
| Frontend state | React Context (auth, theme, editor) + Zustand (AI results) |
| Code editor | Monaco Editor |
| Charts | Recharts |
| HTTP client | Axios with interceptor |
| Real-time client | Socket.IO Client v4 |
| Backend runtime | Node.js + Express |
| Database | MongoDB + Mongoose |
| Cache / Queue | Redis + Bull |
| Auth | JWT (Bearer) + Google OAuth |
| AI framework | Python FastAPI + Uvicorn |
| AI model | Google Gemini 2.5 Flash |
| Plagiarism algorithms | Winnowing (token fingerprinting) + Python AST |
| Containerisation | Docker + docker-compose (AI service) |