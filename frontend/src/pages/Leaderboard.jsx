import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiTrendingUp, FiUsers, FiSearch, FiFilter } from 'react-icons/fi';
import { BsTrophyFill } from 'react-icons/bs';
import { AiFillFire } from 'react-icons/ai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all_time');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRank, setUserRank] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const timeRanges = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'all_time', label: 'All Time' },
  ];

  useEffect(() => {
    fetchLeaderboard();
    fetchUserStats();
  }, [timeRange]);

const fetchLeaderboard = async () => {
  try {
    setLoading(true);
    const response = await api.get('/leaderboard', { params: { range: timeRange } });
    
    // FIXED: Handle different response structures
    let leaderboardData = [];
    
    if (response && response.data) {
      // Case 1: { data: { leaderboard: [...] } }
      if (response.data.leaderboard && Array.isArray(response.data.leaderboard)) {
        leaderboardData = response.data.leaderboard;
      }
      // Case 2: { data: [...] } - direct array
      else if (Array.isArray(response.data)) {
        leaderboardData = response.data;
      }
      // Case 3: Direct array response
      else if (Array.isArray(response)) {
        leaderboardData = response;
      }
      else {
        console.warn('Unexpected leaderboard response format:', response);
        leaderboardData = [];
      }
    }
    
    setLeaderboard(leaderboardData);
    
    // Find current user's rank
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser && leaderboardData.length > 0) {
      const rank = leaderboardData.findIndex(user => user._id === currentUser._id || user._id === currentUser.id);
      setUserRank(rank >= 0 ? rank + 1 : null);
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    toast.error('Failed to fetch leaderboard');
    setLeaderboard([]); // Set empty array on error
  } finally {
    setLoading(false);
  }
};
  const fetchUserStats = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        const response = await api.get(`/users/${currentUser.id}/stats`);
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats');
    }
  };

 const filteredLeaderboard = Array.isArray(leaderboard) 
  ? leaderboard.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : [];


  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-500 to-purple-600';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <BsTrophyFill className="text-yellow-400" />;
    if (rank === 2) return <BsTrophyFill className="text-gray-400" />;
    if (rank === 3) return <BsTrophyFill className="text-orange-400" />;
    if (rank <= 10) return <FiAward className="text-blue-400" />;
    if (rank <= 100) return <FiTrendingUp className="text-green-400" />;
    return null;
  };

  if (loading) {
    return <Loader />;
  }

  // Prepare data for chart (top 10 users)
  const chartData = filteredLeaderboard.slice(0, 10).map((user, index) => ({
    name: user.username,
    score: user.score,
    rank: index + 1,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Top performers and coding champions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
            />
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && userStats && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiAward size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Your Rank</h3>
                  <p className="text-blue-100">Keep coding to improve your rank!</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-3xl font-bold">#{userRank}</div>
                  <div className="text-sm text-blue-100">Global Rank</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{userStats.score}</div>
                  <div className="text-sm text-blue-100">Total Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{userStats.problemsSolved}</div>
                  <div className="text-sm text-blue-100">Problems Solved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{userStats.acceptanceRate}%</div>
                  <div className="text-sm text-blue-100">Acceptance Rate</div>
                </div>
              </div>
            </div>
            <Link
              to={`/profile/${JSON.parse(localStorage.getItem('user')).username}`}
              className="mt-4 md:mt-0 px-6 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
            >
              View Profile
            </Link>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {filteredLeaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredLeaderboard.slice(0, 3).map((user, index) => (
            <div
              key={user._id}
              className={`bg-gradient-to-b ${getRankColor(index + 1)} rounded-2xl p-6 text-white transform ${index === 1 ? '-translate-y-4' : ''
                }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {index + 1}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    {getRankIcon(index + 1)}
                  </div>
                </div>
                <Link
                  to={`/profile/${user.username}`}
                  className="text-xl font-bold hover:opacity-90"
                >
                  {user.username}
                </Link>
                <p className="text-white/80 mt-1">{user.name}</p>
                <div className="mt-4 text-3xl font-bold">{user.score}</div>
                <div className="text-sm">Points</div>
                <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <div className="text-lg font-bold">{user.problemsSolved}</div>
                    <div className="text-xs">Solved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{user.acceptanceRate}%</div>
                    <div className="text-xs">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="col-span-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                Rank
              </div>
              <div className="col-span-5 text-sm font-medium text-gray-600 dark:text-gray-400">
                User
              </div>
              <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
                Solved
              </div>
              <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
                Score
              </div>
              <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
                Streak
              </div>
            </div>

            {/* Leaderboard Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeaderboard.slice(3).map((user, index) => (
                <div
                  key={user._id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {index + 4}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          to={`/profile/${user.username}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {user.username}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.problemsSolved}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Problems
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Points
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center">
                      <AiFillFire className="text-orange-500 mr-1" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.streak || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats and Chart */}
        <div className="space-y-6">
          {/* Top Performers Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value, 'Score']}
                />
                <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Global Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Global Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiUsers className="mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Users
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {leaderboard.length.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiTrendingUp className="mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Average Score
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {Math.round(leaderboard.reduce((sum, user) => sum + user.score, 0) / leaderboard.length)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiAward className="mr-3 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Problems Solved
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {leaderboard.reduce((sum, user) => sum + user.problemsSolved, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              🚀 Tips to Rank Up
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Solve problems daily to maintain streak
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Focus on accuracy over quantity
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Participate in contests for bonus points
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Try harder problems for more points
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;