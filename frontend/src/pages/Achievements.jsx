import React, { useState, useEffect } from 'react';
import { FiAward, FiLock, FiTrendingUp, FiTarget } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/common/Loader';

const Achievements = () => {
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/achievements/user');
      const data = response.data?.data || {};
      
      setAchievements({
        unlocked: data.unlocked || [],
        locked: data.locked || [],
        stats: data.stats || {}
      });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'milestone', 'streak', 'contest', 'speed', 'mastery', 'special'];
  
  const filteredAchievements = () => {
    let all = [];
    
    if (filter === 'all' || filter === 'unlocked') {
      all = [...all, ...achievements.unlocked];
    }
    if (filter === 'all' || filter === 'locked') {
      all = [...all, ...achievements.locked];
    }
    
    if (categoryFilter !== 'all') {
      all = all.filter(a => a.category === categoryFilter);
    }
    
    return all;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      milestone: '🎯',
      streak: '🔥',
      contest: '🏆',
      speed: '⚡',
      mastery: '🎓',
      special: '💎'
    };
    return icons[category] || '🏅';
  };

  const displayAchievements = filteredAchievements();

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FiAward className="w-8 h-8 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-gray-400">
            Track your progress and unlock achievements as you code
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Unlocked</p>
                <p className="text-3xl font-bold text-white">
                  {achievements.stats.totalUnlocked || 0}
                </p>
              </div>
              <FiTarget className="w-10 h-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold text-white">
                  {achievements.stats.totalPoints || 0}
                </p>
              </div>
              <FiAward className="w-10 h-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Completion</p>
                <p className="text-3xl font-bold text-white">
                  {achievements.stats.completionRate || 0}%
                </p>
              </div>
              <FiTrendingUp className="w-10 h-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Total</p>
                <p className="text-3xl font-bold text-white">
                  {achievements.stats.totalAchievements || 0}
                </p>
              </div>
              <FiLock className="w-10 h-10 text-white/30" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Status:</span>
              <div className="flex gap-2">
                {['all', 'unlocked', 'locked'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Category:</span>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      categoryFilter === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat === 'all' ? 'All' : getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        {displayAchievements.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <FiAward className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No achievements found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAchievements.map((achievement) => (
              <div
                key={achievement._id}
                className={`relative overflow-hidden rounded-lg border transition-all ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${achievement.color} border-transparent`
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className={`text-5xl mb-3 ${!achievement.unlocked && 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-xl font-bold mb-2 ${achievement.unlocked ? 'text-white' : 'text-gray-300'}`}>
                    {achievement.title}
                    {!achievement.unlocked && (
                      <FiLock className="inline ml-2 w-4 h-4 text-gray-500" />
                    )}
                  </h3>
                  <p className={`text-sm mb-4 ${achievement.unlocked ? 'text-white/80' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>

                  {/* Progress Bar (for locked achievements) */}
                  {!achievement.unlocked && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress || 0} / {achievement.requirement}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${achievement.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className={`text-sm ${achievement.unlocked ? 'text-white/80' : 'text-gray-500'}`}>
                      {getCategoryIcon(achievement.category)} {achievement.category}
                    </span>
                    <span className={`text-sm font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.points} pts
                    </span>
                  </div>

                  {/* Unlocked Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-white/60">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Decorative Elements for Unlocked */}
                {achievement.unlocked && (
                  <>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full blur-xl"></div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;