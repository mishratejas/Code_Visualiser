import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiCode, FiAward, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { validateEmail, validateUsername, validatePassword, validatePasswordConfirmation } from '../utils/validators';

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error for this field
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
    toast.success('Google registration coming soon!');
  };

  const passwordRequirements = [
    { label: 'At least 6 characters', met: formData.password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /\d/.test(formData.password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center">
              <FiCode className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">
              CodeForge
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Start Your Coding Journey
          </h1>
          <p className="text-lg text-gray-400">
            Join developers improving their skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <Card className="lg:col-span-1 bg-gray-900 border border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-400">
                Fill in your details to get started
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition mb-6"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              <span className="text-gray-300 font-medium">
                Sign up with Google
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white ${errors.username ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="john_doe"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white ${errors.password ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-rose-400"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}

                {/* Password Requirements */}
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500' : 'bg-gray-700'}`}>
                        {req.met && <FiCheck className="h-3 w-3 text-white" />}
                      </div>
                      <span className={req.met ? 'text-green-400' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-rose-400"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
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
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-700 rounded bg-gray-800"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="text-gray-300">
                    I agree to the{' '}
                    <Link to="/terms" className="text-rose-400 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-rose-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 text-red-400">{errors.agreeToTerms}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="large"
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-rose-400 hover:text-rose-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Card>

          {/* Right Column - Features */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-rose-900/80 to-red-900/80 border border-rose-500/20 rounded-2xl p-8 text-white h-full">
              <h3 className="text-2xl font-bold mb-6">Why Join CodeForge?</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FiCode className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg">Real Coding Problems</h4>
                    <p className="text-rose-100 mt-1">
                      Solve 500+ problems from easy to expert level with detailed solutions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FiUsers className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg">Community Learning</h4>
                    <p className="text-rose-100 mt-1">
                      Join discussions, share solutions, and learn from peers worldwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FiAward className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg">Weekly Contests</h4>
                    <p className="text-rose-100 mt-1">
                      Compete in coding contests and climb the global leaderboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FiTrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-lg">Track Progress</h4>
                    <p className="text-rose-100 mt-1">
                      Visualize your improvement with detailed statistics and analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">10K+</div>
                    <div className="text-sm text-rose-100">Active Coders</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-rose-100">Problems</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">150+</div>
                    <div className="text-sm text-rose-100">Contests</div>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-8 bg-white/10 rounded-xl p-4 border border-rose-500/10">
                <p className="italic text-rose-100">
                  "CodeForge helped me land my dream job. The interview preparation resources are unmatched!"
                </p>
                <div className="mt-3 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-500 to-red-500 flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">Sarah Chen</div>
                    <div className="text-sm text-rose-200">Software Engineer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="underline text-gray-400 hover:text-rose-400">Terms</Link>,{' '}
            <Link to="/privacy" className="underline text-gray-400 hover:text-rose-400">Privacy Policy</Link>, and{' '}
            <Link to="/cookies" className="underline text-gray-400 hover:text-rose-400">Cookie Policy</Link>.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Need help? <Link to="/contact" className="underline text-gray-400 hover:text-rose-400">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;