import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiMail, FiCode, FiArrowLeft, FiSun, FiMoon, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [devInfo, setDevInfo]         = useState(null); // { previewUrl?, resetUrl?, note? }
  const { toggleTheme, isDark } = useTheme();

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
    if (!email) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      // In dev mode the backend may return Ethereal preview URL or direct reset link
      if (response?.data) {
        setDevInfo(response.data);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${bg}`}>
        <div className="w-full max-w-md text-center">
          <div className={`${card} border rounded-xl p-8 shadow-lg`}>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <FiCheckCircle className="h-7 w-7 text-green-500" />
              </div>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${txt}`}>Check your inbox</h2>
            <p className={`text-sm mb-6 ${sub}`}>
              If <span className="font-medium text-rose-400">{email}</span> is registered,
              you'll receive a reset link within a few minutes. Check your spam folder too.
            </p>

            {devInfo && (devInfo.emailPreviewUrl || devInfo.resetUrl) && (
              <div className={`mb-6 p-3 rounded-lg border text-xs text-left ${
                isDark ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-300 text-yellow-800'
              }`}>
                <p className="font-semibold mb-1">🛠 Dev mode</p>
                {devInfo.emailPreviewUrl ? (
                  <>
                    <p className="mb-1">Email sent via Ethereal. Open the preview to see it:</p>
                    <a href={devInfo.emailPreviewUrl} target="_blank" rel="noreferrer"
                      className="underline break-all font-medium">
                      View email in Ethereal ↗
                    </a>
                  </>
                ) : (
                  <>
                    <p className="mb-1">{devInfo.note || 'Use this link to test the reset flow:'}</p>
                    <a href={devInfo.resetUrl} className="underline break-all">{devInfo.resetUrl}</a>
                  </>
                )}
              </div>
            )}

            <Link to="/login"
              className="inline-flex items-center gap-2 text-sm text-rose-500 hover:text-rose-400 font-medium">
              <FiArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
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
          <h2 className={`text-2xl font-bold ${txt}`}>Forgot Password</h2>
          <p className={`mt-1 text-sm ${sub}`}>Enter your email and we'll send you a reset link</p>
        </div>

        <div className={`${card} border rounded-xl p-6 shadow-lg`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-xs font-medium ${lbl} mb-1.5`}>
                Email address
              </label>
              <div className="relative">
                <FiMail className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${sub}`} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-9 pr-4 py-2.5 ${inp} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className={`mt-4 text-center text-xs ${sub}`}>
            Remembered it?{' '}
            <Link to="/login" className="font-medium text-rose-500 hover:text-rose-400">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;