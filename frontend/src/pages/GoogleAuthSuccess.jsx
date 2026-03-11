import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Loader from '../components/common/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const GoogleAuthSuccess = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();    // need these exposed

  useEffect(() => {
    handleGoogleSuccess();
  }, []);

  const handleGoogleSuccess = async () => {
    try {
      // Backend redirects to /auth/google-success?token=...&user=...  (query params, NOT hash)
      const params = new URLSearchParams(location.search);
      const token  = params.get('token');
      const userB64 = params.get('user');

      if (!token) {
        console.error('No token in Google OAuth redirect');
        toast.error('Google login failed — no token received');
        navigate('/login');
        return;
      }

      // Save token immediately
      localStorage.setItem('token', token);

      // Try to decode user from base64 param first (avoids extra network call)
      let userData = null;
      if (userB64) {
        try {
          userData = JSON.parse(atob(userB64));
        } catch (e) {
          console.warn('Could not decode user param, will fetch from API');
        }
      }

      // Fallback: fetch from /auth/me using the new token
      if (!userData) {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        // API returns { success, data: { user } } or { data: { user } }
        userData = json?.data?.user || json?.user || json?.data;
      }

      if (!userData || !userData._id) {
        throw new Error('Could not retrieve user data');
      }

      // Persist and update AuthContext
      localStorage.setItem('user', JSON.stringify(userData));

      // Update AuthContext state directly so PrivateRoute lets us in immediately
      if (typeof setUser === 'function')             setUser(userData);
      if (typeof setIsAuthenticated === 'function')  setIsAuthenticated(true);

      toast.success(`Welcome, ${userData.username}! 🎉`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google auth error:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Google login failed — please try again');
      navigate('/login');
    }
  };

  return <Loader text="Completing Google sign-in…" fullScreen />;
};

export default GoogleAuthSuccess;