import api from './api';

export const problemService = {
  getAllProblems: async (params = {}) => {
    try {
      const response = await api.get('/problems', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getProblemById: async (id) => {
    try {
      const response = await api.get(`/problems/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getProblemBySlug: async (slug) => {
    try {
      const response = await api.get(`/problems/slug/${slug}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  searchProblems: async (query) => {
    try {
      const response = await api.get('/problems/search', { params: { q: query } });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getProblemsByDifficulty: async (difficulty, params = {}) => {
    try {
      const response = await api.get(`/problems/difficulty/${difficulty}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTagStats: async () => {
    try {
      const response = await api.get('/problems/tags/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  createProblem: async (problemData) => {
    try {
      const response = await api.post('/problems', problemData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateProblem: async (id, problemData) => {
    try {
      const response = await api.put(`/problems/${id}`, problemData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteProblem: async (id) => {
    try {
      const response = await api.delete(`/problems/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  toggleBookmark: async (problemId) => {
    try {
      const response = await api.post(`/users/bookmarks/${problemId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getBookmarks: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/bookmarks`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  runTestCases: async (data) => {
    try {
      const response = await api.post('/problems/test-run', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getSimilarProblems: async (problemId) => {
    try {
      const response = await api.get(`/problems/${problemId}/similar`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getProblemStats: async (problemId) => {
    try {
      const response = await api.get(`/problems/${problemId}/stats`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default problemService;