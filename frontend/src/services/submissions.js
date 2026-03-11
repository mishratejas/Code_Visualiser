import api from './api';
import { VERDICT } from '../utils/constants';

export const submissionService = {
  /**
   * Submit a solution
   */
  submitSolution: async (data) => {
    try {
      const response = await api.post('/submissions', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Run code without submission
   */
  runCode: async (data) => {
    try {
      const response = await api.post('/submissions/run', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's submissions with filters
   */
  getSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/submissions', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get submission by ID
   */
  getSubmissionById: async (submissionId) => {
    try {
      const response = await api.get(`/submissions/${submissionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's solved problems
   */
  getUserSolved: async () => {
    try {
      const response = await api.get('/submissions/user/solved');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get recent submissions
   */
  getRecentSubmissions: async (limit = 10) => {
    try {
      const response = await api.get('/submissions/recent', { params: { limit } });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get problem submissions
   */
  getProblemSubmissions: async (problemId, params = {}) => {
    try {
      const response = await api.get(`/submissions/problem/${problemId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get default code template
   */
  getDefaultCodeTemplate: (problemTitle, language) => {
    const templates = {
      javascript: `/**
 * @param {any} args
 * @return {any}
 */
function ${problemTitle?.replace(/\s+/g, '')?.toLowerCase() || 'solution'}(...args) {
    // Write your code here
    
}`,
      python: `class Solution:
    def ${problemTitle?.replace(/\s+/g, '_')?.toLowerCase() || 'solution'}(self, *args):
        # Write your code here
        pass`,
      java: `class Solution {
    public Object ${problemTitle?.replace(/\s+/g, '')?.toLowerCase() || 'solution'}(Object... args) {
        // Write your code here
        return null;
    }
}`,
      cpp: `class Solution {
public:
    auto ${problemTitle?.replace(/\s+/g, '')?.toLowerCase() || 'solution'}(/* params */) {
        // Write your code here
        
    }
};`,
      c: `#include <stdio.h>

int ${problemTitle?.replace(/\s+/g, '_')?.toLowerCase() || 'solution'}(/* params */) {
    // Write your code here
    return 0;
}`
    };
    
    return templates[language] || templates.javascript;
  },

  /**
   * Validate code
   */
  validateCode: (code, language) => {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Code cannot be empty' };
    }

    if (code.trim().length < 5) {
      return { valid: false, error: 'Code is too short' };
    }

    return { valid: true, error: '' };
  },

  /**
   * Get verdict info
   */
  getVerdictInfo: (verdict) => {
    const verdictMap = {
      [VERDICT.ACCEPTED]: { label: 'Accepted', color: 'text-green-500', bg: 'bg-green-500/10' },
      [VERDICT.WRONG_ANSWER]: { label: 'Wrong Answer', color: 'text-red-500', bg: 'bg-red-500/10' },
      [VERDICT.TIME_LIMIT_EXCEEDED]: { label: 'Time Limit Exceeded', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      [VERDICT.RUNTIME_ERROR]: { label: 'Runtime Error', color: 'text-red-500', bg: 'bg-red-500/10' },
      [VERDICT.COMPILATION_ERROR]: { label: 'Compilation Error', color: 'text-gray-500', bg: 'bg-gray-500/10' },
      [VERDICT.MEMORY_LIMIT_EXCEEDED]: { label: 'Memory Limit Exceeded', color: 'text-purple-500', bg: 'bg-purple-500/10' },
      [VERDICT.PENDING]: { label: 'Pending', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    };
    
    return verdictMap[verdict] || { label: verdict || 'Unknown', color: 'text-gray-500', bg: 'bg-gray-500/10' };
  }
};

export default submissionService;