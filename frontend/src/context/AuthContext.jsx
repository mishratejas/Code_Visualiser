import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const token     = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser || savedUser === 'undefined' || savedUser === 'null') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }

      const userData = JSON.parse(savedUser);
      if (userData && typeof userData === 'object' && (userData._id || userData.id)) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);

      // Handle { data: { user, token } } or { user, token }
      const userData = response?.data?.user || response?.user;
      const token    = response?.data?.token || response?.token;

      if (!userData || !token) throw new Error('Invalid response from server');
      if (!userData._id && !userData.id) throw new Error('User data is incomplete');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Login failed';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      const registeredUser = response?.data?.user || response?.user;
      const token          = response?.data?.token || response?.token;

      if (!registeredUser || !token) throw new Error('Invalid response from server');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      setIsAuthenticated(true);
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      checkAuth,
      // Exposed for GoogleAuthSuccess page
      setUser,
      setIsAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthConsumer = AuthContext.Consumer;
export default AuthContext;