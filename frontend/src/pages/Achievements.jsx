import React, { useState, useEffect } from 'react';
import { FiAward, FiLock, FiTrendingUp, FiTarget, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';

const Achievements = () => {
  const { isDark } = useTheme();
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/achievements/user');
      const data = response.data?.data || response.data || {};
      
      setAchievements({
        unlocked: data.unlocked || [],
        locked: data.locked || [],
        stats: data.stats || {}
      });
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      toast.error('Failed to load achievements');
      setAchievements({ unlocked: [], locked: [], stats: {} });
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'milestone', 'streak', 'contest', 'speed', 'mastery', 'special'];
  
  const getDisplayAchievements = () => {
    let all = [];
    if (filter === 'all' || filter === 'unlocked') all = [...all, ...achievements.unlocked.map(a => ({ ...a, isUnlocked: true }))];
    if (filter === 'all' || filter === 'locked') all = [...all, ...achievements.locked.map(a => ({ ...a, isUnlocked: false }))];
    if (categoryFilter !== 'all') all = all.filter(a => a.category === categoryFilter);
    if (searchQuery) all = all.filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return all;
  };

  const getCategoryIcon = (category) => {
    const icons = { milestone: '🎯', streak: '🔥', contest: '🏆', speed: '⚡', mastery: '🎓', special: '💎' };
    return icons[category] || '🏅';
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      milestone: 'from-blue-500 to-cyan-500',
      streak: 'from-orange-500 to-red-500',
      contest: 'from-yellow-400 to-amber-500',
      speed: 'from-green-500 to-teal-500',
      mastery: 'from-purple-500 to-pink-500',
      special: 'from-rose-500 to-red-500',
    };
    return gradients[category] || 'from-gray-500 to-gray-600';
  };

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputClass = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const displayAchievements = getDisplayAchievements();
  const unlockedCount = achievements.unlocked.length;
  const totalCount = unlockedCount + achievements.locked.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
              <FiAward className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Achievements</h1>
              <p className={`text-sm ${subTextClass}`}>{unlockedCount} / {totalCount} unlocked</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Unlocked', value: achievements.stats?.totalUnlocked || unlockedCount, gradient: 'from-blue-500 to-cyan-500', icon: '🏅' },
            { label: 'Total Points', value: achievements.stats?.totalPoints || 0, gradient: 'from-yellow-400 to-amber-500', icon: '⭐' },
            { label: 'Streak Best', value: achievements.stats?.maxStreak || 0, gradient: 'from-orange-500 to-red-500', icon: '🔥' },
            { label: 'Progress', value: `${progressPct}%`, gradient: 'from-purple-500 to-pink-500', icon: '📈' },
          ].map(({ label, value, gradient, icon }) => (
            <div key={label} className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <div className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {value}
                </div>
              </div>
              <p className={`text-xs ${subTextClass}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${textClass}`}>Overall Progress</span>
            <span className={`text-sm ${subTextClass}`}>{unlockedCount} / {totalCount}</span>
          </div>
          <div className={`h-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardClass} border rounded-xl p-4 space-y-3`}>
          {/* Search */}
          <div className="relative">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextClass} h-4 w-4`} />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 ${inputClass} rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500`}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'unlocked', 'locked'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                  categoryFilter === cat
                    ? `bg-gradient-to-r ${getCategoryGradient(cat)} text-white`
                    : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                {cat !== 'all' && getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {displayAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAchievements.map((achievement, idx) => (
              <div
                key={achievement._id || idx}
                className={`${cardClass} border rounded-xl p-5 transition-all ${
                  achievement.isUnlocked ? 'hover:scale-[1.02]' : 'opacity-60'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(achievement.category)} flex items-center justify-center text-2xl flex-shrink-0 ${!achievement.isUnlocked ? 'grayscale' : ''}`}>
                    {achievement.isUnlocked ? (achievement.icon || getCategoryIcon(achievement.category)) : '🔒'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${textClass} truncate`}>{achievement.title || 'Unknown Achievement'}</h3>
                      {achievement.isUnlocked && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                    </div>
                    <p className={`text-xs ${subTextClass} mt-0.5 line-clamp-2`}>{achievement.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getCategoryIcon(achievement.category)} {achievement.category}
                  </span>
                  {achievement.points && (
                    <span className="text-xs text-amber-500 font-medium">+{achievement.points} pts</span>
                  )}
                </div>

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className={`text-xs ${subTextClass} mt-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Progress for locked ones */}
                {!achievement.isUnlocked && achievement.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={subTextClass}>Progress</span>
                      <span className={subTextClass}>{achievement.progress} / {achievement.target}</span>
                    </div>
                    <div className={`h-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getCategoryGradient(achievement.category)}`}
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`${cardClass} border rounded-xl p-16 text-center`}>
            <FiAward className={`mx-auto h-16 w-16 ${subTextClass} mb-4 opacity-30`} />
            <h3 className={`text-xl font-bold ${textClass} mb-2`}>
              {filter === 'unlocked' ? 'No achievements unlocked yet' : 'No achievements found'}
            </h3>
            <p className={`${subTextClass} mb-4`}>
              {filter === 'unlocked' 
                ? 'Start solving problems and participating in contests to earn achievements!' 
                : 'Try adjusting your filters'}
            </p>
            <button
              onClick={() => { setFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Achievements;