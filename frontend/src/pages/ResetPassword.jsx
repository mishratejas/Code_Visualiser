import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiLock, FiEye, FiEyeOff, FiCode, FiSun, FiMoon, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Uppercase letter',       ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter',       ok: /[a-z]/.test(password) },
    { label: 'Number',                 ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < score ? colors[score - 1] : 'bg-gray-600'
            }`} />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strength: <span className={`font-medium ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-orange-400' : score === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
          {labels[score - 1] || 'Weak'}
        </span>
      </p>
      <ul className="space-y-0.5">
        {checks.map(c => (
          <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-green-400' : 'text-gray-500'}`}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ResetPassword = () => {
  const { token }             = useParams();
  const navigate              = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const bg   = isDark ? 'bg-gray-950'   : 'bg-gray-50';
  const txt  = isDark ? 'text-white'    : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';
  const card = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const inp  = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';
  const lbl  = isDark ? 'text-gray-300' : 'text-gray-700';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Reset link is invalid or has expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${bg}`}>
        <div className="w-full max-w-md text-center">
          <div className={`${card} border rounded-xl p-8 shadow-lg`}>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <FiCheckCircle className="h-7 w-7 text-green-500" />
              </div>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${txt}`}>Password Reset!</h2>
            <p className={`text-sm mb-6 ${sub}`}>
              Your password has been changed successfully. Redirecting you to login…
            </p>
            <Link to="/login"
              className="inline-block py-2.5 px-6 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 transition-all">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${bg}`}>
        <div className={`${card} border rounded-xl p-8 shadow-lg text-center max-w-md w-full`}>
          <p className={`text-sm mb-4 ${sub}`}>This reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="text-rose-500 hover:text-rose-400 text-sm font-medium">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

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
          <h2 className={`text-2xl font-bold ${txt}`}>Set New Password</h2>
          <p className={`mt-1 text-sm ${sub}`}>Create a strong new password for your account</p>
        </div>

        <div className={`${card} border rounded-xl p-6 shadow-lg`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label htmlFor="password" className={`block text-xs font-medium ${lbl} mb-1.5`}>
                New Password
              </label>
              <div className="relative">
                <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${sub}`} />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 ${inp} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${sub}`}>
                  {showPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className={`block text-xs font-medium ${lbl} mb-1.5`}>
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${sub}`} />
                <input
                  id="confirm"
                  type={showConf ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 ${inp} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm ${
                    confirm && confirm !== password ? 'border-red-500' : ''
                  }`}
                />
                <button type="button" onClick={() => setShowConf(!showConf)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${sub}`}>
                  {showConf ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (confirm && confirm !== password)}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <p className={`mt-4 text-center text-xs ${sub}`}>
            <Link to="/login" className="font-medium text-rose-500 hover:text-rose-400">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;