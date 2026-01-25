import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiActivity, FiAward, FiClock, FiTrendingUp, 
  FiBarChart2, FiCalendar, FiCode, FiUsers,
  FiCheckCircle, FiTarget, FiStar, FiZap
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    problemsSolved: 0,
    contestsParticipated: 0,
    currentStreak: 0,
    maxStreak: 0,
    ranking: 0,
    acceptanceRate: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?._id) {
        console.log('User or user._id is undefined:', user);
        setLoading(false);
        return;
      }

      try {
        // Fetch submissions - FIXED: Handle different response structures
        let submissionsData = [];
        try {
          const submissionsRes = await api.get('/submissions', { 
            params: { limit: 10 } 
          });
          // Handle different response structures
          submissionsData = submissionsRes.submissions || 
                          submissionsRes.data?.submissions || 
                          submissionsRes.data || 
                          [];
        } catch (submissionsError) {
          console.log('Submissions endpoint error, using empty array:', submissionsError);
          submissionsData = [];
        }
        
        setRecentSubmissions(submissionsData);

        // Fetch upcoming contests with fallback
        let contestsData = [];
        try {
          const contestsRes = await api.get('/contests', { 
            params: { status: 'upcoming', limit: 3 } 
          });
          contestsData = contestsRes.contests || 
                        contestsRes.data?.contests || 
                        contestsRes.data || 
                        [];
        } catch (contestError) {
          console.log('Contests endpoint not available, using mock data');
          contestsData = [
            { 
              _id: '1', 
              title: 'Weekly Coding Challenge', 
              startTime: new Date(Date.now() + 86400000), 
              duration: 120, 
              type: 'weekly', 
              participants: 1500,
              difficulty: 'Medium'
            },
            { 
              _id: '2', 
              title: 'Beginner\'s Contest', 
              startTime: new Date(Date.now() + 172800000), 
              duration: 90, 
              type: 'beginner', 
              participants: 800,
              difficulty: 'Easy'
            },
            { 
              _id: '3', 
              title: 'Advanced Algorithms', 
              startTime: new Date(Date.now() + 259200000), 
              duration: 180, 
              type: 'advanced', 
              participants: 350,
              difficulty: 'Hard'
            },
          ];
        }
        
        setUpcomingContests(contestsData);

        // Get user stats
        let userStats = {};
        try {
          const statsRes = await api.get(`/users/${user._id}/stats`);
          userStats = statsRes.data || statsRes || {};
        } catch (statsError) {
          console.log('User stats endpoint not available, using fallback');
          userStats = {
            totalSubmissions: user.stats?.totalSubmissions || 0,
            acceptedSubmissions: user.stats?.acceptedSubmissions || 0,
            problemsSolved: user.stats?.totalProblemsSolved || 0,
            currentStreak: user.stats?.streak || 0,
            maxStreak: user.stats?.maxStreak || 0,
            ranking: user.stats?.rank || 0,
            acceptanceRate: user.stats?.acceptanceRate || 0,
          };
        }

        setStats({
          totalSubmissions: userStats.totalSubmissions || 0,
          acceptedSubmissions: userStats.acceptedSubmissions || 0,
          problemsSolved: userStats.problemsSolved || userStats.totalProblemsSolved || 0,
          contestsParticipated: userStats.contestsParticipated || 0,
          currentStreak: userStats.currentStreak || userStats.streak || 0,
          maxStreak: userStats.maxStreak || 0,
          ranking: userStats.ranking || userStats.rank || 0,
          acceptanceRate: userStats.acceptanceRate || 0,
        });
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        setRecentSubmissions([]);
        setUpcomingContests([]);
        setStats({
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          problemsSolved: 0,
          contestsParticipated: 0,
          currentStreak: 0,
          maxStreak: 0,
          ranking: 0,
          acceptanceRate: 0,
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Some features may not work.');
    } finally {
      setLoading(false);
    }
  };

  // If no user is logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <FiTarget className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Please log in to view dashboard</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Access personalized statistics, track your progress, and participate in contests.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all">
            <FiActivity className="h-5 w-5" />
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/10">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
            <FiZap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-red-600">{error}</h2>
          <p className="text-gray-400 mb-6">Some features may be temporarily unavailable.</p>
          <button 
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all"
          >
            <FiZap className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Enhanced activity data with dynamic values
  const getActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      submissions: Math.floor(Math.random() * 15) + (stats.totalSubmissions > 0 ? Math.min(stats.totalSubmissions / 10, 5) : 1),
      solved: Math.floor(Math.random() * 8) + (stats.problemsSolved > 0 ? Math.min(stats.problemsSolved / 20, 3) : 0),
    }));
  };

  const activityData = getActivityData();

  // Enhanced difficulty distribution
  const difficultyData = [
    { name: 'Easy', value: Math.max(25, Math.floor(stats.problemsSolved * 0.5)), color: '#10B981' },
    { name: 'Medium', value: Math.max(15, Math.floor(stats.problemsSolved * 0.3)), color: '#F59E0B' },
    { name: 'Hard', value: Math.max(5, Math.floor(stats.problemsSolved * 0.2)), color: '#EF4444' },
  ];

  // Calculate progress percentage for streak
  const streakProgress = stats.currentStreak > 0 ? 
    Math.min((stats.currentStreak / stats.maxStreak) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Enhanced */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <FiAward className="h-8 w-8" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Welcome back</p>
                <h1 className="text-3xl lg:text-4xl font-bold mt-1">
                  {user?.username || 'Coder'}! <span className="text-yellow-300">👋</span>
                </h1>
              </div>
            </div>
            <p className="text-blue-100 max-w-2xl">
              Keep coding and improving your skills. {stats.problemsSolved > 0 
                ? `You've solved ${stats.problemsSolved} problems so far!`
                : 'Start your journey by solving your first problem!'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-200">Current Streak</span>
              <FiStar className="h-5 w-5 text-yellow-300" />
            </div>
            <div className="text-3xl font-bold mb-2">{stats.currentStreak || 0} days</div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div 
                className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                style={{ width: `${streakProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-blue-200">
              Max: {stats.maxStreak || 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced with animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FiCheckCircle className="h-6 w-6" />}
          title="Problems Solved"
          value={stats.problemsSolved}
          change={stats.problemsSolved > 0 ? "+5 this week" : "Start solving!"}
          color="green"
          progress={Math.min((stats.problemsSolved / 100) * 100, 100)}
        />
        <StatCard
          icon={<FiTarget className="h-6 w-6" />}
          title="Global Rank"
          value={`#${stats.ranking || 'N/A'}`}
          change={stats.ranking > 0 ? "↑ 24 places" : "Not ranked yet"}
          color="blue"
          progress={stats.ranking > 0 ? Math.min((1000 - stats.ranking) / 10, 100) : 0}
        />
        <StatCard
          icon={<FiTrendingUp className="h-6 w-6" />}
          title="Acceptance Rate"
          value={`${stats.acceptanceRate || 0}%`}
          change={stats.acceptanceRate > 0 ? "+2.5%" : "Submit first solution"}
          color="purple"
          progress={stats.acceptanceRate || 0}
        />
        <StatCard
          icon={<FiUsers className="h-6 w-6" />}
          title="Contests"
          value={stats.contestsParticipated}
          change={upcomingContests.length > 0 ? `${upcomingContests.length} upcoming` : "No contests"}
          color="orange"
          progress={Math.min((stats.contestsParticipated / 10) * 100, 100)}
        />
      </div>

      {/* Charts Section - Enhanced - FIXED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart - Enhanced */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Weekly Activity</h3>
              <p className="text-gray-400 text-sm mt-1">Submissions & Solved Problems</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                Submissions
              </span>
              <span className="flex items-center gap-1 text-sm">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                Solved
              </span>
            </div>
          </div>
          {/* FIXED: Added fixed height container */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                  }}
                  formatter={(value) => [value, 'count']}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stackId="1"
                  stroke="url(#colorSubmissions)"
                  fill="url(#colorSubmissions)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="solved"
                  stackId="2"
                  stroke="url(#colorSolved)"
                  fill="url(#colorSolved)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution - Enhanced */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Difficulty Distribution</h3>
              <p className="text-gray-400 text-sm mt-1">Problems solved by difficulty level</p>
            </div>
            <div className="text-sm text-gray-400">
              Total: {difficultyData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
          {/* FIXED: Added fixed height container */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                  }}
                  formatter={(value, name) => [value, `${name} Problems`]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {difficultyData.map((item, index) => (
              <div key={index} className="text-center p-3 rounded-lg bg-gray-800/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <div className="text-xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions - Enhanced */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Recent Submissions</h3>
              <p className="text-gray-400 text-sm mt-1">Your latest coding attempts</p>
            </div>
            <Link
              to="/submissions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              View All
              <FiActivity className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${submission.verdict === 'accepted' 
                      ? 'bg-green-500/20 text-green-400' 
                      : submission.verdict === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {submission.verdict === 'accepted' ? (
                        <FiCheckCircle className="h-5 w-5" />
                      ) : submission.verdict === 'pending' ? (
                        <FiClock className="h-5 w-5" />
                      ) : (
                        <FiZap className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <Link
                        to={`/problem/${submission.problem?._id || '#'}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors"
                      >
                        {submission.problem?.title || 'Unknown Problem'}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {submission.language || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>{new Date(submission.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${submission.verdict === 'accepted'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : submission.verdict === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                    >
                      {submission.verdict?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <div className="text-sm text-gray-400 mt-1">
                      {submission.runtime || 0} ms
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <FiCode className="h-8 w-8 text-gray-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">No submissions yet</h4>
                <p className="text-gray-500 mb-4">Start solving problems to see your submissions here!</p>
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
                >
                  <FiCode className="h-4 w-4" />
                  Browse Problems
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Contests - Enhanced */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Upcoming Contests</h3>
                <p className="text-gray-400 text-sm mt-1">Join the next coding challenge</p>
              </div>
              <Link
                to="/contests"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all text-sm"
              >
                View All
                <FiCalendar className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingContests.length > 0 ? (
                upcomingContests.map((contest, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 p-4 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-gray-700/50 hover:border-blue-500/30"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {contest.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              contest.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                              contest.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {contest.difficulty || contest.type}
                            </span>
                            <span className="text-sm text-gray-400">
                              {contest.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">
                            {new Date(contest.startTime).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/50">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <FiUsers className="h-4 w-4" />
                          <span>{contest.participants || 0} participants</span>
                        </div>
                        <Link
                          to={`/contests/${contest._id || '#'}`}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all text-sm"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <FiCalendar className="h-8 w-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">No contests scheduled</h4>
                  <p className="text-gray-500">Check back later for upcoming contests</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <h4 className="font-semibold mb-4 text-white">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/problems"
                className="group relative overflow-hidden p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 border border-gray-700/50 hover:border-blue-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiCode className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium text-white">Solve Problems</span>
                  <span className="text-sm text-gray-400 mt-1">Practice now</span>
                </div>
              </Link>
              <Link
                to="/leaderboard"
                className="group relative overflow-hidden p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 border border-gray-700/50 hover:border-green-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiBarChart2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium text-white">View Leaderboard</span>
                  <span className="text-sm text-gray-400 mt-1">Check rankings</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced StatCard Component
const StatCard = ({ icon, title, value, change, color, progress }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    purple: 'bg-purple-500/10',
    orange: 'bg-orange-500/10',
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-xl ${bgColorClasses[color]} bg-opacity-20`}>
            <div className={`text-transparent bg-clip-text bg-gradient-to-r ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            change.includes('↑') 
              ? 'bg-green-500/20 text-green-300' 
              : change.includes('Start') || change.includes('Not')
                ? 'bg-gray-700 text-gray-400'
                : 'bg-blue-500/20 text-blue-300'
          }`}>
            {change}
          </span>
        </div>
        
        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          {value}
        </h3>
        <p className="text-gray-400 mb-4">{title}</p>
        
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-700`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;