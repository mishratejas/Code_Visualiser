# CodeForge — Backend

Node.js + Express REST API server. Handles all business logic, user authentication, contest management, real-time communication via Socket.IO, and proxies AI requests to the Python AI service.

> **Note:** The backend folder in this repository contains a copy of the frontend source (same React/Vite codebase) used as a reference snapshot. The actual Node.js server code is a separate backend project. This README documents the expected backend architecture based on the API contracts consumed by the frontend.

---

## Expected Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Cache / Queues | Redis + Bull |
| Authentication | JWT (Bearer) + Google OAuth 2.0 |
| Real-time | Socket.IO v4 |
| Scheduler | node-cron |
| File storage | Multer (avatar uploads) |
| AI proxy | HTTP forwarding to FastAPI service :8001 |

---

## Server Structure (expected)

```
backend/
├── src/
│   ├── index.js                   # Express + Socket.IO server bootstrap
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   ├── redis.js               # Redis client
│   │   └── passport.js            # Google OAuth strategy
│   │
│   ├── models/
│   │   ├── User.js                # User document schema
│   │   ├── Problem.js             # Problem schema
│   │   ├── Submission.js          # Submission + verdict schema
│   │   ├── Contest.js             # Contest schema
│   │   ├── Notification.js        # Notification schema
│   │   ├── Discussion.js          # Forum post schema
│   │   ├── Group.js               # Group/organisation schema
│   │   └── Achievement.js         # Achievement definition schema
│   │
│   ├── routes/
│   │   ├── auth.js                # /api/v1/auth
│   │   ├── problems.js            # /api/v1/problems
│   │   ├── submissions.js         # /api/v1/submissions
│   │   ├── contests.js            # /api/v1/contests
│   │   ├── users.js               # /api/v1/users
│   │   ├── notifications.js       # /api/v1/notifications
│   │   ├── leaderboard.js         # /api/v1/leaderboard
│   │   ├── achievements.js        # /api/v1/achievements
│   │   ├── discuss.js             # /api/v1/discuss
│   │   ├── groups.js              # /api/v1/groups
│   │   ├── ai.js                  # /api/v1/ai   (proxies to :8001)
│   │   └── plagiarism.js          # /api/v1/plagiarism (proxies to :8001)
│   │
│   ├── controllers/               # Route handler logic (one per route file)
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   ├── isAdmin.js             # Admin role guard
│   │   ├── rateLimiter.js         # express-rate-limit setup
│   │   └── upload.js              # Multer configuration
│   │
│   ├── services/
│   │   ├── judgeService.js        # Code execution + verdict assignment
│   │   ├── ratingService.js       # Contest rating calculation + application
│   │   ├── notificationService.js # Create + push notifications via Socket.IO
│   │   └── aiProxy.js             # HTTP proxy to AI service
│   │
│   └── sockets/
│       └── index.js               # Socket.IO event handlers
│
├── .env
└── package.json
```

---

## Getting Started

```bash
npm install
cp .env.example .env    # fill in all required values
npm run dev             # nodemon, hot reload on :8000
npm start               # production
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=8000

# Database
MONGO_URI=mongodb://localhost:27017/codeforge

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Client (for CORS + OAuth redirect)
CLIENT_URL=http://localhost:5173
```

---

## REST API Reference

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Email + password login. Returns `{ user, token }` |
| POST | `/register` | No | Create account. Returns `{ user, token }` |
| POST | `/logout` | Yes | Invalidates server-side refresh token |
| GET | `/me` | Yes | Returns current user document (includes `contestBannedUntil`, `contestBanReason`) |
| POST | `/refresh` | No | Refreshes JWT using refresh token cookie |
| GET | `/google` | No | Initiates Google OAuth flow |
| GET | `/google/callback` | No | OAuth redirect handler — redirects to frontend with `?token=` |

