import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiAward, FiFilter, FiClock, FiZap, FiSearch } from 'react-icons/fi';
import { BsTrophy } from 'react-icons/bs';
import { FaMedal } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/common/ThemeToggle';
import Loader from '../components/common/Loader';

const PAGE_SIZE = 100;

const Leaderboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('global');
  const [userRank, setUserRank] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLeaderboard = useCallback(async (pageNum, reset) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get('/leaderboard', {
        params: {
          timeframe: filter === 'global' ? 'all' : filter,
          limit: PAGE_SIZE,
          page: pageNum,
        }
      });

      // axios interceptor returns response.data, so:
      // response = { success, data: { leaderboard:[...], total, ... }, message }
      const payload = response?.data || response;
      let data = [];
      let total = 0;

      if (payload?.leaderboard) {
        data = payload.leaderboard;
        total = payload.total ?? data.length;
      } else if (Array.isArray(payload)) {
        data = payload;
        total = data.length;
      }

      const normalized = data.map((item, idx) => ({
        rank: item.rank || (pageNum - 1) * PAGE_SIZE + idx + 1,
        userId: item.userId || item.user?.id || item._id,
        username: item.username || item.user?.username || item.userName || 'User' + (idx + 1),
        name: item.name || item.user?.name || item.profile?.name || '',
        avatar: item.avatar || item.user?.avatar || item.profile?.avatar || null,
        country: item.country || item.user?.country || item.profile?.country || '',
        totalSolved: item.totalSolved || item.stats?.totalSolved || item.problems_solved || 0,
        score: item.score || item.stats?.score || item.rating || 0,
        acceptanceRate: item.acceptanceRate || item.stats?.acceptanceRate || 0,
        streak: item.streak || item.stats?.streak || 0,
        contests: item.contests || item.stats?.contests || item.contests_participated || 0,
      }));

      setLeaderboardData(prev => (reset || pageNum === 1) ? normalized : [...prev, ...normalized]);
      setTotalUsers(prev => total > 0 ? total : (pageNum === 1 ? normalized.length : prev));
      setPage(pageNum);

      if (user && pageNum === 1) {
        const myIdx = normalized.findIndex(
          item => item.userId === (user._id || user.id) || item.username === user.username
        );
        setUserRank(myIdx !== -1 ? myIdx + 1 : null);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
      if (pageNum === 1) setLeaderboardData([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, user]);

  useEffect(() => {
    setPage(1);
    setLeaderboardData([]);
    setTotalUsers(0);
    fetchLeaderboard(1, true);
  }, [fetchLeaderboard]);

  const handleLoadMore = () => fetchLeaderboard(page + 1, false);

  const getRankBadge = (rank) => {
    if (rank === 1) return (
      <div className="relative">
        <BsTrophy className="text-yellow-400 text-3xl" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
      </div>
    );
    if (rank === 2) return <FaMedal className="text-gray-400 text-2xl" />;
    if (rank === 3) return <FaMedal className="text-amber-600 text-2xl" />;
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        {rank}
      </div>
    );
  };

  const getRankRowStyle = (rank) => {
    if (rank === 1) return isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return isDark ? 'bg-gray-400/5 border-gray-400/20' : 'bg-gray-50 border-gray-200';
    if (rank === 3) return isDark ? 'bg-amber-600/5 border-amber-600/20' : 'bg-amber-50 border-amber-200';
    return isDark ? 'border-gray-800/50' : 'border-gray-100';
  };

  const bgClass    = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass  = isDark ? 'text-white' : 'text-gray-900';
  const subText    = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputClass = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const filterOptions = [
    { value: 'global', label: 'All Time' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
  ];

  const filtered = leaderboardData.filter(item =>
    !searchQuery || item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
              <BsTrophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Leaderboard</h1>
              <p className={`text-sm ${subText}`}>
                {totalUsers > leaderboardData.length
                  ? `Showing ${leaderboardData.length} of ${totalUsers} coders`
                  : `${leaderboardData.length} coders ranked`}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Your Rank Banner */}
        {userRank && (
          <div className={`${isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'} rounded-xl p-4 border flex items-center gap-4`}>
            <div className="text-2xl">🎯</div>
            <div>
              <p className={`text-sm ${subText}`}>Your current ranking</p>
              <p className={`text-xl font-bold ${textClass}`}>#{userRank} globally</p>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {filtered.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[filtered[1], filtered[0], filtered[2]].map((item, idx) => {
              const positions = [2, 1, 3];
              const heights = ['h-24', 'h-32', 'h-20'];
              const golds = [
                'from-gray-400 to-gray-500',
                'from-yellow-400 to-amber-500',
                'from-amber-600 to-amber-700',
              ];
              if (!item) return <div key={idx} />;
              return (
                <div
                  key={item.userId || idx}
                  className={`${cardClass} border rounded-xl p-3 text-center flex flex-col items-center justify-end ${heights[idx]}`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${golds[idx]} flex items-center justify-center text-white font-bold text-sm mb-1`}>
                    {item.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className={`text-xs font-bold ${textClass} truncate w-full`}>{item.username}</p>
                  <p className={`text-xs ${subText}`}>{item.totalSolved} solved</p>
                  <div className={`mt-1 text-sm font-bold bg-gradient-to-r ${golds[idx]} bg-clip-text text-transparent`}>
                    #{positions[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Controls */}
        <div className={`${cardClass} rounded-xl p-4 border flex flex-col sm:flex-row gap-3`}>
          <div className="relative flex-1">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText} h-4 w-4`} />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 ${inputClass} rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>

          {/* Table Header */}
          <div className={`grid grid-cols-12 px-5 py-3 text-xs font-semibold uppercase tracking-wider ${subText} ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-2 text-center">Solved</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Streak</div>
          </div>

          {/* Rows */}
          <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-50'}`}>
            {filtered.length > 0 ? filtered.map((item) => {
              const isMe = item.username === user?.username;
              return (
                <div
                  key={item.userId || item.rank}
                  className={`grid grid-cols-12 px-5 py-3.5 border ${getRankRowStyle(item.rank)} ${
                    isMe ? (isDark ? 'bg-rose-500/10' : 'bg-rose-50') : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center">{getRankBadge(item.rank)}</div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                      {item.avatar
                        ? <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                        : item.username?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <div className={`font-semibold text-sm ${textClass} flex items-center gap-1 flex-wrap`}>
                        <span className="truncate">{item.username}</span>
                        {isMe && <span className="text-xs text-rose-500">(you)</span>}
                      </div>
                      {item.name && <div className={`text-xs ${subText} truncate`}>{item.name}</div>}
                    </div>
                  </div>
                  <div className={`col-span-2 flex items-center justify-center font-semibold ${textClass}`}>
                    {item.totalSolved}
                  </div>
                  <div className="col-span-2 flex items-center justify-center font-semibold text-rose-500">
                    {(item.score || 0).toLocaleString()}
                  </div>
                  <div className={`col-span-2 flex items-center justify-center gap-1 ${subText}`}>
                    {item.streak > 0 && <span>🔥</span>}
                    <span className="text-sm">{item.streak}d</span>
                  </div>
                </div>
              );
            }) : (
              <div className={`py-16 text-center ${subText}`}>
                <BsTrophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No rankings found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {!searchQuery && leaderboardData.length > 0 && leaderboardData.length < totalUsers && (
            <div className={`px-5 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'} text-center`}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loadingMore
                  ? <><FiTrendingUp className="h-4 w-4 animate-spin" />Loading…</>
                  : <>Load More ({totalUsers - leaderboardData.length} remaining)</>
                }
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Leaderboard;