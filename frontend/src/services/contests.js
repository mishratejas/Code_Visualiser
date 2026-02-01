import api from './api';

const contestsApi = {
  // Get all contests
  getAll: (params = {}) => api.get('/contests', { params }),
  
  // Get single contest by ID
  getById: (id) => api.get(`/contests/${id}`),
  
  // Create new contest
  create: (contestData) => api.post('/contests', contestData),
  
  // Update contest
  update: (id, contestData) => api.put(`/contests/${id}`, contestData),
  
  // Delete contest
  delete: (id) => api.delete(`/contests/${id}`),
  
  // Register for contest
  register: (id, password = null) => {
    const data = password ? { password } : {};
    return api.post(`/contests/${id}/register`, data);
  },
  
  // Submit solution during contest
  submit: (contestId, submissionData) => 
    api.post(`/contests/${contestId}/submit`, submissionData),
  
  // Get contest leaderboard
  getLeaderboard: (contestId) => api.get(`/contests/${contestId}/leaderboard`),
  
  // Get contest problems
  getProblems: (contestId) => api.get(`/contests/${contestId}/problems`),
  
  // Get user's submissions for contest
  getMySubmissions: (contestId) => api.get(`/contests/${contestId}/submissions/me`),
  
  // Get contest statistics
  getStats: (contestId) => api.get(`/contests/${contestId}/stats`)
};

export default contestsApi;