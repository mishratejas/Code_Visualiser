import React, { useState, useEffect } from 'react';
import { FiAward, FiTarget, FiTrendingUp, FiZap, FiStar, FiLock } from 'react-icons/fi';
import { BsTrophy, BsMedal, BsLightningFill, BsCheckCircleFill } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalPoints: 0,
    completionRate: 0
  });
  const [filter, setFilter] = useState('all'); // all, locked, unlocked

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    // All available achievements
    const allAchievements = [
      {
        id: 'first_solve',
        title: 'First Steps',
        description: 'Solve your first problem',
        icon: <BsCheckCircleFill />,
        points: 10,
        category: 'milestone',
        color: 'from-green-500 to-emerald-500',
        requirement: 1,
        progress: user?.stats?.totalProblemsSolved || 0
      },
      {
        id: 'problem_10',
        title: 'Getting Started',
        description: 'Solve 10 problems',
        icon: <FiTarget />,
        points: 50,
        category: 'milestone',
        color: 'from-blue-500 to-cyan-500',
        requirement: 10,
        progress: user?.stats?.totalProblemsSolved || 0
      },
      {
        id: 'problem_50',
        title: 'Problem Solver',
        description: 'Solve 50 problems',
        icon: <BsTrophy />,
        points: 100,
        category: 'milestone',
        color: 'from-purple-500 to-pink-500',
        requirement: 50,
        progress: user?.stats?.totalProblemsSolved || 0
      },
      {
        id: 'problem_100',
        title: 'Centurion',
        description: 'Solve 100 problems',
        icon: <BsTrophy />,
        points: 250,
        category: 'milestone',
        color: 'from-yellow-500 to-orange-500',
        requirement: 100,
        progress: user?.stats?.totalProblemsSolved || 0
      },
      {
        id: 'problem_500',
        title: 'Master Solver',
        description: 'Solve 500 problems',
        icon: <BsTrophy />,
        points: 1000,
        category: 'milestone',
        color: 'from-red-500 to-rose-500',
        requirement: 500,
        progress: user?.stats?.totalProblemsSolved || 0
      },
      {
        id: 'streak_7',
        title: 'Weekly Warrior',
        description: 'Maintain a 7-day streak',
        icon: <BsLightningFill />,
        points: 75,
        category: 'streak',
        color: 'from-orange-500 to-red-500',
        requirement: 7,
        progress: user?.stats?.streak || 0
      },
      {
        id: 'streak_30',
        title: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: <BsLightningFill />,
        points: 200,
        category: 'streak',
        color: 'from-purple-500 to-pink-500',
        requirement: 30,
        progress: user?.stats?.streak || 0
      },
      {
        id: 'streak_100',
        title: 'Unstoppable',
        description: 'Maintain a 100-day streak',
        icon: <FiZap />,
        points: 500,
        category: 'streak',
        color: 'from-yellow-500 to-orange-500',
        requirement: 100,
        progress: user?.stats?.streak || 0
      },
      {
        id: 'all_easy',
        title: 'Easy Master',
        description: 'Solve 50 easy problems',
        icon: <BsMedal />,
        points: 100,
        category: 'difficulty',
        color: 'from-green-500 to-teal-500',
        requirement: 50,
        progress: user?.stats?.easySolved || 0
      },
      {
        id: 'all_medium',
        title: 'Medium Master',
        description: 'Solve 50 medium problems',
        icon: <BsMedal />,
        points: 200,
        category: 'difficulty',
        color: 'from-yellow-500 to-amber-500',
        requirement: 50,
        progress: user?.stats?.mediumSolved || 0
      },
      {
        id: 'all_hard',
        title: 'Hard Master',
        description: 'Solve 50 hard problems',
        icon: <BsMedal />,
        points: 500,
        category: 'difficulty',
        color: 'from-red-500 to-rose-500',
        requirement: 50,
        progress: user?.stats?.hardSolved || 0
      },
      {
        id: 'first_contest',
        title: 'Contest Participant',
        description: 'Participate in your first contest',
        icon: <FiAward />,
        points: 50,
        category: 'contest',
        color: 'from-blue-500 to-indigo-500',
        requirement: 1,
        progress: 0 // Would need contest participation tracking
      },
      {
        id: 'contest_winner',
        title: 'Contest Champion',
        description: 'Win a contest (1st place)',
        icon: <BsTrophy />,
        points: 500,
        category: 'contest',
        color: 'from-yellow-500 to-amber-500',
        requirement: 1,
        progress: 0
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Solve a problem in under 2 minutes',
        icon: <FiZap />,
        points: 100,
        category: 'special',
        color: 'from-purple-500 to-pink-500',
        requirement: 1,
        progress: 0
      },
      {
        id: 'perfect_week',
        title: 'Perfect Week',
        description: 'Get all submissions accepted for 7 days',
        icon: <FiStar />,
        points: 150,
        category: 'special',
        color: 'from-yellow-500 to-orange-500',
        requirement: 7,
        progress: 0
      }
    ];

    // Calculate which achievements are unlocked
    const unlockedAchievements = allAchievements.filter(
      achievement => achievement.progress >= achievement.requirement
    );

    setAchievements(allAchievements);
    setUserAchievements(unlockedAchievements.map(a => a.id));
    
    // Calculate stats
    const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
    setStats({
      totalUnlocked: unlockedAchievements.length,
      totalPoints,
      completionRate: (unlockedAchievements.length / allAchievements.length) * 100
    });
  };

  const isUnlocked = (achievementId) => {
    return userAchievements.includes(achievementId);
  };

  const getProgressPercentage = (achievement) => {
    return Math.min((achievement.progress / achievement.requirement) * 100, 100);
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'locked') return !isUnlocked(achievement.id);
    if (filter === 'unlocked') return isUnlocked(achievement.id);
    return true;
  });

  const categories = [
    { value: 'all', label: 'All Achievements', icon: <FiAward /> },
    { value: 'milestone', label: 'Milestones', icon: <FiTarget /> },
    { value: 'streak', label: 'Streaks', icon: <BsLightningFill /> },
    { value: 'difficulty', label: 'Difficulty', icon: <BsMedal /> },
    { value: 'contest', label: 'Contests', icon: <BsTrophy /> },
    { value: 'special', label: 'Special', icon: <FiStar /> }
  ];

  const [categoryFilter, setCategoryFilter] = useState('all');

  const displayedAchievements = filteredAchievements.filter(
    achievement => categoryFilter === 'all' || achievement.category === categoryFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                  <BsTrophy className="text-purple-600" />
                  Achievements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Unlock badges and track your progress
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <BsTrophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUnlocked}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Achievements Unlocked
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <FiStar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Achievement Points
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-5"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/20">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-3 mb-4">
              {['all', 'unlocked', 'locked'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    categoryFilter === cat.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedAchievements.map(achievement => {
            const unlocked = isUnlocked(achievement.id);
            const progress = getProgressPercentage(achievement);

            return (
              <div key={achievement.id} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} rounded-2xl blur-xl ${unlocked ? 'opacity-20' : 'opacity-5'} group-hover:opacity-30 transition-opacity`}></div>
                <div className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 ${unlocked ? 'transform hover:scale-105' : 'opacity-60'} transition-all`}>
                  {/* Achievement Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 bg-gradient-to-r ${achievement.color} rounded-xl text-white text-3xl ${!unlocked && 'grayscale'}`}>
                      {unlocked ? achievement.icon : <FiLock />}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${unlocked ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {achievement.points} pts
                    </div>
                  </div>

                  {/* Achievement Details */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {achievement.description}
                  </p>

                  {/* Progress Bar */}
                  {!unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {achievement.progress}/{achievement.requirement}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${achievement.color} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked Badge */}
                  {unlocked && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                      <BsCheckCircleFill />
                      <span>Unlocked!</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {displayedAchievements.length === 0 && (
          <div className="text-center py-16">
            <FiLock className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No achievements found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try changing your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;