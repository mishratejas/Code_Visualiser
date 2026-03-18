/**
 * api.js — Axios instance + all API helpers
 *
 * All AI calls go through the Node backend (/api/v1/ai/*)
 * which proxies to the FastAPI AI service (:8001).
 * Frontend never calls :8001 directly.
 *
 * Architecture:
 *   Frontend → Node Backend :8000/api/v1/ai/* → AI Service :8001/api/v1/*
 */
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap data, handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 429) toast.error('Too many requests. Please try again later.');
    else if (error.response?.status >= 500) {
      // Don't toast for "no report found" — that's a normal state, not a server error
      const msg = error.response?.data?.message || '';
      if (!msg.toLowerCase().includes('no plagiarism report')) {
        toast.error('Server error. Please try again later.');
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data)  => api.post('/auth/login', data),
  register: (data)  => api.post('/auth/register', data),
  logout:   ()      => api.post('/auth/logout'),
  me:       ()      => api.get('/auth/me'),
  refresh:  ()      => api.post('/auth/refresh'),
};

// ── Problems ─────────────────────────────────────────────────────────────────
export const problemsApi = {
  getAll:       (params) => api.get('/problems', { params }),
  getById:      (id)     => api.get(`/problems/${id}`),
  getBySlug:    (slug)   => api.get(`/problems/slug/${slug}`),
  getCategories:()       => api.get('/problems/categories'),
  getFavorites: ()       => api.get('/problems/favorites'),
  toggleFav:   (id)      => api.post(`/problems/${id}/favorite`),
  create:      (data)    => api.post('/problems', data),
  getTagStats: ()         => api.get('/problems/tags/stats'),
};

// ── Submissions ───────────────────────────────────────────────────────────────
export const submissionsApi = {
  submit:            (data)        => api.post('/submissions', data),
  runCode:           (data)        => api.post('/submissions/run', data),
  getAll:            (params)      => api.get('/submissions', { params }),
  getById:           (id)          => api.get(`/submissions/${id}`),
  getForProblem:     (problemId)   => api.get(`/submissions/problem/${problemId}`),
  getRecent:         ()            => api.get('/submissions/recent'),
  getUserSolved:     ()            => api.get('/submissions/user/solved'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile:   (id)    => api.get(`/users/${id}`),
  updateProfile:(id, d) => api.patch(`/users/${id}`, d),
  getStats:     (id)    => api.get(`/users/${id}/stats`),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getBookmarks:  ()      => api.get('/users/me/bookmarks'),
  toggleBookmark:(problemId) => api.post(`/users/bookmarks/${problemId}`),

  // Contest ban status — read from the user's own profile
  getMyBanStatus: () => api.get('/auth/me'),
};

// ── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboardApi = {
  getGlobal: (params) => api.get('/leaderboard', { params }),
  getContest:(id)     => api.get(`/leaderboard/contest/${id}`),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:    (params) => api.get('/notifications', { params }),
  markRead:  (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead:()      => api.patch('/notifications/read-all'),
  getUnreadCount:()   => api.get('/notifications/unread-count'),
};

// ── Achievements ─────────────────────────────────────────────────────────────
export const achievementsApi = {
  getAll:   ()   => api.get('/achievements'),
  getMine:  ()   => api.get('/achievements/user'),
  getStats: ()   => api.get('/achievements/stats'),
};

// ── Discuss ───────────────────────────────────────────────────────────────────
export const discussApi = {
  getAll:      (params)  => api.get('/discuss', { params }),
  getById:     (id)      => api.get(`/discuss/${id}`),
  create:      (data)    => api.post('/discuss', data),
  update:      (id,data) => api.put(`/discuss/${id}`, data),
  delete:      (id)      => api.delete(`/discuss/${id}`),
  vote:        (id)      => api.post(`/discuss/${id}/vote`),
  addComment:  (id,data) => api.post(`/discuss/${id}/comments`, data),
  voteComment: (id,cid)  => api.post(`/discuss/${id}/comments/${cid}/vote`),
  getStats:    ()        => api.get('/discuss/stats'),
};

// ── Contests ─────────────────────────────────────────────────────────────────
export const contestsApi = {
  getAll:    (params) => api.get('/contests', { params }),
  getById:   (id)     => api.get(`/contests/${id}`),
  create:    (data)   => api.post('/contests', data),
  register:  (id)     => api.post(`/contests/${id}/register`),
  getLeaderboard:(id) => api.get(`/contests/${id}/leaderboard`),
};

// ── AI Service (proxied through Node backend) ─────────────────────────────────
export const aiApi = {
  /**
   * Full code analysis: complexity + quality + anti-patterns + suggestions
   * Node backend proxies this to AI service :8001/api/v1/analyze/code
   */
  analyze: (data) => api.post('/ai/analyze', data),

  /**
   * Quick structural-only analysis (no Gemini, instant response)
   */
  quickComplexity: (data) => api.post('/ai/complexity', data),

  /**
   * Plagiarism check for a contest
   */
  checkPlagiarism: (contestId) => api.post('/plagiarism/check', { contestId }),

  /**
   * Compare two submissions
   */
  comparePlagiarism: (sub1Id, sub2Id) => api.post('/plagiarism/compare', { submission1Id: sub1Id, submission2Id: sub2Id }),

  /**
   * Get plagiarism report for a contest (admin)
   */
  getPlagiarismReport: (contestId) => api.get(`/plagiarism/contest/${contestId}`),

  /**
   * Review a suspicious pair (admin)
   * verdict: 'plagiarism_confirmed' | 'false_positive' | 'common_solution'
   * When verdict = plagiarism_confirmed, also pass:
   *   banUsers: true, banDurationDays: 7, user1Id, user2Id, ratingPenalty: 200
   */
  reviewPlagiarismPair: (data) => api.post('/plagiarism/review', data),

  /**
   * Get AI interview question
   */
  getInterviewQuestion: (params) => api.post('/ai/interview/question', params),

  /**
   * Evaluate interview solution
   */
  evaluateInterview: (data) => api.post('/ai/interview/evaluate', data),

  /**
   * Get hint for interview
   */
  getHint: (data) => api.post('/ai/interview/hint', data),

  /**
   * Get personalized problem recommendations
   */
  getRecommendations: (data) => api.post('/ai/recommendations', data),

  /**
   * Get learning path
   */
  getLearningPath: (data) => api.post('/ai/learning-path', data),
};

export default api;