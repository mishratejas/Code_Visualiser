# 🔧 CodeForge Backend

> Node.js/Express API server with MongoDB, PostgreSQL, Redis, and AI service integration

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.0-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Latest-red?logo=redis)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [Code Execution](#-code-execution)
- [AI Integration](#-ai-integration)
- [Real-time Features](#-real-time-features)
- [Job Queues](#-job-queues)
- [Deployment](#-deployment)
- [Testing](#-testing)

---

## ✨ Features

### Core API Features
- 🔐 **JWT Authentication** - Secure user authentication with refresh tokens
- 👤 **User Management** - Profile, stats, preferences, avatar upload
- 📝 **Problem CRUD** - Create, read, update, delete coding problems
- 💻 **Code Execution** - Multi-language code runner with test cases
- 📊 **Submission Tracking** - Store and analyze code submissions
- 🏆 **Contest System** - Create and manage coding contests
- 📈 **Leaderboard** - Real-time global and contest rankings
- 🔔 **Notifications** - In-app and email notifications
- 🎯 **Achievements** - Dynamic achievement system with auto-unlock
- 🔥 **Streak Tracking** - Daily activity and solve streaks

### AI-Powered Features
- 🤖 **Code Analysis** - Quality, complexity, and performance analysis
- 💡 **Smart Hints** - Progressive problem-solving hints
- 🎓 **Interview System** - AI-powered mock interviews
- 📚 **Recommendations** - Personalized problem suggestions
- 🔍 **Plagiarism Detection** - Contest integrity checks
- 🎯 **Learning Paths** - Skill gap analysis and recommendations

### Infrastructure
- 🗄️ **Dual Database** - MongoDB (primary) + PostgreSQL (contests)
- ⚡ **Redis Caching** - Fast data access and session management
- 📮 **Job Queues** - Background task processing with Bull
- 🔌 **WebSocket** - Real-time contest updates
- 📧 **Email Service** - Transactional emails with templates
- ☁️ **Cloud Storage** - Cloudinary for image uploads
- 📊 **Logging** - Winston-based structured logging
- 🛡️ **Security** - Helmet, rate limiting, input sanitization

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Load Balancer  │
│   (NGINX/ALB)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────────────┐
│  Backend API    │◄────► Redis (Cache/Queue)
│  (Express)      │
└────────┬────────┘
         │
    ┌────┴────┬────────┬─────────┐
    ▼         ▼        ▼         ▼
┌────────┐ ┌─────┐ ┌──────┐ ┌────────┐
│MongoDB │ │PG DB│ │AI Svc│ │Cloudnry│
└────────┘ └─────┘ └──────┘ └────────┘
```

---

## 🛠️ Tech Stack

### Core Framework
- **Node.js 18+** - Runtime environment
- **Express 5.2.1** - Web framework
- **ES Modules** - Modern JavaScript

### Databases
- **MongoDB (Mongoose 9.1.2)** - Primary database
  - Users, Problems, Submissions
  - AI analyses, Interviews
  - Notifications, Achievements
- **PostgreSQL (Sequelize 6.37.7)** - Contest data
  - Contests, Participants
  - Contest submissions
- **Redis (ioredis 5.9.2)** - Cache & session store
  - Rate limiting
  - Job queues
  - Real-time data

### Security & Middleware
- **Helmet 8.1.0** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit 8.2.1** - API rate limiting
- **express-mongo-sanitize 2.2.0** - NoSQL injection prevention
- **hpp 0.2.3** - HTTP parameter pollution prevention
- **bcryptjs** - Password hashing
- **jsonwebtoken 9.0.3** - JWT authentication

### File Upload & Storage
- **Multer 2.0.2** - File upload handling
- **Cloudinary 2.8.0** - Image storage and optimization
- **Sharp 0.34.5** - Image processing

### Communication
- **Socket.io 4.8.3** - WebSocket for real-time features
- **Axios** - HTTP client for AI service
- **Nodemailer 7.0.12** - Email sending

### Job Processing
- **Bull 4.16.5** - Job queue system
- **node-cron 4.2.1** - Scheduled tasks

### Validation & Logging
- **express-validator 7.3.1** - Request validation
- **Winston 3.19.0** - Logging
- **Morgan 1.10.1** - HTTP request logging

### Development Tools
- **Nodemon** - Auto-restart on changes
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Supertest** - API testing

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MongoDB >= 6.0
PostgreSQL >= 14.0
Redis >= 6.0
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section)

4. **Start services**

Using Docker Compose (recommended):
```bash
docker-compose up -d mongodb postgres redis
```

Or install manually:
- MongoDB: https://www.mongodb.com/docs/manual/installation/
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/docs/getting-started/installation/

5. **Run database migrations**
```bash
npm run migrate
```

6. **Seed initial data** (optional)
```bash
npm run seed:problems
```

7. **Start development server**
```bash
npm run dev
```

Server will start at `http://localhost:5000`

### Quick Start with Docker

```bash
docker-compose up
```

This starts all services: Backend, MongoDB, PostgreSQL, Redis, AI Service

---

## 📁 Project Structure

```
backend/
├── logs/                   # Application logs
│   ├── combined.log
│   └── error.log
├── scripts/                # Database scripts
│   ├── seedComplete.js    # Complete database seeding
│   ├── seedProblems.js    # Seed only problems
│   └── seeder.js          # Base seeder utility
├── src/
│   ├── app.js             # Express app configuration
│   ├── index.js           # Alternative entry point
│   ├── constants.js       # App-wide constants
│   ├── config/            # Configuration files
│   │   ├── index.js       # Main config
│   │   ├── logger.js      # Winston logger setup
│   │   └── redis.config.js # Redis configuration
│   ├── controllers/       # Route controllers
│   │   ├── ai.controller.js          # AI features
│   │   ├── auth.controller.js        # Authentication
│   │   ├── contest.controller.js     # Contests
│   │   ├── interview.controller.js   # AI interviews
│   │   ├── leaderboard.controller.js # Rankings
│   │   ├── notification.controller.js # NEW - Notifications
│   │   ├── achievement.controller.js  # NEW - Achievements
│   │   ├── plagiarism.controller.js  # Plagiarism checks
│   │   ├── problem.controller.js     # Problems CRUD
│   │   ├── submission.controller.js  # Code submissions
│   │   └── user.controller.js        # User management
│   ├── db/                # Database connections
│   │   ├── index.js       # Database manager
│   │   ├── mongo/         # MongoDB connection
│   │   │   └── index.js
│   │   └── postgres/      # PostgreSQL connection
│   │       └── index.js
│   ├── jobs/              # Background jobs
│   │   ├── contestJobs.js         # Contest automation
│   │   ├── streakJobs.js          # NEW - Streak checks
│   │   └── achievementJobs.js     # NEW - Achievement checks
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── error.middleware.js    # Error handler
│   │   ├── rateLimiter.middleware.js # Rate limiting
│   │   ├── sanitize.middleware.js # Input sanitization
│   │   ├── upload.js              # File upload config
│   │   └── validate.middleware.js # Request validation
│   ├── models/            # Database models
│   │   ├── index.js
│   │   ├── ai.models.js
│   │   ├── interview.models.js
│   │   ├── notification.models.js     # NEW
│   │   ├── achievement.models.js      # NEW
│   │   ├── userAchievement.models.js  # NEW
│   │   ├── plagiarism.models.js
│   │   ├── problem.models.js
│   │   ├── submission.models.js
│   │   ├── user.models.js             # MODIFIED
│   │   └── postgres/      # PostgreSQL models
│   │       ├── Contest.models.js
│   │       ├── ContestParticipant.models.js
│   │       ├── ContestSubmission.models.js
│   │       ├── User.models.js
│   │       └── associations.js
│   ├── routes/            # API routes
│   │   ├── index.js
│   │   ├── ai.routes.js
│   │   ├── auth.routes.js
│   │   ├── contest.routes.js
│   │   ├── interview.routes.js
│   │   ├── leaderboard.routes.js
│   │   ├── notification.routes.js     # NEW
│   │   ├── achievement.routes.js      # NEW
│   │   ├── plagiarism.routes.js
│   │   ├── problem.routes.js
│   │   ├── submission.routes.js
│   │   └── user.routes.js
│   ├── services/          # Business logic
│   │   ├── ai.service.js
│   │   ├── code-analysis.service.js
│   │   ├── emailService.js            # ENHANCED
│   │   ├── email-templates.js         # NEW
│   │   ├── interview.service.js
│   │   ├── notification.service.js    # NEW
│   │   ├── achievement.service.js     # NEW
│   │   ├── streak.service.js          # NEW
│   │   ├── plagiarism.service.js
│   │   ├── redisService.js
│   │   └── syncService.js
│   ├── socket/            # WebSocket handlers
│   │   ├── contestSocket.js
│   │   └── notificationSocket.js      # NEW
│   └── utils/             # Utility functions
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       ├── cloudinary.js
│       ├── code-parser.js
│       ├── complexity-analyzer.js
│       ├── feature-extractor.js
│       ├── image-processor.js         # NEW
│       ├── rateLimiter.js
│       ├── security.js
│       └── validators.js
├── temp/                  # Temporary code execution files
├── verification_output.txt
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template
├── .gitignore
├── package.json
├── package-lock.json
├── README.md             # This file
└── server.js             # Main entry point
```

---

## 🗄️ Database Schema

### MongoDB Collections

#### Users
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  avatar: String (Cloudinary URL),
  role: String (user|admin),
  stats: {
    totalProblemsSolved: Number,
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number,
    contestsParticipated: Number,
    globalRank: Number
  },
  streak: {                          // NEW
    current: Number,
    longest: Number,
    lastActiveDate: Date,
    freezeAvailable: Number
  },
  emailPreferences: {                // NEW
    submissions: Boolean,
    achievements: Boolean,
    contests: Boolean,
    newsletter: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Problems
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique),
  description: String,
  difficulty: String (easy|medium|hard),
  category: [String],
  constraints: String,
  testCases: [{
    input: String,
    expectedOutput: String,
    isPublic: Boolean
  }],
  acceptanceRate: Number,
  likes: Number,
  dislikes: Number,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### Submissions
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  problem: ObjectId (ref: Problem),
  code: String,
  language: String,
  status: String (accepted|wrong_answer|tle|runtime_error|compilation_error),
  executionTime: Number,
  memoryUsed: Number,
  testCasesPassed: Number,
  totalTestCases: Number,
  aiAnalysis: ObjectId (ref: AIAnalysis),
  createdAt: Date
}
```

#### Notifications (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  type: String (submission|achievement|contest|system),
  title: String,
  message: String,
  read: Boolean,
  link: String,
  metadata: Object,
  createdAt: Date
}
```

#### Achievements (NEW)
```javascript
{
  _id: ObjectId,
  key: String (unique),
  title: String,
  description: String,
  icon: String,
  category: String (milestone|streak|speed|mastery),
  points: Number,
  requirement: Number,
  type: String (count|streak|milestone)
}
```

#### UserAchievements (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  achievement: ObjectId (ref: Achievement),
  progress: Number,
  unlockedAt: Date
}
```

### PostgreSQL Tables

#### Contests
```sql
CREATE TABLE contests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Contest Participants
```sql
CREATE TABLE contest_participants (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES contests(id),
  user_id INTEGER,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Problem Endpoints

#### Get All Problems
```http
GET /problems?page=1&limit=20&difficulty=medium&category=arrays

Response: 200 OK
{
  "success": true,
  "data": {
    "problems": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Get Problem by ID
```http
GET /problems/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "problem": { ... }
  }
}
```

#### Create Problem (Admin)
```http
POST /problems
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "easy",
  "category": ["arrays", "hash-table"],
  "testCases": [...]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "problem": { ... }
  }
}
```

### Submission Endpoints

#### Submit Code
```http
POST /submissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "problemId": "problem_id",
  "code": "function twoSum(nums, target) { ... }",
  "language": "javascript"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "submission": {
      "_id": "...",
      "status": "accepted",
      "executionTime": 45,
      "memoryUsed": 2048,
      "testCasesPassed": 10,
      "totalTestCases": 10
    }
  }
}
```

#### Run Code (without submitting)
```http
POST /submissions/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "...",
  "language": "python",
  "testCases": [...]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "results": [...]
  }
}
```

### Contest Endpoints

#### Get All Contests
```http
GET /contests?status=live

Response: 200 OK
{
  "success": true,
  "data": {
    "contests": [...]
  }
}
```

#### Register for Contest
```http
POST /contests/:id/register
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Successfully registered for contest"
}
```

#### Get Contest Leaderboard
```http
GET /contests/:id/leaderboard

Response: 200 OK
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "coder123",
        "score": 2400,
        "problemsSolved": 3
      },
      ...
    ]
  }
}
```

### AI Endpoints

#### Analyze Submission
```http
POST /ai/submissions/:id/analyze
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "analysis": {
      "quality_score": 0.85,
      "time_complexity": "O(n)",
      "space_complexity": "O(1)",
      "suggestions": [...],
      "anti_patterns": [...]
    }
  }
}
```

#### Get AI Hints (NEW)
```http
GET /ai/hints/:problemId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "hints": [
      {
        "level": 1,
        "hint": "Consider using a hash table"
      },
      ...
    ]
  }
}
```

#### Get Recommendations
```http
GET /ai/recommendations?limit=10
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "problems": [...]
  }
}
```

#### Check Plagiarism (Admin)
```http
POST /ai/plagiarism/check
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "contestId": "contest_id"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "suspicious_pairs": [...]
  }
}
```

### Notification Endpoints (NEW)

#### Get User Notifications
```http
GET /notifications?page=1&limit=20&unread=true
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

#### Mark as Read
```http
POST /notifications/mark-read/:id
Authorization: Bearer <token>

Response: 200 OK
```

#### Delete Notification
```http
DELETE /notifications/:id
Authorization: Bearer <token>

Response: 200 OK
```

### Achievement Endpoints (NEW)

#### Get All Achievements
```http
GET /achievements

Response: 200 OK
{
  "success": true,
  "data": {
    "achievements": [...]
  }
}
```

#### Get User Achievements
```http
GET /achievements/user
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "unlocked": [...],
    "locked": [...],
    "progress": { ... }
  }
}
```

### User Endpoints

#### Upload Avatar (NEW)
```http
POST /users/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>

Response: 200 OK
{
  "success": true,
  "data": {
    "avatarUrl": "https://res.cloudinary.com/..."
  }
}
```

#### Get Streak (NEW)
```http
GET /users/streak
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "current": 7,
    "longest": 15,
    "lastActiveDate": "2024-02-15"
  }
}
```

---

## 🔐 Authentication

### JWT Strategy

```javascript
// Token generation
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Token verification (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.userId);
```

### Protected Routes

```javascript
import { protect, authorize } from './middlewares/auth.middleware.js';

// User must be authenticated
router.get('/profile', protect, getProfile);

// User must be admin
router.post('/problems', protect, authorize('admin'), createProblem);
```

---

## 💻 Code Execution

### Execution Flow

1. **Receive submission** → Validate code and language
2. **Create temp files** → Generate unique filename in `/temp`
3. **Compile code** (if needed) → C++, Java
4. **Run test cases** → Execute with timeout and memory limits
5. **Capture results** → stdout, stderr, execution time, memory
6. **Clean up** → Delete temp files
7. **Return results** → Status, passed tests, performance metrics

### Supported Languages

```javascript
const languages = {
  javascript: {
    extension: '.js',
    command: 'node',
    timeout: 5000
  },
  python: {
    extension: '.py',
    command: 'python3',
    timeout: 5000
  },
  cpp: {
    extension: '.cpp',
    compile: 'g++ -std=c++17 -o',
    timeout: 5000
  },
  java: {
    extension: '.java',
    compile: 'javac',
    command: 'java',
    timeout: 5000
  },
  c: {
    extension: '.c',
    compile: 'gcc -o',
    timeout: 5000
  }
};
```

### Security Measures

- ✅ Sandboxed execution
- ✅ Time limits (5 seconds)
- ✅ Memory limits (256 MB)
- ✅ No network access
- ✅ File system restrictions
- ✅ Process isolation

---

## 🤖 AI Integration

### AI Service Client

```javascript
class AIServiceClient {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });
  }

  async analyzeCode(submissionData) {
    const response = await this.client.post('/api/v1/analyze/submission', submissionData);
    return response.data;
  }

  async getHints(problemId, currentCode) {
    const response = await this.client.post('/api/v1/hints', {
      problem_id: problemId,
      code: currentCode
    });
    return response.data;
  }
}
```

### Error Handling

```javascript
try {
  const analysis = await aiClient.analyzeCode(data);
  return analysis;
} catch (error) {
  console.error('AI Service error:', error.message);
  // Return fallback analysis
  return getFallbackAnalysis(data);
}
```

---

## ⚡ Real-time Features

### Socket.io Setup

```javascript
// server.js
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGINS }
});

