import api from './api';

/**
 * Leaderboard Service
 * Handles all leaderboard-related API calls including global and contest leaderboards
 */

/**
 * Get global leaderboard
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Results per page (default: 50, max: 100)
 * @param {string} params.timeframe - Timeframe filter ('all', 'weekly', 'monthly')
 * @returns {Promise} - Response with leaderboard data
 */
export const getGlobalLeaderboard = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      timeframe = 'all'
    } = params;

    const response = await api.get('/leaderboard', {
      params: {
        page,
        limit: Math.min(limit, 100), // Ensure limit doesn't exceed 100
        timeframe
      }
    });

    return response;
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    throw error;
  }
};

/**
 * Get contest-specific leaderboard
 * @param {string} contestId - Contest ID
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Results limit (default: 100)
 * @returns {Promise} - Response with contest leaderboard data
 */
export const getContestLeaderboard = async (contestId, params = {}) => {
  try {
    const { limit = 100 } = params;

    const response = await api.get(`/contests/${contestId}/leaderboard`, {
      params: { limit }
    });

    return response;
  } catch (error) {
    console.error(`Error fetching contest ${contestId} leaderboard:`, error);
    throw error;
  }
};

/**
 * Get user's rank on global leaderboard
 * @param {string} userId - User ID
 * @returns {Promise} - Response with user's rank data
 */
export const getUserRank = async (userId) => {
  try {
    const response = await api.get(`/leaderboard/user/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching rank for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user's rank in specific contest
 * @param {string} contestId - Contest ID
 * @param {string} userId - User ID
 * @returns {Promise} - Response with user's contest rank
 */
export const getUserContestRank = async (contestId, userId) => {
  try {
    const response = await api.get(`/contests/${contestId}/leaderboard/user/${userId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching contest rank for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get top performers (podium)
 * @param {number} limit - Number of top performers to fetch (default: 3)
 * @returns {Promise} - Response with top performers data
 */
export const getTopPerformers = async (limit = 3) => {
  try {
    const response = await api.get('/leaderboard', {
      params: { page: 1, limit }
    });
    return response;
  } catch (error) {
    console.error('Error fetching top performers:', error);
    throw error;
  }
};

/**
 * Get leaderboard statistics
 * Overall stats about the leaderboard system
 * @returns {Promise} - Response with leaderboard statistics
 */
export const getLeaderboardStats = async () => {
  try {
    const response = await api.get('/leaderboard/stats');
    return response;
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    throw error;
  }
};

/**
 * Get leaderboard filtered by country
 * @param {string} country - Country code (ISO 3166-1 alpha-2)
 * @param {Object} params - Query parameters
 * @returns {Promise} - Response with filtered leaderboard
 */
export const getLeaderboardByCountry = async (country, params = {}) => {
  try {
    const { page = 1, limit = 50 } = params;

    const response = await api.get('/leaderboard', {
      params: {
        page,
        limit,
        country
      }
    });

    return response;
  } catch (error) {
    console.error(`Error fetching leaderboard for country ${country}:`, error);
    throw error;
  }
};

/**
 * Get leaderboard filtered by organization/institution
 * @param {string} organization - Organization/institution name
 * @param {Object} params - Query parameters
 * @returns {Promise} - Response with filtered leaderboard
 */
export const getLeaderboardByOrganization = async (organization, params = {}) => {
  try {
    const { page = 1, limit = 50 } = params;

    const response = await api.get('/leaderboard', {
      params: {
        page,
        limit,
        organization
      }
    });

    return response;
  } catch (error) {
    console.error(`Error fetching leaderboard for organization ${organization}:`, error);
    throw error;
  }
};

/**
 * Get user's position relative to other users
 * Shows users around the current user's rank
 * @param {string} userId - User ID
 * @param {number} range - Number of users above and below (default: 5)
 * @returns {Promise} - Response with surrounding users data
 */
export const getUserSurroundings = async (userId, range = 5) => {
  try {
    const response = await api.get(`/leaderboard/user/${userId}/surroundings`, {
      params: { range }
    });
    return response;
  } catch (error) {
    console.error(`Error fetching surroundings for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get historical ranking data for a user
 * Shows how user's rank has changed over time
 * @param {string} userId - User ID
 * @param {string} period - Time period ('week', 'month', 'year', 'all')
 * @returns {Promise} - Response with rank history data
 */
export const getUserRankHistory = async (userId, period = 'month') => {
  try {
    const response = await api.get(`/leaderboard/user/${userId}/history`, {
      params: { period }
    });
    return response;
  } catch (error) {
    console.error(`Error fetching rank history for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Export leaderboard data
 * Downloads leaderboard as CSV or JSON
 * @param {string} format - Export format ('csv' or 'json')
 * @param {Object} params - Filter parameters
 * @returns {Promise} - Response with downloadable data
 */
export const exportLeaderboard = async (format = 'csv', params = {}) => {
  try {
    const response = await api.get('/leaderboard/export', {
      params: { ...params, format },
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error exporting leaderboard:', error);
    throw error;
  }
};

// Export all functions as default object as well
const leaderboardService = {
  getGlobalLeaderboard,
  getContestLeaderboard,
  getUserRank,
  getUserContestRank,
  getTopPerformers,
  getLeaderboardStats,
  getLeaderboardByCountry,
  getLeaderboardByOrganization,
  getUserSurroundings,
  getUserRankHistory,
  exportLeaderboard,
};

export default leaderboardService;