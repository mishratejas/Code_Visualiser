import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verify: () => api.get('/auth/verify'),
};

export const problemsApi = {
  getAll: (params) => api.get('/problems', { params }),
  getById: (id) => api.get(`/problems/${id}`),
  create: (problemData) => api.post('/problems', problemData),
  update: (id, problemData) => api.put(`/problems/${id}`, problemData),
  delete: (id) => api.delete(`/problems/${id}`),
  runTests: (data) => api.post('/problems/run', data),
};

export const submissionsApi = {
  getAll: (params) => api.get('/submissions', { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  create: (submissionData) => api.post('/submissions', submissionData),
  getUserSubmissions: (userId) => api.get(`/submissions/user/${userId}`),
  getProblemSubmissions: (problemId) => api.get(`/submissions/problem/${problemId}`),
};

export const contestsApi = {
  getAll: (params) => api.get('/contests', { params }),
  getById: (id) => api.get(`/contests/${id}`),
  create: (contestData) => api.post('/contests', contestData),
  update: (id, contestData) => api.put(`/contests/${id}`, contestData),
  delete: (id) => api.delete(`/contests/${id}`),
  register: (id) => api.post(`/contests/${id}/register`),
  submit: (contestId, submissionData) => api.post(`/contests/${contestId}/submit`, submissionData),
  getLeaderboard: (contestId) => api.get(`/contests/${contestId}/leaderboard`),
};

export const leaderboardApi = {
  getGlobal: (params) => api.get('/leaderboard', { params }),
  getContest: (contestId) => api.get(`/leaderboard/contest/${contestId}`),
};

export const usersApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updateAvatar: (formData) => api.put('/users/avatar', formData),
  getStats: (userId) => api.get(`/users/${userId}/stats`),
};

export default api;