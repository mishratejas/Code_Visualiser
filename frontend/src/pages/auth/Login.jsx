import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCode, FiSun, FiMoon } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  .replace('/api/v1', '');

const Login = () => {
  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const { login }                       = useAuth();
  const { toggleTheme, isDark }         = useTheme();
  const navigate                        = useNavigate();
  const location                        = useLocation();
  // Only restore `from` if it's a generic route (not a user-specific profile page),
  // so a different user logging in doesn't land on the previous user's profile.
  const rawFrom = location.state?.from?.pathname || '/dashboard';
  const userSpecificRoutes = ['/profile/', '/settings'];
  const from = userSpecificRoutes.some(r => rawFrom.startsWith(r)) ? '/dashboard' : rawFrom;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ ...formData, rememberMe });
      navigate(from, { replace: true });
    } catch { /* toast already shown in AuthContext */ }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
  };

  const bg    = isDark ? 'bg-gray-950'   : 'bg-gray-50';
  const txt   = isDark ? 'text-white'    : 'text-gray-900';
  const sub   = isDark ? 'text-gray-400' : 'text-gray-600';
  const card  = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const inp   = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                       : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';
  const lbl   = isDark ? 'text-gray-300' : 'text-gray-700';
  const divCl = isDark ? 'border-gray-700': 'border-gray-300';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${bg}`}>
      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className={`fixed top-20 right-4 z-50 p-2.5 rounded-full ${
          isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                 : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
        } transition-all`}>
        {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 flex items-center justify-center">
              <FiCode className="h-5 w-5 text-white" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${txt}`}>Welcome Back</h2>
          <p className={`mt-1 text-sm ${sub}`}>Sign in to your CodeForge account</p>
        </div>

        <div className={`${card} border rounded-xl p-6 shadow-lg`}>
          {/* Google */}
          <button onClick={handleGoogleLogin}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border ${divCl} rounded-lg ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
            } transition mb-4`}>
            <FcGoogle className="h-5 w-5" />
            <span className={`text-sm font-medium ${sub}`}>Continue with Google</span>
          </button>

          <div className="relative mb-4">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${divCl}`} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`px-3 ${isDark ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'}`}>
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-xs font-medium ${lbl} mb-1.5`}>
                Email address
              </label>
              <div className="relative">
                <FiMail className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${sub}`} />
                <input id="email" name="email" type="email" autoComplete="email" required
                  value={formData.email} onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 ${inp} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-xs font-medium ${lbl} mb-1.5`}>
                Password
              </label>
              <div className="relative">
                <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${sub}`} />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={formData.password} onChange={handleChange}
                  className={`w-full pl-9 pr-10 py-2.5 ${inp} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${sub}`}>
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 text-xs ${sub} cursor-pointer`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-xs text-rose-500 hover:text-rose-400">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} size="medium" fullWidth
              className="py-2.5 text-sm bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className={`mt-4 text-center text-xs ${sub}`}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-rose-500 hover:text-rose-400">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;