### Users — `/api/v1/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:id` | Yes | Get user by ID or username. Returns user document |
| PATCH | `/:id` | Yes | Update profile fields (bio, country, links) |
| GET | `/:id/stats` | Yes | Detailed solving statistics, streaks, rating |
| GET | `/:id/rating-history` | Yes | Array of contest rating changes. Each entry: `{ contestTitle, newRating, ratingChange, cheated, date }` |
| POST | `/avatar` | Yes | Upload avatar image (multipart/form-data) |
| GET | `/me/bookmarks` | Yes | User's bookmarked problems |
| POST | `/bookmarks/:problemId` | Yes | Toggle bookmark on a problem |

### Problems — `/api/v1/problems`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List problems. Query: `page`, `limit`, `difficulty`, `tags`, `search`, `category` |
| GET | `/:id` | Yes | Problem by ID (includes test cases) |
| GET | `/slug/:slug` | Yes | Problem by URL slug |
| GET | `/categories` | Yes | All category names with problem counts |
| GET | `/favorites` | Yes | Current user's favourited problems |
| POST | `/:id/favorite` | Yes | Toggle favourite |
| POST | `/` | Admin | Create problem |
| GET | `/tags/stats` | Yes | Tag distribution across all problems |

### Submissions — `/api/v1/submissions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Yes | Submit code. Body: `{ problemId, code, language }`. Queued via Bull. Returns verdict asynchronously via Socket.IO |
| POST | `/run` | Yes | Run against sample cases (no verdict stored). Returns test results immediately |
| GET | `/` | Yes | User's submission history. Query: `page`, `limit`, `problemId`, `verdict`, `language` |
| GET | `/:id` | Yes | Single submission detail |
| GET | `/problem/:problemId` | Yes | All user submissions for a specific problem |
| GET | `/recent` | Yes | Last 10 submissions (for Dashboard) |
| GET | `/user/solved` | Yes | List of problem IDs solved by current user |

### Contests — `/api/v1/contests`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | All contests. Query: `status` (upcoming/ongoing/ended), `page`, `limit` |
| GET | `/:id` | Yes | Contest detail + problem list |
| POST | `/` | Admin | Create contest |
| POST | `/:id/register` | Yes | Register current user for contest |
| GET | `/:id/leaderboard` | Yes | Live rankings (also pushed via Socket.IO) |
| PATCH | `/:id/end` | Admin | End contest and trigger rating calculation |

### Notifications — `/api/v1/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | List notifications. Query: `page`, `limit`, `unread=true`, `read=true` |
| GET | `/unread-count` | Yes | Returns `{ count: N }` |
| PATCH | `/:id/read` | Yes | Mark single notification as read |
| PATCH | `/read-all` | Yes | Mark all notifications as read |
| DELETE | `/:id` | Yes | Delete a notification |

### Leaderboard — `/api/v1/leaderboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Global user rankings. Query: `page`, `limit`, `search` |
| GET | `/contest/:id` | Yes | Contest-specific leaderboard |

### Achievements — `/api/v1/achievements`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | All possible achievements |
| GET | `/user` | Yes | Current user's earned achievements |
| GET | `/stats` | Yes | User achievement progress stats |

### Discuss — `/api/v1/discuss`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | All posts. Query: `page`, `limit`, `tag`, `problemId`, `search` |
| GET | `/:id` | Yes | Single post with comments |
| POST | `/` | Yes | Create post |
| PUT | `/:id` | Yes | Update post (author only) |
| DELETE | `/:id` | Yes | Delete post (author or admin) |
| POST | `/:id/vote` | Yes | Upvote/downvote post |
| POST | `/:id/comments` | Yes | Add comment |
| POST | `/:id/comments/:cid/vote` | Yes | Vote on comment |
| GET | `/stats` | Yes | Forum-wide statistics |

### Plagiarism (proxied to AI service) — `/api/v1/plagiarism`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/check` | Admin | Run AI plagiarism detection across all contest submissions |
| POST | `/compare` | Admin | Direct comparison of exactly two submissions |
| GET | `/contest/:contestId` | Admin | Retrieve existing plagiarism report for a contest |
| POST | `/review` | Admin | Submit admin verdict for a suspicious pair |

