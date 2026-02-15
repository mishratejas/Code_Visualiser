import React from 'react';
import { BsFire } from 'react-icons/bs';
import { FiCalendar, FiTrendingUp } from 'react-icons/fi';

const StreakDisplay = ({ currentStreak, longestStreak, lastActiveDate, showDetails = true }) => {
  const getStreakColor = (streak) => {
    if (streak >= 100) return 'from-purple-500 to-pink-500';
    if (streak >= 30) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Great start!';
    if (streak < 7) return 'Keep it going!';
    if (streak < 30) return 'You\'re on fire!';
    if (streak < 100) return 'Incredible consistency!';
    return 'Legendary streak!';
  };

  return (
    <div className="space-y-4">
      {/* Main Streak Display */}
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${getStreakColor(currentStreak)} p-6`}>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              <BsFire className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-white">{currentStreak}</span>
                <span className="text-xl text-white/80">day{currentStreak !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-white/90 font-medium mt-1">{getStreakMessage(currentStreak)}</p>
            </div>
          </div>
          
          {currentStreak > 0 && (
            <div className="text-right">
              <p className="text-white/80 text-sm">Current Streak</p>
              <p className="text-white text-xs mt-1">
                {lastActiveDate ? new Date(lastActiveDate).toLocaleDateString() : 'Today'}
              </p>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4">
          {/* Longest Streak */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <FiTrendingUp className="w-4 h-4" />
              <span className="text-sm">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{longestStreak}</p>
            <p className="text-xs text-gray-500 mt-1">
              {longestStreak === currentStreak ? 'Current record!' : 'Personal best'}
            </p>
          </div>

          {/* Activity Status */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">Status</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {currentStreak > 0 ? 'Active' : 'Inactive'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentStreak > 0 ? 'Keep going!' : 'Solve a problem today'}
            </p>
          </div>
        </div>
      )}

      {/* Motivational Tips */}
      {currentStreak === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            💡 <strong>Tip:</strong> Solve at least one problem daily to build your streak!
          </p>
        </div>
      )}

      {currentStreak > 0 && currentStreak % 7 === 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-purple-400 text-sm">
            🎉 <strong>Milestone!</strong> You've reached a {currentStreak}-day streak!
          </p>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;