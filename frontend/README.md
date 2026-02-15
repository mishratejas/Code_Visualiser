# 🎨 CodeForge Frontend

> Modern React application for competitive programming platform with AI-powered features

![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Latest-purple?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/Monaco-Editor-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Components Guide](#-components-guide)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Features
- 🔐 **Authentication System** - JWT-based secure authentication
- 💻 **Code Editor** - Monaco Editor with syntax highlighting
- 🎯 **Problem Solving** - Browse and solve coding problems
- 🏆 **Contests** - Create and participate in live contests
- 📊 **Leaderboard** - Real-time global and contest rankings
- 📝 **Submissions** - Track your code submission history
- 👤 **User Profiles** - Detailed stats and achievements

### AI-Powered Features
- 🤖 **AI Code Analysis** - Real-time code quality feedback
- 💡 **Smart Hints** - Progressive problem-solving hints
- 🎓 **AI Interview** - Mock technical interview practice
- 📚 **Learning Paths** - Personalized learning recommendations
- 🔍 **Plagiarism Detection** - Contest integrity checks
- 🎯 **Similar Problems** - Smart problem recommendations

### User Experience
- 🎨 **Modern UI** - Sleek dark theme with Tailwind CSS
- 📱 **Responsive Design** - Works on all devices
- 🔔 **Real-time Notifications** - Socket.io integration
- ⚡ **Fast Performance** - Lazy loading and code splitting
- 🌐 **Multi-language Support** - JavaScript, Python, Java, C++, C

---

## 🛠️ Tech Stack

### Core
- **React 19.2.0** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM 7.12.0** - Client-side routing
- **Tailwind CSS 4.0** - Utility-first CSS framework

### UI Components
- **Ant Design 4.24.16** - Component library
- **Lucide React** - Icon library
- **React Icons** - Additional icons
- **Recharts** - Chart library

### Code Editor
- **Monaco Editor** - VSCode-like code editor
- **PrismJS** - Syntax highlighting

### State Management
- **Context API** - Auth, Theme, Editor contexts
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management

### Data Fetching & Real-time
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Toast notifications

### Utilities
- **date-fns** - Date manipulation
- **clsx** - Conditional classnames
- **React Markdown** - Markdown rendering

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── animations/        # Animation components
│   │   ├── BinaryBackground.jsx
│   │   └── index.js
│   ├── components/        # Reusable components
│   │   ├── ai/           # AI-related components
│   │   │   ├── CodeAnalysisPanel.jsx
│   │   │   ├── HintPanel.jsx           # NEW
│   │   │   ├── InterviewAssistant.jsx
│   │   │   ├── PlagiarismReport.jsx
│   │   │   ├── RecommendationsPanel.jsx
│   │   │   └── SolutionViewer.jsx      # NEW
│   │   ├── common/       # Shared components
│   │   │   ├── Alert.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx              # MODIFIED
│   │   │   ├── ImageUpload.jsx         # NEW
│   │   │   ├── Loader.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StreakDisplay.jsx       # NEW
│   │   ├── contests/     # Contest components
│   │   │   ├── ContestCard.jsx
│   │   │   ├── ContestList.jsx
│   │   │   └── ContestTimer.jsx
│   │   ├── editor/       # Code editor components
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── EditorToolbar.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   └── ThemeSelector.jsx
│   │   ├── leaderboard/  # Leaderboard components
│   │   │   ├── Filters.jsx
│   │   │   ├── LeaderboardCard.jsx
│   │   │   └── LeaderboardTable.jsx
│   │   ├── problems/     # Problem components
│   │   │   ├── ProblemCard.jsx
│   │   │   ├── ProblemDetail.jsx
│   │   │   ├── ProblemList.jsx
│   │   │   └── TestCases.jsx
│   │   ├── profile/      # Profile components
│   │   │   └── AchievementCard.jsx     # NEW
│   │   └── submissions/  # Submission components
│   │       ├── SubmissionItem.jsx
│   │       ├── SubmissionList.jsx
│   │       └── SubmissionStats.jsx
│   ├── context/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── EditorContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   └── useLocalStorage.js
│   ├── pages/            # Route pages
│   │   ├── Achievements.jsx            # MODIFIED
│   │   ├── AIDashboard.jsx
│   │   ├── AddProblemsToContest.jsx
│   │   ├── ContestDetail.jsx
│   │   ├── ContestProblem.jsx
│   │   ├── Contests.jsx
│   │   ├── CreateContest.jsx
│   │   ├── Dashboard.jsx               # MODIFIED
│   │   ├── FavoriteProblems.jsx
│   │   ├── Help.jsx
│   │   ├── Home.jsx
│   │   ├── InterviewPage.jsx           # MODIFIED
│   │   ├── Leaderboard.jsx
│   │   ├── LearningPath.jsx
│   │   ├── LiveContest.jsx
│   │   ├── Login.jsx
│   │   ├── Notifications.jsx           # MODIFIED
│   │   ├── PlagiarismDashboard.jsx     # NEW
│   │   ├── PracticePage.jsx
│   │   ├── Problem.jsx                 # MODIFIED
│   │   ├── ProblemCategories.jsx
│   │   ├── Problems.jsx
│   │   ├── Profile.jsx                 # MODIFIED
│   │   ├── Register.jsx
│   │   ├── Settings.jsx                # MODIFIED
│   │   ├── Submissions.jsx
│   │   └── Submit.jsx
│   ├── services/         # API services
│   │   ├── ai.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── contests.js
│   │   ├── interview.js
│   │   ├── leaderboard.js
│   │   ├── notifications.js            # NEW
│   │   ├── problems.js
│   │   ├── socket.js
│   │   └── submissions.js
│   ├── utils/            # Utility functions
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── helpers.js
│   │   ├── imageUpload.js              # NEW
│   │   └── validators.js
│   ├── App.jsx           # Main app component
│   ├── index.css         # Global styles
│   └── main.jsx          # Entry point
├── .env.example          # Environment variables template
├── .gitignore
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML template
├── package.json          # Dependencies
├── README.md             # This file
├── tailwind.config.js    # Tailwind configuration
└── vite.config.js        # Vite configuration
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_CONTESTS=true
VITE_ENABLE_PLAGIARISM=true

# Analytics (Optional)
VITE_GA_TRACKING_ID=
VITE_SENTRY_DSN=

# Development
VITE_DEBUG_MODE=false
```

---

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format with Prettier (if configured)

# Testing (to be added)
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
```

---

## 🧩 Components Guide

### AI Components

#### CodeAnalysisPanel
```jsx
import CodeAnalysisPanel from './components/ai/CodeAnalysisPanel';

<CodeAnalysisPanel 
  code={code}
  language="javascript"
  analysis={aiAnalysis}
  loading={false}
/>
```

#### HintPanel (NEW)
```jsx
import HintPanel from './components/ai/HintPanel';

<HintPanel 
  problemId="problem123"
  currentCode={code}
  onHintReceived={(hint) => console.log(hint)}
/>
```

### Common Components

#### Header (FIXED - No Duplicate Logo)
```jsx
import Header from './components/common/Header';

<Header />
```

#### ImageUpload (NEW)
```jsx
import ImageUpload from './components/common/ImageUpload';

<ImageUpload
  currentImage={user.avatar}
  onImageChange={(url) => updateAvatar(url)}
  cloudinaryFolder="avatars"
/>
```

#### StreakDisplay (NEW)
```jsx
import StreakDisplay from './components/common/StreakDisplay';

<StreakDisplay 
  currentStreak={user.streak.current}
  longestStreak={user.streak.longest}
  lastActiveDate={user.streak.lastActiveDate}
/>
```

---

## 🔄 State Management

### Auth Context
```javascript
import { useAuth } from './context/AuthContext';

const { user, login, logout, isAuthenticated, loading } = useAuth();
```

### Theme Context
```javascript
import { useTheme } from './context/ThemeContext';

const { theme, toggleTheme } = useTheme();
```

### Editor Context
```javascript
import { useEditor } from './context/EditorContext';

const { 
  language, setLanguage,
  theme, setTheme,
  code, setCode 
} = useEditor();
```

---

## 🌐 API Integration

### API Service Structure

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Using API Services

```javascript
// Example: Get user profile
import { usersApi } from './services/api';

const profile = await usersApi.getProfile(username);

// Example: Submit code
import { submissionsApi } from './services/api';

const result = await submissionsApi.create({
  problemId,
  code,
  language
});
```

### Real-time with Socket.io

```javascript
import { socket } from './services/socket';

// Connect
socket.connect();

// Listen for events
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Join contest room
socket.emit('join-contest', { contestId });

// Disconnect
socket.disconnect();
```

---

## 🎨 Styling Guide

### Tailwind CSS Conventions

```jsx
// Use consistent spacing
className="p-4 m-2"

// Responsive design
className="hidden md:block lg:flex"

// Dark mode (default dark theme)
className="bg-gray-900 text-white"

// Interactive states
className="hover:bg-blue-600 active:scale-95 transition-all"
```

### Custom Color Palette

```javascript
// tailwind.config.js
colors: {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  dark: '#1f2937',
  darker: '#111827'
}
```

---

## 📦 Build & Deployment

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Output: dist/
# ├── assets/
# │   ├── index-[hash].js
# │   ├── index-[hash].css
# │   └── ...
# └── index.html
```

### Deployment Options

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build command: npm run build
# Publish directory: dist
```

#### Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🧪 Testing (To Be Implemented)

### Unit Tests with Vitest

```javascript
// Example test
import { render, screen } from '@testing-library/react';
import Button from './components/common/Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests with Playwright

```javascript
// Example E2E test
test('user can solve a problem', async ({ page }) => {
  await page.goto('/problems');
  await page.click('text=Two Sum');
  await page.fill('.monaco-editor', 'solution code');
  await page.click('text=Submit');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add new feature"
```

3. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

### Code Style

- Follow ESLint configuration
- Use functional components and hooks
- Implement proper error handling
- Add JSDoc comments for complex functions
- Write meaningful commit messages (Conventional Commits)

### Commit Message Format

```
feat: add new feature
fix: fix bug in component
docs: update README
style: format code
refactor: refactor component
test: add tests
chore: update dependencies
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Port 5173 already in use**
```bash
# Use different port
npm run dev -- --port 3000
```

**Issue: Build fails**
```bash
# Check Node version
node --version  # Should be >= 18

# Clear build cache
rm -rf dist .vite
npm run build
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Frontend Lead**: [Your Name]
- **UI/UX Designer**: [Designer Name]
- **Contributors**: [List of contributors]

---

## 🔗 Links

- **Live Demo**: https://codeforge.example.com
- **API Documentation**: https://api.codeforge.example.com/docs
- **Design System**: https://design.codeforge.example.com
- **Status Page**: https://status.codeforge.example.com

---

**Made with ❤️ by the CodeForge Team**