// Contest updates
io.on('connection', (socket) => {
  socket.on('join-contest', ({ contestId }) => {
    socket.join(`contest-${contestId}`);
  });
  
  socket.on('submission-update', (data) => {
    io.to(`contest-${data.contestId}`).emit('leaderboard-update', data);
  });
});
```

### Client Usage

```javascript
// Frontend
import { io } from 'socket.io-client';

const socket = io(process.env.VITE_SOCKET_URL);

socket.emit('join-contest', { contestId });

socket.on('leaderboard-update', (data) => {
  updateLeaderboard(data);
});
```

---

## 📮 Job Queues

### Bull Queue Setup

```javascript
import Queue from 'bull';
import redis from './config/redis.config.js';

// Create queues
const emailQueue = new Queue('email', { redis });
const achievementQueue = new Queue('achievement', { redis });

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data;
  await sendEmail(to, subject, template, data);
});

// Add job to queue
await emailQueue.add({
  to: user.email,
  subject: 'Achievement Unlocked!',
  template: 'achievement',
  data: { achievement }
});
```

### Scheduled Jobs

```javascript
import cron from 'node-cron';

// Update streaks daily at midnight
cron.schedule('0 0 * * *', async () => {
  await streakService.updateAllStreaks();
});

// Send contest reminders
cron.schedule('*/15 * * * *', async () => {
  await contestService.sendReminders();
});
```

---

## 🌍 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database - MongoDB
MONGODB_URI=mongodb://localhost:27017/codeforge

# Database - PostgreSQL
POSTGRES_URI=postgresql://user:password@localhost:5432/codeforge_contests

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=CodeForge <noreply@codeforge.com>

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_RATE_LIMITING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_CACHING=true

# Code Execution
CODE_EXECUTION_TIMEOUT=5000
CODE_EXECUTION_MEMORY_LIMIT=262144

# Logging
LOG_LEVEL=info
```

