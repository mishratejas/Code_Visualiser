import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls including login, register, logout, etc.
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username (unique)
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password (min 6 characters)
 * @param {string} userData.name - Full name
 * @returns {Promise} - Response with user data and token
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    // Store token and user data if registration successful
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user with credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email or username
 * @param {string} credentials.password - Password
 * @returns {Promise} - Response with user data and token
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Store token and user data if login successful
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout current user
 * Clears local storage and makes API call to invalidate token
 * @returns {Promise} - Response confirming logout
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage even if API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Get current user data
 * Fetches fresh user data from the server
 * @returns {Promise} - Response with current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    
    // Update stored user data
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify user's authentication token
 * @returns {Promise<boolean>} - True if token is valid, false otherwise
 */
export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.success === true;
  } catch (error) {
    // If token verification fails, clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

/**
 * Refresh authentication token
 * Gets a new token using the current refresh token
 * @returns {Promise} - Response with new token
 */
export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  } catch (error) {
    // If refresh fails, user needs to login again
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};

/**
 * Request password reset
 * Sends password reset email to user
 * @param {string} email - User's email address
 * @returns {Promise} - Response confirming email sent
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Reset password with token
 * @param {Object} data - Reset password data
 * @param {string} data.token - Password reset token from email
 * @param {string} data.password - New password
 * @returns {Promise} - Response confirming password reset
 */
export const resetPassword = async (data) => {
  try {
    const response = await api.post('/auth/reset-password', data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password
 * Requires current password for verification
 * @param {Object} data - Password change data
 * @param {string} data.currentPassword - Current password
 * @param {string} data.newPassword - New password
 * @returns {Promise} - Response confirming password change
 */
export const changePassword = async (data) => {
  try {
    const response = await api.put('/auth/change-password', data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is authenticated
 * Checks for token in localStorage
 * @returns {boolean} - True if user has token, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get stored user data from localStorage
 * @returns {Object|null} - User object or null if not found
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

/**
 * Get stored token from localStorage
 * @returns {string|null} - Token string or null if not found
 */
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

// Export all functions as default object as well
const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  verifyToken,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  isAuthenticated,
  getStoredUser,
  getStoredToken,
};

export default authService;