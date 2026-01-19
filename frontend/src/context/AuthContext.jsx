import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('AuthProvider mounted, checking auth...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('Auth check - Token exists:', !!token);
      console.log('Auth check - Saved user:', savedUser);
      
      // Clear invalid data first
      if (savedUser === 'undefined' || savedUser === 'null') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log('Cleared invalid user data');
        return;
      }
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('Parsed user data:', userData);
          
          if (userData && typeof userData === 'object') {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('Invalid user data structure');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('No valid token or saved user found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      console.log('Auth check complete, loading set to false');
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('Login attempt with:', credentials.email);
      const response = await authApi.login(credentials);
      console.log('Full login response:', response);
      
      // Debug: Log the exact response structure
      console.log('Response keys:', Object.keys(response));
      console.log('Response data:', response.data);
      console.log('Response user:', response.user);
      
      // Extract user and token from response
      let userData, token;
      
      // Check different possible response structures
      if (response.data && response.data.user) {
        // Structure: { data: { user: {...}, token: '...' } }
        userData = response.data.user;
        token = response.data.token;
      } else if (response.user) {
        // Structure: { user: {...}, token: '...' }
        userData = response.user;
        token = response.token;
      } else if (response) {
        // Response might be the user object directly
        userData = response;
        token = response.token;
      }
      
      console.log('Extracted user:', userData);
      console.log('Extracted token:', token);
      
      if (!userData || !token) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      
      // Validate user object has required fields
      if (!userData._id && !userData.id) {
        console.error('User object missing ID:', userData);
        throw new Error('User data is incomplete');
      }
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      console.log('Register response:', response);
      
      // Extract user from response structure
      const registeredUser = response.data?.user || response.user;
      const token = response.data?.token || response.token;
      
      if (!registeredUser || !token) {
        console.error('Invalid register response:', response);
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      setIsAuthenticated(true);
      
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    console.log('Updating user:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  console.log('AuthContext value:', { user, loading, isAuthenticated });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthConsumer = AuthContext.Consumer;
export default AuthContext;