---

## 🚀 Deployment

### Production Build

```bash
# Install production dependencies only
npm ci --production

# Set environment to production
export NODE_ENV=production

# Start server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/codeforge
      - POSTGRES_URI=postgresql://postgres:5432/codeforge
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - postgres
      - redis
  
  mongo:
    image: mongo:latest
    volumes:
      - mongo-data:/data/db
  
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: codeforge
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  postgres-data:
  redis-data:
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name codeforge-api -i max

# Monitor
pm2 monit

# Logs
pm2 logs codeforge-api

# Restart
pm2 restart codeforge-api

# Save process list
pm2 save

# Startup script
pm2 startup
```

---

## 🧪 Testing

### Unit Tests

```javascript
// tests/controllers/auth.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('Auth Controller', () => {
  test('POST /api/v1/auth/register - should create new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty('_id');
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Watch mode
npm run test:watch
```

---

## 📚 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "errors": [] // Validation errors
  }
}
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection
mongosh "mongodb://localhost:27017"
```

### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Should return: PONG

# Flush all data (development only)
redis-cli FLUSHALL
```

### Code Execution Issues
```bash
# Ensure compilers are installed
g++ --version
python3 --version
node --version
java --version

# Check temp directory permissions
ls -la temp/
chmod 755 temp/
```

---

## 📄 License

MIT License

---

## 👥 Contributors

- **Backend Lead**: [Your Name]
- **Database Architect**: [Name]
- **DevOps Engineer**: [Name]

---

**Made with ❤️ by the CodeForge Team**