#### Review Payload (full)
```json
{
  "contestId": "...",
  "submission1Id": "...",
  "submission2Id": "...",
  "verdict": "plagiarism_confirmed",
  "notes": "Optional admin note",
  "banUsers": true,
  "banDurationDays": 7,
  "ratingPenalty": 200,
  "user1Id": "...",
  "user2Id": "..."
}
```

When `verdict === 'plagiarism_confirmed' && banUsers === true`, the controller should:

```js
const banUntil = new Date(Date.now() + banDurationDays * 86_400_000);
await User.updateMany(
  { _id: { $in: [user1Id, user2Id] } },
  {
    contestBannedUntil: banUntil,
    contestBanReason: `Plagiarism confirmed in contest ${contestId}`,
    $inc: { 'stats.rating': -ratingPenalty },
    $push: {
      ratingHistory: {
        contestId,
        ratingChange: -ratingPenalty,
        cheated: true,
        date: new Date(),
      },
    },
  }
);
```

---

## WebSocket (Socket.IO)

The Socket.IO server runs on the same port as Express (`:8000`).

### Rooms

| Room name | Purpose |
|---|---|
| `user-{userId}` | Personal notification channel for each user |
| `contest-{contestId}` | Live leaderboard for contest participants |

### Events (Client → Server)

| Event | Payload | Action |
|---|---|---|
| `join_user_room` | `{ userId }` | Subscribe to personal notification room |
| `join_contest` | `{ contestId, userId }` | Join contest leaderboard room |
| `leave_contest` | `{ contestId }` | Leave contest room |

### Events (Server → Client)

| Event | Payload | When |
|---|---|---|
| `notification` | notification object | New notification created for a user |
| `leaderboard_update` | updated rankings array | Submission judged in an active contest |
| `contest_status` | `{ status, contestId }` | Contest starts or ends |
| `new_submission` | submission object | Any submission judged (admin monitoring) |

### Sending a notification

```js
// In notificationService.js
const notification = await Notification.create({ userId, title, message, type });
io.to(`user-${userId}`).emit('notification', notification);
```

---

## User Document Schema (key fields)

```js
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,           // bcrypt hashed
  role: 'user' | 'admin',
  avatar: String,             // URL
  profile: {
    name, bio, country, github, linkedin, website
  },
  stats: {
    rating: Number,           // default 1500
    rank: Number,
    totalProblemsSolved: Number,
    easySolved, mediumSolved, hardSolved: Number,
    streak, maxStreak: Number,
    contestsParticipated, contestsWon: Number,
    bestContestRank: Number,
    totalSubmissions, acceptedSubmissions: Number,
    score: Number,
  },
  ratingHistory: [{
    contestId: ObjectId,
    contestTitle: String,
    newRating: Number,
    ratingChange: Number,
    cheated: Boolean,
    date: Date,
  }],
  contestBannedUntil: Date,   // null if not banned
  contestBanReason: String,
  createdAt: Date,
}
```

---

## Rating Calculation

Ratings are updated automatically when a contest ends. The calculation is based on:
- Final rank in the contest
- Current rating vs. expected performance
- Number of problems solved and speed of solving

The `ratingService.js` applies all changes in bulk using `User.bulkWrite()`. No manual "Apply Ratings" button exists — it runs automatically.

---

## Code Judge Flow

1. `POST /submissions` — validates submission, creates a `Submission` document with `verdict: 'pending'`
2. Adds job to Bull queue (`submission-queue`)
3. Worker picks up the job, executes code in a sandboxed environment (Docker or VM)
4. Worker updates `Submission.verdict` with the result
5. Worker emits `new_submission` via Socket.IO to the user's room and any active contest room
6. If in a contest, worker also recalculates the live leaderboard and emits `leaderboard_update`