// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiCode, FiAward, FiTrendingUp, FiUsers, FiSun, FiMoon } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { validateEmail, validateUsername, validatePassword, validatePasswordConfirmation } from '../../utils/validators';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validatePasswordConfirmation(formData.password, formData.confirmPassword),
    };

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      if (message.includes('username')) {
        setErrors(prev => ({ ...prev, username: message }));
      } else if (message.includes('email')) {
        setErrors(prev => ({ ...prev, email: message }));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
    window.location.href = `${base}/api/v1/auth/google`;
  };

  const passwordRequirements = [
    { label: 'At least 6 characters', met: formData.password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /\d/.test(formData.password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const cardBgClass = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const inputBgClass = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const inputLabelClass = isDark ? 'text-gray-300' : 'text-gray-700';
  const dividerClass = isDark ? 'border-gray-700' : 'border-gray-300';
  const featureCardClass = isDark 
    ? 'bg-gradient-to-br from-rose-900/80 to-red-900/80 border-rose-500/20 text-white' 
    : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200 text-gray-900';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgClass} py-8 px-4`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-20 right-4 z-50 p-3 rounded-full ${
          isDark 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
        } transition-all duration-300`}
        aria-label="Toggle theme"
      >
        {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
      </button>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 flex items-center justify-center">
              <FiCode className="h-5 w-5 text-white" />
            </div>
            <span className={`text-2xl font-bold ${textClass}`}>
              CodeForge
            </span>
          </div>
          <h1 className={`text-2xl font-bold ${textClass} mb-1`}>
            Start Your Coding Journey
          </h1>
          <p className={`text-sm ${subTextClass}`}>
            Join developers improving their skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <Card className={`lg:col-span-1 ${cardBgClass} border p-6`}>
            <div className="mb-4">
              <h2 className={`text-xl font-bold ${textClass} mb-1`}>
                Create Account
              </h2>
              <p className={`text-xs ${subTextClass}`}>
                Fill in your details to get started
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleRegister}
              className={`w-full flex items-center justify-center px-4 py-2.5 border ${dividerClass} rounded-lg ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              } transition mb-4`}
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              <span className={`text-sm font-medium ${subTextClass}`}>
                Sign up with Google
              </span>
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${dividerClass}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-3 ${isDark ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'}`}>
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className={`block text-xs font-medium ${inputLabelClass} mb-1.5`}>
                  Username
                </label>
                <div className="relative">
                  <FiUser className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`} />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 ${inputBgClass} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm ${errors.username ? 'border-red-500' : ''}`}
                    placeholder="john_doe"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={`block text-xs font-medium ${inputLabelClass} mb-1.5`}>
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 ${inputBgClass} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={`block text-xs font-medium ${inputLabelClass} mb-1.5`}>
                  Password
                </label>
                <div className="relative">
                  <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-10 py-2.5 ${inputBgClass} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'}`}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}

                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <div className={`mr-1.5 h-3 w-3 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                        {req.met && <FiCheck className="h-2 w-2 text-white" />}
                      </div>
                      <span className={req.met ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className={`block text-xs font-medium ${inputLabelClass} mb-1.5`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-10 py-2.5 ${inputBgClass} border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'}`}
                  >
                    {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="agreeToTerms" className={`text-xs ${subTextClass}`}>
                    I agree to the{' '}
                    <Link to="/terms" className={isDark ? 'text-rose-400 hover:underline' : 'text-rose-600 hover:underline'}>
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className={isDark ? 'text-rose-400 hover:underline' : 'text-rose-600 hover:underline'}>
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 text-xs text-red-500">{errors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="medium"
                className="py-2.5 text-sm bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className={`text-xs ${subTextClass}`}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className={`font-medium ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-500'}`}
                >
                  Sign in
                </Link>
              </p>
              <p className={`text-xs mt-1 ${subTextClass}`}>
                Organizing a contest?{' '}
                <Link
                  to="/register/organizer"
                  className={`font-medium ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-500'}`}
                >
                  Register as an organizer
                </Link>
              </p>
            </div>
          </Card>

          {/* Right Column - Features */}
          <div className="lg:col-span-1">
            <div className={`${featureCardClass} border rounded-xl p-6 h-full`}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Why Join CodeForge?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-8 w-8 rounded-lg ${
                      isDark ? 'bg-white/10' : 'bg-rose-100'
                    } flex items-center justify-center`}>
                      <FiCode className={`h-4 w-4 ${isDark ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Real Coding Problems</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>
                      Solve 500+ problems from easy to expert level.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-8 w-8 rounded-lg ${
                      isDark ? 'bg-white/10' : 'bg-rose-100'
                    } flex items-center justify-center`}>
                      <FiUsers className={`h-4 w-4 ${isDark ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Learning</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>
                      Join discussions and learn from peers worldwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-8 w-8 rounded-lg ${
                      isDark ? 'bg-white/10' : 'bg-rose-100'
                    } flex items-center justify-center`}>
                      <FiAward className={`h-4 w-4 ${isDark ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Contests</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>
                      Compete and climb the global leaderboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-8 w-8 rounded-lg ${
                      isDark ? 'bg-white/10' : 'bg-rose-100'
                    } flex items-center justify-center`}>
                      <FiTrendingUp className={`h-4 w-4 ${isDark ? 'text-white' : 'text-rose-600'}`} />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Track Progress</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>
                      Visualize your improvement with analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/20' : 'border-rose-200'}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>10K+</div>
                    <div className={`text-xs ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>Active Coders</div>
                  </div>
                  <div>
                    <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>500+</div>
                    <div className={`text-xs ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>Problems</div>
                  </div>
                  <div>
                    <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>150+</div>
                    <div className={`text-xs ${isDark ? 'text-rose-100' : 'text-gray-600'}`}>Contests</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;