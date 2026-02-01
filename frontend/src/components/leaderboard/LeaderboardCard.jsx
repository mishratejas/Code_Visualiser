import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrophy, FiAward, FiTrendingUp, FiUser } from 'react-icons/fi';

/**
 * LeaderboardCard Component
 * Displays a user card in the leaderboard with rank and stats
 */
const LeaderboardCard = ({ 
  user, 
  rank, 
  showStats = true,
  isCurrentUser = false,
  variant = 'default' // 'default', 'podium'
}) => {
  const navigate = useNavigate();

  if (!user) return null;

  const {
    username,
    profile,
    stats = {}
  } = user;

  const {
    name = username,
    avatar,
    country
  } = profile || {};

  const {
    score = 0,
    totalProblemsSolved = 0,
    easySolved = 0,
    mediumSolved = 0,
    hardSolved = 0,
    streak = 0
  } = stats;

  // Rank medal configuration
  const getRankConfig = (position) => {
    if (position === 1) {
      return {
        bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        text: 'text-yellow-400',
        border: 'border-yellow-400/50',
        icon: '🥇',
        label: '1st Place'
      };
    }
    if (position === 2) {
      return {
        bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
        text: 'text-gray-300',
        border: 'border-gray-300/50',
        icon: '🥈',
        label: '2nd Place'
      };
    }
    if (position === 3) {
      return {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-orange-400',
        border: 'border-orange-400/50',
        icon: '🥉',
        label: '3rd Place'
      };
    }
    return {
      bg: 'bg-gray-700',
      text: 'text-gray-300',
      border: 'border-gray-600',
      icon: null,
      label: `#${position}`
    };
  };

  const rankConfig = getRankConfig(rank);

  const handleClick = () => {
    navigate(`/profile/${username}`);
  };

  if (variant === 'podium' && rank <= 3) {
    return (
      <div 
        className={`relative flex flex-col items-center p-6 rounded-xl cursor-pointer transition-all duration-300 ${
          rank === 1 ? 'bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-400/50' :
          rank === 2 ? 'bg-gradient-to-br from-gray-600/20 to-gray-700/20 border-2 border-gray-400/50' :
          'bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-2 border-orange-400/50'
        } hover:scale-105 hover:shadow-2xl`}
        onClick={handleClick}
      >
        {/* Rank Badge */}
        <div className={`absolute -top-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${rankConfig.bg} shadow-lg`}>
          {rankConfig.icon}
        </div>

        {/* Avatar */}
        <div className="mt-4 relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 rounded-full border-4 border-gray-700 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-gray-700 bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center">
              <FiUser className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Trophy Icon */}
          <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${rankConfig.bg}`}>
            <FiTrophy className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4 text-center">
          <h3 className={`text-xl font-bold ${rankConfig.text}`}>{name}</h3>
          <p className="text-gray-400 text-sm">@{username}</p>
        </div>

        {/* Score */}
        <div className="mt-4 px-6 py-2 bg-gray-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">{score.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase">Score</div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="mt-4 grid grid-cols-3 gap-2 w-full">
            <div className="bg-gray-800/50 rounded-lg p-2 text-center">
              <div className="text-green-400 font-bold">{easySolved}</div>
              <div className="text-xs text-gray-500">Easy</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 text-center">
              <div className="text-yellow-400 font-bold">{mediumSolved}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 text-center">
              <div className="text-red-400 font-bold">{hardSolved}</div>
              <div className="text-xs text-gray-500">Hard</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
        isCurrentUser 
          ? 'bg-rose-600/20 border-2 border-rose-500 hover:bg-rose-600/30' 
          : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-rose-500/50'
      }`}
      onClick={handleClick}
    >
      {/* Rank */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${rankConfig.bg} flex items-center justify-center`}>
        {rank <= 3 && rankConfig.icon ? (
          <span className="text-2xl">{rankConfig.icon}</span>
        ) : (
          <span className={`font-bold ${rankConfig.text}`}>#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full border-2 border-gray-700 object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-gray-700 bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center">
            <FiUser className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white truncate">{name}</h4>
          {isCurrentUser && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">You</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>@{username}</span>
          {country && <span>• {country}</span>}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{score.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Score</div>
          </div>
          
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-sm font-bold text-green-400">{easySolved}</div>
              <div className="text-xs text-gray-500">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-400">{mediumSolved}</div>
              <div className="text-xs text-gray-500">Med</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-red-400">{hardSolved}</div>
              <div className="text-xs text-gray-500">Hard</div>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg">
              <FiTrendingUp className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile Score */}
      <div className="md:hidden text-right">
        <div className="text-lg font-bold text-white">{score.toLocaleString()}</div>
        <div className="text-xs text-gray-400">pts</div>
      </div>
    </div>
  );
};

export default LeaderboardCard;