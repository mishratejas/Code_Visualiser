import api from './api';
import { SUBMISSION_STATUS, PAGINATION, LANGUAGE_CONFIG } from '../utils/constants';

/**
 * Comprehensive submission service with all required methods
 */
export const submissionService = {
  /**
   * Submit a solution
   */
  submitSolution: async (data) => {
    try {
      const response = await api.post('/submissions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit solution' };
    }
  },

  /**
   * Run code without submission
   */
  runCode: async (data) => {
    try {
      const response = await api.post('/submissions/run', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to run code' };
    }
  },

  /**
   * Get user's submissions with filters
   */
  getSubmissions: async (params = {}) => {
    try {
      const defaultParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        limit: params.limit || PAGINATION.SUBMISSIONS_PER_PAGE,
        sort: params.sort || 'newest',
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const response = await api.get('/submissions', {
        params: { ...defaultParams, ...params },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch submissions' };
    }
  },

  /**
   * Get submission by ID
   */
  getSubmissionById: async (submissionId) => {
    try {
      const response = await api.get(`/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch submission' };
    }
  },

  /**
   * Get user's solved problems
   */
  getSolvedProblems: async () => {
    try {
      const response = await api.get('/submissions/user/solved');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch solved problems' };
    }
  },

  /**
   * Get submission statistics
   */
  getSubmissionStats: async () => {
    try {
      const response = await api.get('/submissions/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  /**
   * Get submission history for a specific problem
   */
  getProblemSubmissions: async (problemId, params = {}) => {
    try {
      const response = await api.get(`/submissions/problem/${problemId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch problem submissions' };
    }
  },

  /**
   * Batch run multiple test cases
   */
  runTestCases: async (problemId, code, language, testCases = []) => {
    try {
      const response = await api.post('/submissions/test', {
        problemId,
        code,
        language,
        testCases,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to run test cases' };
    }
  },

  /**
   * Get execution results with polling
   */
  getExecutionResult: async (executionId, pollInterval = 1000, maxAttempts = 30) => {
    try {
      const poll = async (attempt = 0) => {
        const response = await api.get(`/submissions/execution/${executionId}`);
        const data = response.data;

        if (data.status === 'completed' || attempt >= maxAttempts) {
          return data;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return poll(attempt + 1);
      };

      return await poll();
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get execution result' };
    }
  },

  /**
   * Get leaderboard submissions
   */
  getLeaderboardSubmissions: async (contestId = null, params = {}) => {
    try {
      const url = contestId 
        ? `/submissions/contest/${contestId}/leaderboard`
        : '/submissions/leaderboard';
      
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leaderboard' };
    }
  },

  /**
   * Export submissions
   */
  exportSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/submissions/export', {
        params,
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submissions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export submissions' };
    }
  },

  /**
   * Delete submission
   */
  deleteSubmission: async (submissionId) => {
    try {
      const response = await api.delete(`/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete submission' };
    }
  },

  /**
   * Get submission analytics
   */
  getAnalytics: async (timeRange = 'month') => {
    try {
      const response = await api.get(`/submissions/analytics/${timeRange}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch analytics' };
    }
  },

  /**
   * Get language-specific submission stats
   */
  getLanguageStats: async () => {
    try {
      const response = await api.get('/submissions/stats/languages');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch language stats' };
    }
  },

  /**
   * Get difficulty-specific submission stats
   */
  getDifficultyStats: async () => {
    try {
      const response = await api.get('/submissions/stats/difficulty');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch difficulty stats' };
    }
  },

  /**
   * Get daily submission streak
   */
  getStreak: async () => {
    try {
      const response = await api.get('/submissions/streak');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch streak' };
    }
  },

  /**
   * Compare two submissions
   */
  compareSubmissions: async (submissionId1, submissionId2) => {
    try {
      const response = await api.get(`/submissions/compare/${submissionId1}/${submissionId2}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to compare submissions' };
    }
  },

  /**
   * Get submission verdict with real-time updates
   */
  getVerdictWithUpdates: async (submissionId, onUpdate = () => {}) => {
    try {
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      const poll = async () => {
        const response = await api.get(`/submissions/${submissionId}/status`);
        const data = response.data;
        
        onUpdate(data);
        
        if (data.status === SUBMISSION_STATUS.PENDING || data.status === SUBMISSION_STATUS.RUNNING) {
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000);
          }
          return;
        }
        
        return data;
      };

      return await poll();
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get verdict' };
    }
  },

  /**
   * Get default code template for language
   */
  getDefaultCodeTemplate: (problemTitle, language) => {
    const template = LANGUAGE_CONFIG[language]?.defaultCode || '';
    
    // Replace function name with sanitized problem title
    const functionName = problemTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    
    return template.replace(/solve/g, functionName);
  },

  /**
   * Validate code before submission
   */
  validateCode: (code, language) => {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Code cannot be empty' };
    }

    if (code.trim().length < 10) {
      return { valid: false, error: 'Code is too short' };
    }

    // Language-specific validations
    switch (language) {
      case 'python':
        if (!code.includes('def ') && !code.includes('class ')) {
          return { valid: false, error: 'Python code must contain a function or class' };
        }
        break;
      case 'javascript':
        if (!code.includes('function') && !code.includes('=>') && !code.includes('const ') && !code.includes('let ') && !code.includes('class ')) {
          return { valid: false, error: 'JavaScript code must contain a function or class' };
        }
        break;
      case 'java':
        if (!code.includes('public class') && !code.includes('class')) {
          return { valid: false, error: 'Java code must contain a class' };
        }
        break;
    }

    return { valid: true, error: '' };
  },
};

export default submissionService;