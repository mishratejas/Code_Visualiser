import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiAward, FiFilter, FiClock, FiZap } from 'react-icons/fi';
import { BsTrophy, BsMedal } from 'react-icons/bs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('global'); // global, weekly, monthly, contest
  const [timeRange, setTimeRange] = useState('all'); // all, week, month
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, timeRange]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaderboard', {
        params: {
          type: filter,
          range: timeRange,
          limit: 50
        }
      });

      const data = response.data?.data?.leaderboard || [];
      setLeaderboardData(data);
      
      // Find current user's rank
      if (user) {
        const myRank = data.findIndex(item => item.userId === user._id || item.user?.id === user._id);
        setUserRank(myRank !== -1 ? myRank + 1 : null);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Use mock data if API fails
      setLeaderboardData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      rank: i + 1,
      user: {
        id: `user_${i}`,
        username: `User${i + 1}`,
        name: `Coder ${i + 1}`,
        avatarUrl: `https://ui-avatars.com/api/?name=User${i + 1}&background=random`
      },
      stats: {
        totalSolved: 150 - i * 2,
        score: 5000 - i * 50,
        acceptanceRate: 85 - i * 0.5,
        streak: 30 - i,
        contests: 10 - Math.floor(i / 5)
      }
    }));
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <BsTrophy className="text-yellow-500 text-4xl" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
      );
    } else if (rank === 2) {
      return <BsMedal className="text-gray-400 text-3xl" />;
    } else if (rank === 3) {
      return <BsMedal className="text-amber-600 text-3xl" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
        {rank}
      </div>
    );
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/30';
    if (rank <= 10) return 'from-purple-500/10 to-pink-500/10 border-purple-500/20';
    return 'from-gray-500/5 to-gray-600/5 border-gray-500/10';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                  <BsTrophy className="text-yellow-600" />
                  Leaderboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Top coders competing worldwide
                </p>
              </div>
              {userRank && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
                    #{userRank}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your Rank
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-5"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['global', 'weekly', 'monthly', 'contest'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      filter === f
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <FiClock className="text-gray-600 dark:text-gray-400" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
          {/* 2nd Place */}
          {leaderboardData[1] && (
            <div className="relative pt-8">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-2 border-gray-400/30 text-center transform hover:scale-105 transition-all">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-gray-400 overflow-hidden">
                  <img
                    src={leaderboardData[1].user?.avatarUrl || `https://ui-avatars.com/api/?name=${leaderboardData[1].user?.username}&background=random`}
                    alt={leaderboardData[1].user?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <BsMedal className="text-gray-400 text-3xl mx-auto mb-2" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {leaderboardData[1].user?.username}
                </h3>
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text">
                  {leaderboardData[1].stats?.score || leaderboardData[1].score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {leaderboardData[0] && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-3xl blur-2xl opacity-30"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-2 border-yellow-500/50 text-center transform hover:scale-105 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <BsTrophy className="text-white text-2xl" />
                  </div>
                </div>
                <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-yellow-500 overflow-hidden mt-4">
                  <img
                    src={leaderboardData[0].user?.avatarUrl || `https://ui-avatars.com/api/?name=${leaderboardData[0].user?.username}&background=random`}
                    alt={leaderboardData[0].user?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <BsTrophy className="text-yellow-500 text-4xl mx-auto mb-2 animate-pulse" />
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                  {leaderboardData[0].user?.username}
                </h3>
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text">
                  {leaderboardData[0].stats?.score || leaderboardData[0].score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboardData[2] && (
            <div className="relative pt-16">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-2 border-amber-600/30 text-center transform hover:scale-105 transition-all">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-amber-600 overflow-hidden">
                  <img
                    src={leaderboardData[2].user?.avatarUrl || `https://ui-avatars.com/api/?name=${leaderboardData[2].user?.username}&background=random`}
                    alt={leaderboardData[2].user?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <BsMedal className="text-amber-600 text-3xl mx-auto mb-2" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {leaderboardData[2].user?.username}
                </h3>
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text">
                  {leaderboardData[2].stats?.score || leaderboardData[2].score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-5"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">User</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center">Solved</div>
                <div className="col-span-2 text-center">Acceptance</div>
                <div className="col-span-1 text-center">Streak</div>
              </div>
            </div>

            {/* Leaderboard Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboardData.map((item, index) => {
                const isCurrentUser = user && (item.userId === user._id || item.user?.id === user._id);
                const rank = item.rank || index + 1;
                
                return (
                  <div
                    key={item.userId || item.user?.id || index}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all ${
                      isCurrentUser ? 'bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-600' : ''
                    } ${rank <= 3 ? `bg-gradient-to-r ${getRankColor(rank)} border-l-4` : ''}`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      {getRankBadge(rank)}
                    </div>

                    {/* User Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                        <img
                          src={item.user?.avatarUrl || `https://ui-avatars.com/api/?name=${item.user?.username}&background=random`}
                          alt={item.user?.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {item.user?.username}
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.user?.name}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.stats?.score || item.score || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                    </div>

                    {/* Solved */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {item.stats?.totalSolved || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">problems</div>
                    </div>

                    {/* Acceptance Rate */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {item.stats?.acceptanceRate?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">acceptance</div>
                    </div>

                    {/* Streak */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <FiZap className="text-orange-500" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {item.stats?.streak || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;