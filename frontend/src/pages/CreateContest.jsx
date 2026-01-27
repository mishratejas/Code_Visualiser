import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiLock, FiUnlock, FiUsers, FiTag, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateContest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contestType: 'practice',
    difficulty: 'medium',
    startTime: '',
    endTime: '',
    durationMinutes: 120,
    maxParticipants: '',
    isPrivate: false,
    registrationPassword: '',
    tags: [],
    rules: '',
    prizes: ''
  });

  const [errors, setErrors] = useState({});

  const contestTypes = [
    { value: 'practice', label: 'Practice Contest' },
    { value: 'weekly', label: 'Weekly Challenge' },
    { value: 'monthly', label: 'Monthly Contest' },
    { value: 'rated', label: 'Rated Contest' },
    { value: 'unrated', label: 'Unrated Contest' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'hard', label: 'Hard', color: 'red' }
  ];

  const availableTags = [
    'Beginner Friendly', 'Advanced', 'Algorithms', 'Data Structures',
    'Dynamic Programming', 'Graph Theory', 'Mathematics', 'Competitive'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Contest title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Contest description is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const now = new Date();

      if (start < now) {
        newErrors.startTime = 'Start time must be in the future';
      }

      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      const duration = (end - start) / (1000 * 60); // minutes
      if (duration < 30) {
        newErrors.endTime = 'Contest must be at least 30 minutes long';
      }
    }

    if (formData.isPrivate && !formData.registrationPassword.trim()) {
      newErrors.registrationPassword = 'Password is required for private contests';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to create a contest');
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const contestData = {
        ...formData,
        durationMinutes: Math.round(
          (new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60)
        ),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        prizes: formData.prizes.split(',').map(p => p.trim()).filter(Boolean),
        tags: formData.tags
      };

      const response = await api.post('/contests', contestData);

      if (response.data?.success || response.status === 201) {
        toast.success('Contest created successfully!');
        const contestId = response.data?.contest?._id || response.data?.contest?.id;
        if (contestId) {
          navigate(`/contests/${contestId}`);
        } else {
          navigate('/contests');
        }
      }
    } catch (error) {
      console.error('Failed to create contest:', error);
      toast.error(error.response?.data?.message || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Create New Contest</h1>
        <p className="text-blue-100">
          Set up a coding contest for the community to participate in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contest Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Weekly Coding Challenge #42"
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe what this contest is about..."
              className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {errors.description}
              </p>
            )}
          </div>

          {/* Type and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contest Type *
              </label>
              <select
                name="contestType"
                value={formData.contestType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {contestTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level *
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiCalendar className="mr-2" /> Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {formData.startTime && formData.endTime && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center">
                <FiClock className="mr-2" />
                Duration: {Math.round((new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60))} minutes
              </p>
            </div>
          )}
        </div>

        {/* Participation Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiUsers className="mr-2" /> Participation Settings
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Participants (Optional)
            </label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
              min="1"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
            />
          </div>

          {/* Private Contest Toggle */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="isPrivate"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="isPrivate" className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center">
                {formData.isPrivate ? <FiLock className="mr-2" /> : <FiUnlock className="mr-2" />}
                Private Contest
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Participants will need a password to register
              </p>
            </div>
          </div>

          {formData.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Registration Password *
              </label>
              <input
                type="text"
                name="registrationPassword"
                value={formData.registrationPassword}
                onChange={handleChange}
                placeholder="Enter password for private contest"
                className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${
                  errors.registrationPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white`}
              />
              {errors.registrationPassword && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.registrationPassword}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiTag className="mr-2" /> Additional Details
          </h2>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contest Rules (Optional)
            </label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              rows="3"
              placeholder="Specify any special rules or guidelines..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
            />
          </div>

          {/* Prizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prizes (Optional)
            </label>
            <input
              type="text"
              name="prizes"
              value={formData.prizes}
              onChange={handleChange}
              placeholder="e.g., Certificate, Premium Subscription, Swag (comma-separated)"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Separate multiple prizes with commas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <button
            type="button"
            onClick={() => navigate('/contests')}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2 rounded-lg font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
            } text-white`}
          >
            {loading ? 'Creating...' : 'Create Contest'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateContest;