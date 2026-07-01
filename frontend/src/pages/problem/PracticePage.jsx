// frontend/src/pages/PracticePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FiPlay, FiRefreshCw, FiTarget, FiZap, FiFilter } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';
import { problemsApi, submissionsApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import Loader from '../../components/common/Loader';

const PracticePage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [currentProblem, setCurrentProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
  const [practiceMode, setPracticeMode] = useState('random');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [streak, setStreak] = useState(0);
  const [sessionProblems, setSessionProblems] = useState([]);
  const [tagStats, setTagStats] = useState([]);
  const [userSolved, setUserSolved] = useState([]);

  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchTagStats();
    if (user) {
      fetchUserSolved();
      loadStreak();
    }
  }, [user]);

  const fetchTagStats = async () => {
    try {
      const response = await problemsApi.getTagStats();
      setTagStats(response.data?.tagStats || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchUserSolved = async () => {
    try {
      const response = await submissionsApi.getUserSolved();
      setUserSolved(response.data?.solvedProblems || []);
    } catch (error) {
      console.error('Failed to fetch solved problems:', error);
    }
  };

  const loadStreak = () => {
    const savedStreak = localStorage.getItem('practiceStreak') || 0;
    setStreak(parseInt(savedStreak));
  };

  const fetchProblems = async () => {
    try {
      const params = {
        limit: 50,
        difficulty: selectedDifficulty || undefined,
        tags: selectedTopic || undefined
      };
      
      const response = await problemsApi.getAll(params);
      const problemsList = response.data?.problems || [];
      setProblems(problemsList);
      
      return problemsList;
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      return [];
    }
  };

  const fetchRandomProblem = async () => {
    setLoading(true);
    try {
      const problemsList = await fetchProblems();
      
      if (problemsList.length === 0) {
        toast.error('No problems found with selected filters');
        setLoading(false);
        return;
      }
      
      // Filter out already attempted problems in this session
      const availableProblems = problemsList.filter(
        p => !sessionProblems.includes(p._id) && !userSolved.includes(p._id)
      );
      
      const problemPool = availableProblems.length > 0 ? availableProblems : problemsList;
      
      if (problemPool.length === 0) {
        toast.error('No problems available');
        setLoading(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * problemPool.length);
      const selectedProblem = problemPool[randomIndex];
      
      setCurrentProblem(selectedProblem);
      setSessionProblems(prev => [...prev, selectedProblem._id]);
    } catch (error) {
      toast.error('Failed to fetch problem');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = () => {
    if (!currentProblem) {
      fetchRandomProblem();
    } else {
      navigate(`/problem/${currentProblem._id}`);
    }
  };

  const skipProblem = () => {
    fetchRandomProblem();
  };

  const resetSession = () => {
    setSessionProblems([]);
    setCurrentProblem(null);
    setSelectedDifficulty('');
    setSelectedTopic('');
    toast.success('Practice session reset');
  };

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark 
    ? 'bg-gray-900 border-gray-800' 
    : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentClass = isDark ? 'text-rose-400' : 'text-rose-600';

  const getButtonClass = (isSelected) => {
    return isSelected
      ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
      : isDark
        ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100';
  };

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-500">
              <FiTarget className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Practice Mode</h1>
              <p className={`text-sm ${subTextClass}`}>Sharpen your skills with random problems</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold text-rose-500 flex items-center gap-1`}>
                <BsLightningFill className="h-5 w-5" />
                {streak}
              </div>
              <div className={`text-xs ${subTextClass}`}>Streak</div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Practice Mode Selection */}
        <div className={`${cardClass} rounded-xl p-6 border`}>
          <h2 className={`text-lg font-bold mb-4 ${textClass}`}>Choose Practice Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setPracticeMode('random')}
              className={`p-4 rounded-lg border transition-all ${
                practiceMode === 'random'
                  ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <FiRefreshCw className="h-5 w-5 mx-auto mb-2" />
              <div className="font-medium text-sm">Random</div>
            </button>

            <button
              onClick={() => setPracticeMode('difficulty')}
              className={`p-4 rounded-lg border transition-all ${
                practiceMode === 'difficulty'
                  ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <FiZap className="h-5 w-5 mx-auto mb-2" />
              <div className="font-medium text-sm">By Difficulty</div>
            </button>

            <button
              onClick={() => setPracticeMode('topic')}
              className={`p-4 rounded-lg border transition-all ${
                practiceMode === 'topic'
                  ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <FiTarget className="h-5 w-5 mx-auto mb-2" />
              <div className="font-medium text-sm">By Topic</div>
            </button>
          </div>

          {/* Difficulty Selection */}
          {practiceMode === 'difficulty' && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Select Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${getButtonClass(selectedDifficulty === diff)}`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topic Selection */}
          {practiceMode === 'topic' && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Select Topic</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2">
                {tagStats.map(stat => (
                  <button
                    key={stat._id}
                    onClick={() => setSelectedTopic(stat._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedTopic === stat._id
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {stat._id} ({stat.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={fetchRandomProblem}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:opacity-90'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FiRefreshCw size={16} />
                  Get Random Problem
                </>
              )}
            </button>
            {sessionProblems.length > 0 && (
              <button
                onClick={resetSession}
                className={`px-4 py-3 rounded-lg font-medium border transition-all ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Reset Session
              </button>
            )}
          </div>
        </div>

        {/* Current Problem Display */}
        {currentProblem && (
          <div className={`${cardClass} rounded-xl p-6 border`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-xs rounded-full ${getDifficultyColor(currentProblem.difficulty)}`}>
                    {currentProblem.difficulty}
                  </span>
                  <span className={`text-xs ${subTextClass}`}>
                    {currentProblem.metadata?.acceptanceRate?.toFixed(1) || 0}% acceptance
                  </span>
                </div>
                <h2 className={`text-xl font-bold ${textClass} mb-2`}>{currentProblem.title}</h2>
                <p className={`text-sm ${subTextClass} line-clamp-2`}>{currentProblem.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentProblem.tags?.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full ${subTextClass}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startPractice}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                <FiPlay size={16} />
                Start Solving
              </button>
              <button
                onClick={skipProblem}
                className={`px-4 py-3 rounded-lg font-medium border transition-all ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Session Stats */}
        {sessionProblems.length > 0 && (
          <div className={`${cardClass} rounded-xl p-4 border text-center`}>
            <div className={`text-lg font-bold ${textClass}`}>
              {sessionProblems.length} problems attempted this session
            </div>
            <p className={`text-sm ${subTextClass} mt-1`}>
              Keep practicing to maintain your streak!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;