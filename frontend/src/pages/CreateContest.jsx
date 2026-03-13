import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  FiCalendar, FiClock, FiLock, FiUnlock, FiUsers, FiTag, FiAlertCircle,
  FiAward, FiInfo, FiCheck, FiX, FiPlus, FiChevronRight
} from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateContest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const groupId = searchParams.get('groupId') || null;
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contestType: 'rated',
    isRated: true,
    scoringType: 'icpc',
    allowTeams: false,
    maxTeamSize: 2,
    ratingFloor: 0,
    ratingCeiling: 9999,
    difficulty: 'medium',
    startTime: '',
    endTime: '',
    durationMinutes: 120,
    maxParticipants: '',
    isPrivate: false,
    registrationPassword: '',
    tags: [],
    rules: '',
    prizes: '',
    banner: ''
  });

  const [errors, setErrors] = useState({});

  const contestTypes = [
    { value: 'rated',       label: 'Rated',       icon: '⭐', description: 'Affects Elo rating — official competition' },
    { value: 'unrated',     label: 'Unrated',     icon: '🎮', description: 'No rating change — just for fun' },
    { value: 'practice',    label: 'Practice',    icon: '🎯', description: 'For skill development, open-ended' },
    { value: 'educational', label: 'Educational', icon: '🎓', description: 'Explanations visible during contest' },
    { value: 'weekly',      label: 'Weekly',      icon: '📅', description: 'Regular weekly ranked competition' },
    { value: 'challenge',   label: 'Challenge',   icon: '🔥', description: 'Hard problems, longer duration' },
    { value: 'team',        label: 'Team',        icon: '👥', description: 'Teams compete together' },
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-500', icon: '😊' },
    { value: 'medium', label: 'Medium', color: 'from-yellow-500 to-amber-500', icon: '🤔' },
    { value: 'hard', label: 'Hard', color: 'from-red-500 to-rose-500', icon: '🔥' }
  ];

  const availableTags = [
    { name: 'Beginner Friendly', color: 'bg-green-500/20 text-green-400' },
    { name: 'Advanced', color: 'bg-red-500/20 text-red-400' },
    { name: 'Algorithms', color: 'bg-blue-500/20 text-rose-400' },
    { name: 'Data Structures', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Dynamic Programming', color: 'bg-yellow-500/20 text-yellow-400' },
    { name: 'Graph Theory', color: 'bg-pink-500/20 text-pink-400' },
    { name: 'Mathematics', color: 'bg-cyan-500/20 text-cyan-400' },
    { name: 'Competitive', color: 'bg-orange-500/20 text-orange-400' }
  ];

  const steps = [
    { number: 1, title: 'Basic Info', icon: FiInfo },
    { number: 2, title: 'Schedule', icon: FiCalendar },
    { number: 3, title: 'Settings', icon: FiUsers },
    { number: 4, title: 'Details', icon: FiTag },
    { number: 5, title: 'Review', icon: FiCheck }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
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

const validateStep = (step) => {
  const newErrors = {};

  // Step 1: Basic Info
  if (step === 1) {
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
  }

  // Step 2: Schedule - IMPROVED VALIDATION
  if (step === 2) {
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

      // Check for valid dates
      if (isNaN(start.getTime())) {
        newErrors.startTime = 'Invalid start time';
      }
      if (isNaN(end.getTime())) {
        newErrors.endTime = 'Invalid end time';
      }

      // Only check other validations if dates are valid
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // For testing, allow past dates
        // Uncomment this in production:
        /*
        if (start < now) {
          newErrors.startTime = 'Start time must be in the future';
        }
        */
        
        if (end <= start) {
          newErrors.endTime = 'End time must be after start time';
        }
        
        const duration = (end - start) / (1000 * 60);
        if (duration < 30) {
          newErrors.endTime = 'Contest must be at least 30 minutes long';
        }
      }
    }
  }

  // Step 3: Settings
  if (step === 3) {
    if (formData.isPrivate && !formData.registrationPassword.trim()) {
      newErrors.registrationPassword = 'Password is required for private contests';
    }
  }

  // ✅ NEW: Step 4 validation (optional fields, just warnings)
  if (step === 4) {
    // No required fields, but could add warnings
    if (!formData.rules || formData.rules.trim().length === 0) {
      console.warn('No rules specified');
    }
  }

  // ✅ NEW: Step 5 validation (review)
  if (step === 5) {
    // Final check before submission
    if (!formData.title || !formData.description) {
      newErrors.final = 'Basic information incomplete';
    }
    if (!formData.startTime || !formData.endTime) {
      newErrors.final = 'Schedule information incomplete';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.error('Please fix all errors before proceeding');
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Check authentication first
  if (!user) {
    toast.error('Please login to create a contest');
    navigate('/login');
    return;
  }

  // ✅ IMPROVED: Validate ALL steps before submitting
  const allStepsValid = [1, 2, 3, 4, 5].every(step => validateStep(step));
  
  if (!allStepsValid) {
    toast.error('Please fix all errors before submitting');
    // Show which steps have errors
    [1, 2, 3, 4, 5].forEach(step => {
      if (!validateStep(step)) {
        console.error(`Step ${step} has validation errors`);
      }
    });
    return;
  }

  // Prevent double submission
  if (loading) {
    console.log('⚠️ Already submitting, ignoring duplicate request');
    return;
  }

  setLoading(true);

  try {
    // ✅ IMPROVED: Validate dates before sending
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please select both start and end times');
      setLoading(false);
      return;
    }

    const contestData = {
      title: formData.title.trim(),
      slug: formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      description: formData.description.trim(),
      contest_type: formData.contestType,
      difficulty: formData.difficulty,
      start_time: formData.startTime,
      end_time: formData.endTime,
      duration_minutes: Math.round(
        (new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60)
      ),
      max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      is_private: formData.isPrivate,
      registration_password: formData.isPrivate ? formData.registrationPassword : null,
      banner_url: formData.banner || null,
      tags: formData.tags,
      rules: formData.rules || null,
      prizes: formData.prizes ? formData.prizes.split(',').map(p => p.trim()).filter(Boolean) : [],
      // ── Rating & scoring (real backend fields) ───────────────────────
      is_rated: formData.isRated,
      scoring_type: formData.scoringType,     // 'icpc' | 'ioi' | 'atcoder'
      allow_teams: formData.allowTeams,
      max_team_size: formData.allowTeams ? parseInt(formData.maxTeamSize) || 2 : 1,
      min_team_size: formData.allowTeams ? 2 : 1,
      rating_floor:   parseInt(formData.ratingFloor)   || 0,
      rating_ceiling: parseInt(formData.ratingCeiling) || 9999,
      group_id: groupId ? parseInt(groupId) : null,
    };

    console.log('Submitting contest:', contestData);

    const response = await api.post('/contests', contestData);

    console.log('Response:', response);

    // Check for successful response
    if (response?.success || response?.data?.id) {
      const contestId = response?.data?.id || response?.data?._id;
      
      toast.success('Contest created successfully! Redirecting to add problems...', { 
        duration: 2000,
        icon: '🎉'
      });
      
      if (contestId) {
        console.log('✅ Contest created with ID:', contestId);
        navigate(`/contests/${contestId}/add-problems`);
      } else {
        console.warn('⚠️ No contest ID returned, redirecting to contests page');
        navigate('/contests');
      }
    }
  } catch (error) {
    console.error('Failed to create contest:', error);
    
    // ✅ IMPROVED: Better error handling with error array
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || error.message;
    const errors = errorData?.errors || [];
    
    // Show all validation errors
    if (errors.length > 0) {
      errors.forEach((err, index) => {
        setTimeout(() => {
          toast.error(err, { duration: 4000 });
        }, index * 100); // Stagger error messages
      });
    } else if (errorMessage?.includes('slug')) {
      toast.error('A contest with this title already exists. Please choose a different title.');
    } else if (error.response?.status === 400) {
      toast.error(errorMessage || 'Invalid contest data. Please check all fields.');
    } else if (error.response?.status === 401) {
      toast.error('Please login to create a contest');
      navigate('/login');
    } else {
      toast.error('Failed to create contest. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};


  const GroupBanner = () => groupId ? (
    <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400 flex items-center gap-2">
      <span>🏢</span>
      <span>Creating a private contest for <strong>Group #{groupId}</strong> — only group members can participate.</span>
    </div>
  ) : null;

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Contest Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Weekly Coding Challenge #42"
                className={`w-full px-4 py-3 bg-gray-700/50 border ${
                  errors.title ? 'border-red-500' : 'border-gray-600'
                } rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 transition-all`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                  <FiAlertCircle className="h-4 w-4" /> {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe what this contest is about, what participants can expect, and any special themes..."
                className={`w-full px-4 py-3 bg-gray-700/50 border ${
                  errors.description ? 'border-red-500' : 'border-gray-600'
                } rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 resize-none transition-all`}
              />
              <div className="flex justify-between mt-2">
                {errors.description && (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4" /> {errors.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.description.length}/2000 characters
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Contest Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {contestTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, contestType: type.value }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.contestType === type.value
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{type.icon}</span>
                        <div className="font-medium text-white text-sm">{type.label}</div>
                      </div>
                      <p className="text-xs text-gray-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Difficulty Level *
                </label>
                <div className="space-y-3">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.value }))}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        formData.difficulty === diff.value
                          ? 'border-rose-500 bg-gradient-to-r from-rose-500/10 to-red-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{diff.icon}</span>
                          <span className="font-medium text-white">{diff.label}</span>
                        </div>
                        {formData.difficulty === diff.value && (
                          <FiCheck className="h-5 w-5 text-green-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-700/50 border ${
                    errors.startTime ? 'border-red-500' : 'border-gray-600'
                  } rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white transition-all`}
                />
                {errors.startTime && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4" /> {errors.startTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-700/50 border ${
                    errors.endTime ? 'border-red-500' : 'border-gray-600'
                  } rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white transition-all`}
                />
                {errors.endTime && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4" /> {errors.endTime}
                  </p>
                )}
              </div>
            </div>

            {formData.startTime && formData.endTime && (
              <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 rounded-xl border border-rose-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white mb-2">Contest Duration</h4>
                    <div className="text-3xl font-bold text-white">
                      {Math.round((new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60))} minutes
                    </div>
                    <p className="text-sm text-red-300 mt-2">
                      {new Date(formData.startTime).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-rose-600 to-red-600 rounded-xl">
                    <FiClock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <FiInfo className="h-5 w-5 text-rose-400" />
                Schedule Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <FiCheck className="h-4 w-4 text-green-400 mt-0.5" />
                  <span>Weekends generally have higher participation</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheck className="h-4 w-4 text-green-400 mt-0.5" />
                  <span>Allow at least 24 hours for registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheck className="h-4 w-4 text-green-400 mt-0.5" />
                  <span>Consider time zones of your target audience</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Max Participants (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited participants"
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiUsers className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Setting a limit creates exclusivity and can increase competition
              </p>
            </div>

            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${formData.isPrivate 
                    ? 'bg-gradient-to-r from-rose-600 to-red-600' 
                    : 'bg-gray-600'
                  }`}>
                    {formData.isPrivate ? (
                      <FiLock className="h-5 w-5 text-white" />
                    ) : (
                      <FiUnlock className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="isPrivate" className="font-medium text-white cursor-pointer text-lg">
                      Private Contest
                    </label>
                    <input
                      type="checkbox"
                      name="isPrivate"
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Participants will need a password to register. Ideal for company events or study groups.
                  </p>
                </div>
              </div>

              {formData.isPrivate && (
                <div className="mt-4 pt-4 border-t border-gray-600/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Registration Password *
                  </label>
                  <input
                    type="text"
                    name="registrationPassword"
                    value={formData.registrationPassword}
                    onChange={handleChange}
                    placeholder="Enter password for private contest"
                    className={`w-full px-4 py-3 bg-gray-700/50 border ${
                      errors.registrationPassword ? 'border-red-500' : 'border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 transition-all`}
                  />
                  {errors.registrationPassword && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <FiAlertCircle className="h-4 w-4" /> {errors.registrationPassword}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleTagToggle(tag.name)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      formData.tags.includes(tag.name)
                        ? `${tag.color} border border-gray-500/30`
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {tag.name}
                    {formData.tags.includes(tag.name) && (
                      <FiX className="inline ml-2 h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Contest Rules (Optional)
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows="4"
                placeholder="Specify any special rules, code of conduct, or guidelines for participants..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Prizes (Optional)
              </label>
              <input
                type="text"
                name="prizes"
                value={formData.prizes}
                onChange={handleChange}
                placeholder="e.g., Certificate, Premium Subscription, Swag (comma-separated)"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-white placeholder-gray-500 transition-all"
              />
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <FiAward className="h-4 w-4" />
                <span>Separate multiple prizes with commas</span>
              </div>
            </div>

            {/* ── Scoring & Rating ─────────────────────────────── */}
            <div className="border border-gray-700/50 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold text-gray-200">Scoring & Rating Settings</h3>

              {/* Is Rated toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Rated Contest</p>
                  <p className="text-xs text-gray-500 mt-0.5">Elo rating changes after this contest ends</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer"
                    checked={formData.isRated}
                    onChange={e => setFormData(prev => ({ ...prev, isRated: e.target.checked }))} />
                  <div className="w-11 h-6 bg-gray-700 peer-checked:bg-rose-500 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              {/* Scoring type */}
              <div>
                <p className="text-sm font-medium text-gray-200 mb-2">Scoring System</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v:'icpc',    l:'ICPC',    d:'Binary — solved/not' },
                    { v:'ioi',     l:'IOI',     d:'Partial score per test' },
                    { v:'atcoder', l:'AtCoder', d:'Time-based penalty' },
                  ].map(s => (
                    <button key={s.v} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, scoringType: s.v }))}
                      className={`p-3 rounded-xl border text-left transition-all ${formData.scoringType === s.v ? 'border-rose-500 bg-rose-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                      <p className={`text-xs font-bold ${formData.scoringType === s.v ? 'text-rose-400' : 'text-gray-300'}`}>{s.l}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating floor/ceiling */}
              {formData.isRated && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Rating Floor</label>
                    <input type="number" value={formData.ratingFloor} min={0} max={3000}
                      onChange={e => setFormData(prev => ({ ...prev, ratingFloor: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500" />
                    <p className="text-xs text-gray-600 mt-1">Min rating to participate (0 = everyone)</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Rating Ceiling</label>
                    <input type="number" value={formData.ratingCeiling} min={0} max={9999}
                      onChange={e => setFormData(prev => ({ ...prev, ratingCeiling: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500" />
                    <p className="text-xs text-gray-600 mt-1">Max rating allowed (9999 = everyone)</p>
                  </div>
                </div>
              )}

              {/* Teams toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Team Contest</p>
                  <p className="text-xs text-gray-500 mt-0.5">Allow participants to form teams</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer"
                    checked={formData.allowTeams}
                    onChange={e => setFormData(prev => ({ ...prev, allowTeams: e.target.checked }))} />
                  <div className="w-11 h-6 bg-gray-700 peer-checked:bg-rose-500 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
              {formData.allowTeams && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Team Size</label>
                  <input type="number" value={formData.maxTeamSize} min={2} max={5}
                    onChange={e => setFormData(prev => ({ ...prev, maxTeamSize: e.target.value }))}
                    className="w-32 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-xl text-white text-sm focus:ring-1 focus:ring-rose-500 focus:border-rose-500" />
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-rose-600 to-red-600 rounded-xl">
                  <MdOutlineEmojiEvents className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{formData.title || 'Untitled Contest'}</h3>
                  <p className="text-gray-400 text-sm">Preview of your contest</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-sm text-gray-400">Type</div>
                    <div className="text-white font-medium">
                      {contestTypes.find(t => t.value === formData.contestType)?.label}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-sm text-gray-400">Difficulty</div>
                    <div className="text-white font-medium capitalize">{formData.difficulty}</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="text-sm text-gray-400">Schedule</div>
                  <div className="text-white font-medium">
                    {formData.startTime 
                      ? `${new Date(formData.startTime).toLocaleDateString()} - ${new Date(formData.endTime).toLocaleDateString()}`
                      : 'Not set'
                    }
                  </div>
                </div>

                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="text-sm text-gray-400">Participation</div>
                  <div className="text-white font-medium">
                    {formData.maxParticipants 
                      ? `${formData.maxParticipants} participants max`
                      : 'Unlimited participants'
                    }
                    {formData.isPrivate && ' • Private'}
                  </div>
                </div>

                {formData.tags.length > 0 && (
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-xl border border-rose-500/30 p-6">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <FiInfo className="h-5 w-5 text-rose-400" />
                Next Step: Add Problems
              </h4>
              <p className="text-gray-300 text-sm">
                After creating this contest, you'll be redirected to add problems. You can select from published problems to include in this contest.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <GroupBanner />
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative z-10 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <MdOutlineEmojiEvents className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Create New Contest</h1>
              <p className="text-red-100 mt-2 text-lg">
                Design an exciting coding competition for the community
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-6">
            <div className="px-3 py-1.5 bg-white/20 rounded-full text-sm">
              Created by: {user?.username || 'You'}
            </div>
            <div className="px-3 py-1.5 bg-white/10 rounded-full text-sm">
              Step {activeStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-700 -z-10"></div>
              <div 
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-rose-600 to-red-600 -z-10 transition-all duration-500"
                style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((step) => {
                const isActive = step.number === activeStep;
                const isCompleted = step.number < activeStep;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg scale-110'
                        : isCompleted
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <FiCheck className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 min-w-[150px] text-center">
            <div className="text-sm text-gray-400">Current Step</div>
            <div className="text-2xl font-bold text-white mt-1">{activeStep}/{steps.length}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-8">
        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-700/50">
            <button
              type="button"
              onClick={prevStep}
              disabled={activeStep === 1}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeStep === 1
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Previous
            </button>
            
            {activeStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Next Step
                <FiChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg'
                } text-white`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCheck className="h-5 w-5" />
                    Create & Add Problems
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContest;