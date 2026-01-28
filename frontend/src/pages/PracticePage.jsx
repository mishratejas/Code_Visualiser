import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlay, FiRefreshCw, FiTarget, FiZap } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PracticePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentProblem, setCurrentProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [practiceMode, setPracticeMode] = useState('random'); // random, difficulty, topic
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [streak, setStreak] = useState(0);
  const [sessionProblems, setSessionProblems] = useState([]);

  const topics = ['Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 'Binary Search'];
  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = () => {
    const savedStreak = localStorage.getItem('practiceStreak') || 0;
    setStreak(parseInt(savedStreak));
  };

  const fetchRandomProblem = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (practiceMode === 'difficulty' && selectedDifficulty) {
        params.difficulty = selectedDifficulty;
      } else if (practiceMode === 'topic' && selectedTopic) {
        params.tags = selectedTopic;
      }

      const response = await api.get('/problems', {
        params: {
          ...params,
          page: Math.floor(Math.random() * 10) + 1,
          limit: 20
        }
      });

      const problems = response.data?.problems || response.data?.data?.problems || [];
      
      if (problems.length > 0) {
        // Filter out already attempted problems in this session
        const availableProblems = problems.filter(
          p => !sessionProblems.includes(p._id)
        );
        
        const randomProblem = availableProblems.length > 0
          ? availableProblems[Math.floor(Math.random() * availableProblems.length)]
          : problems[Math.floor(Math.random() * problems.length)];
          
        setCurrentProblem(randomProblem);
        setSessionProblems(prev => [...prev, randomProblem._id]);
      } else {
        toast.error('No problems found with these filters');
      }
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

  const updateStreak = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('practiceStreak', newStreak);
    toast.success(`🔥 Streak: ${newStreak} problems!`);
  };

  const resetSession = () => {
    setSessionProblems([]);
    setCurrentProblem(null);
    toast.success('Practice session reset');
  };

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-amber-500';
      case 'hard': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                  <FiTarget />
                  Practice Mode
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Sharpen your skills with random problems
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text flex items-center gap-2">
                  <BsLightningFill className="text-orange-500" />
                  {streak}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Streak
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Mode Selection */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-5"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Practice Mode
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setPracticeMode('random')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  practiceMode === 'random'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-500'
                }`}
              >
                <FiRefreshCw className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">Random</div>
                <div className="text-sm opacity-80">Any problem</div>
              </button>

              <button
                onClick={() => setPracticeMode('difficulty')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  practiceMode === 'difficulty'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-500'
                }`}
              >
                <FiZap className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">By Difficulty</div>
                <div className="text-sm opacity-80">Choose level</div>
              </button>

              <button
                onClick={() => setPracticeMode('topic')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  practiceMode === 'topic'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-500'
                }`}
              >
                <FiTarget className="w-8 h-8 mx-auto mb-2" />
                <div className="font-bold">By Topic</div>
                <div className="text-sm opacity-80">Focus area</div>
              </button>
            </div>

            {/* Difficulty Selection */}
            {practiceMode === 'difficulty' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Difficulty
                </label>
                <div className="flex gap-3">
                  {difficulties.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                        selectedDifficulty === diff
                          ? `bg-gradient-to-r ${getDifficultyColor(diff)} text-white shadow-lg`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Selection */}
            {practiceMode === 'topic' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Topic
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        selectedTopic === topic
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-105'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={fetchRandomProblem}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FiRefreshCw size={20} />
                    Get Random Problem
                  </>
                )}
              </button>
              {sessionProblems.length > 0 && (
                <button
                  onClick={resetSession}
                  className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-bold"
                >
                  Reset Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Problem Display */}
        {currentProblem && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl blur-3xl opacity-10"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-4 py-2 rounded-xl font-bold bg-gradient-to-r ${getDifficultyColor(currentProblem.difficulty)} text-white`}>
                      {currentProblem.difficulty}
                    </span>
                    {currentProblem.tags?.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentProblem.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {currentProblem.description?.substring(0, 150)}...
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startPractice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                >
                  <FiPlay size={20} />
                  Start Solving
                </button>
                <button
                  onClick={skipProblem}
                  className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-bold"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Stats */}
        {sessionProblems.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {sessionProblems.length} problems attempted this session
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Keep practicing to maintain your streak!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;