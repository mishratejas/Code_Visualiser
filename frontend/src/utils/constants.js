export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const PROBLEM_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
  RUNTIME_ERROR: 'runtime_error',
  COMPILATION_ERROR: 'compilation_error',
  MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
};

export const LANGUAGE_CONFIG = {
  javascript: {
    name: 'JavaScript',
    extension: '.js',
    monacoLanguage: 'javascript',
    defaultCode: `function solve(input) {
    // Write your solution here
    return input;
}`,
  },
  python: {
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    defaultCode: `def solve(input):
    # Write your solution here
    return input`,
  },
  java: {
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    defaultCode: `public class Solution {
    public Object solve(Object input) {
        // Write your solution here
        return input;
    }
}`,
  },
  cpp: {
    name: 'C++',
    extension: '.cpp',
    monacoLanguage: 'cpp',
    defaultCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& input) {
        // Write your solution here
        return input;
    }
};`,
  },
  c: {
    name: 'C',
    extension: '.c',
    monacoLanguage: 'c',
    defaultCode: `#include <stdio.h>
#include <stdlib.h>

int* solve(int* input, int inputSize, int* returnSize) {
    // Write your solution here
    *returnSize = inputSize;
    return input;
}`,
  },
};

export const CONTEST_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  ENDED: 'ended',
};

export const CONTEST_TYPES = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  SPECIAL: 'special',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROBLEMS: '/problems',
  PROBLEM: '/problem/:id',
  SUBMIT: '/submit/:problemId',
  SUBMISSIONS: '/submissions',
  LEADERBOARD: '/leaderboard',
  CONTESTS: '/contests',
  CONTEST: '/contest/:id',
  PROFILE: '/profile/:username',
  SETTINGS: '/settings',
  ABOUT: '/about',
  HELP: '/help',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  EDITOR_SETTINGS: 'editor_settings',
  RECENT_PROBLEMS: 'recent_problems',
};

export const AUTH_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOADING: 'loading',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PROBLEMS_PER_PAGE: 20,
  SUBMISSIONS_PER_PAGE: 15,
  LEADERBOARD_PER_PAGE: 50,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  SUBMISSION_SUCCESS: 'Solution submitted successfully!',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully!',
};

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PROBLEM_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  CONTEST_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
};

export const TIME_LIMITS = {
  MIN: 1000, // 1 second
  MAX: 10000, // 10 seconds
  DEFAULT: 2000, // 2 seconds
};

export const MEMORY_LIMITS = {
  MIN: 16, // 16 MB
  MAX: 1024, // 1 GB
  DEFAULT: 256, // 256 MB
};

export const RANK_COLORS = {
  1: { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-600' },
  2: { bg: 'from-gray-300 to-gray-500', text: 'text-gray-600' },
  3: { bg: 'from-orange-400 to-orange-600', text: 'text-orange-600' },
  4: { bg: 'from-blue-500 to-purple-600', text: 'text-blue-600' },
};

export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Solve your first problem',
    icon: '🥇',
    points: 10,
  },
  {
    id: 'quick_learner',
    title: 'Quick Learner',
    description: 'Solve 10 problems in a week',
    icon: '⚡',
    points: 25,
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Maintain 30-day streak',
    icon: '🏃‍♂️',
    points: 50,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: '10 consecutive accepted submissions',
    icon: '🎯',
    points: 30,
  },
  {
    id: 'contest_champion',
    title: 'Contest Champion',
    description: 'Top 10 in a contest',
    icon: '🏆',
    points: 100,
  },
  {
    id: 'problem_solver',
    title: 'Problem Solver',
    description: 'Solve 100 problems',
    icon: '💯',
    points: 100,
  },
];

export const DIFFICULTY_COLORS = {
  easy: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-800',
    gradient: 'from-green-400 to-green-600',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-200 dark:border-yellow-800',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  hard: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-400 to-red-600',
  },
};

export const MONACO_THEMES = [
  { value: 'vs-dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'hc-black', label: 'High Contrast' },
  { value: 'vs', label: 'Visual Studio' },
];