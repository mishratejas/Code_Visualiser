// frontend/src/services/contests.js
import api from './api.js';

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

export default contestsApi;