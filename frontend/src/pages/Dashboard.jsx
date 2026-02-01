import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiActivity, FiAward, FiClock, FiTrendingUp, 
  FiBarChart2, FiCalendar, FiCode, FiUsers,
  FiCheckCircle, FiTarget, FiStar, FiZap,
  FiChevronRight, FiBell, FiTarget as FiTargetIcon,
  FiEye, FiDownload, FiShare2
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';

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
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        // Mock data for demonstration
        const mockStats = {
          totalSubmissions: 156,
          acceptedSubmissions: 89,
          problemsSolved: 45,
          contestsParticipated: 8,
          currentStreak: 7,
          maxStreak: 14,
          ranking: 1245,
          acceptanceRate: 67,
        };
        setStats(mockStats);

        // Mock recent submissions
        setRecentSubmissions([
          { 
            _id: '1', 
            problem: { _id: '1', title: 'Two Sum' }, 
            language: 'Python', 
            verdict: 'accepted', 
            runtime: 45, 
            createdAt: new Date(Date.now() - 7200000),
            memory: 12.5
          },
          { 
            _id: '2', 
            problem: { _id: '2', title: 'Add Two Numbers' }, 
            language: 'Java', 
            verdict: 'accepted', 
            runtime: 120, 
            createdAt: new Date(Date.now() - 86400000),
            memory: 24.3
          },
          { 
            _id: '3', 
            problem: { _id: '3', title: 'Longest Substring Without Repeating Characters' }, 
            language: 'JavaScript', 
            verdict: 'wrong', 
            runtime: 200, 
            createdAt: new Date(Date.now() - 172800000),
            memory: 18.7
          },
        ]);

        // Mock upcoming contests
        setUpcomingContests([
          { 
            _id: '1', 
            title: 'Weekly Coding Challenge', 
            startTime: new Date(Date.now() + 86400000), 
            duration: 120, 
            type: 'weekly', 
            participants: 1500,
            difficulty: 'Medium',
            prize: 'Premium Subscription'
          },
          { 
            _id: '2', 
            title: 'Beginner\'s Contest', 
            startTime: new Date(Date.now() + 172800000), 
            duration: 90, 
            type: 'beginner', 
            participants: 800,
            difficulty: 'Easy',
            prize: 'T-Shirt & Stickers'
          },
          { 
            _id: '3', 
            title: 'Advanced Algorithms', 
            startTime: new Date(Date.now() + 259200000), 
            duration: 180, 
            type: 'advanced', 
            participants: 350,
            difficulty: 'Hard',
            prize: 'Cash Prize $500'
          },
        ]);

        // Mock recommended problems
        setRecommendedProblems([
          { _id: '1', title: 'Container With Most Water', difficulty: 'Medium', acceptance: 52, tags: ['Array', 'Two Pointers'] },
          { _id: '2', title: '3Sum', difficulty: 'Medium', acceptance: 28, tags: ['Array', 'Two Pointers', 'Sorting'] },
          { _id: '3', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', acceptance: 65, tags: ['Tree', 'BFS'] },
        ]);
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        setError('Some features may not work. Using demo data.');
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Some features may not work.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      submissions: Math.floor(Math.random() * 15) + (stats.totalSubmissions > 0 ? Math.min(stats.totalSubmissions / 10, 5) : 1),
      solved: Math.floor(Math.random() * 8) + (stats.problemsSolved > 0 ? Math.min(stats.problemsSolved / 20, 3) : 0),
    }));
  };

  const activityData = getActivityData();
  const difficultyData = [
    { name: 'Easy', value: Math.max(25, Math.floor(stats.problemsSolved * 0.5)), color: '#10B981' },
    { name: 'Medium', value: Math.max(15, Math.floor(stats.problemsSolved * 0.3)), color: '#F59E0B' },
    { name: 'Hard', value: Math.max(5, Math.floor(stats.problemsSolved * 0.2)), color: '#EF4444' },
  ];
  const streakProgress = stats.currentStreak > 0 ? 
    Math.min((stats.currentStreak / stats.maxStreak) * 100, 100) : 0;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <FiTargetIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Please log in to view dashboard</h2>
          <p className="text-gray-400 mb-6">
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
        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/10 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
            <FiZap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-red-600">{error}</h2>
          <p className="text-gray-400 mb-6">Some features may be temporarily unavailable.</p>
          <Button
            onClick={fetchDashboardData}
            variant="gradient"
            className="bg-gradient-to-r from-blue-600 to-purple-600"
            startIcon={<FiZap />}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 p-8 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
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
                {stats.problemsSolved > 0 
                  ? `Great progress! You've solved ${stats.problemsSolved} problems and maintained a ${stats.currentStreak}-day streak.`
                  : 'Start your coding journey today! Solve your first problem and begin tracking your progress.'}
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                >
                  <FiCode className="h-5 w-5" />
                  Solve Problems
                </Link>
                <Link
                  to="/contests"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  <FiCalendar className="h-5 w-5" />
                  Join Contest
                </Link>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all border border-white/20">
                  <FiShare2 className="h-5 w-5" />
                  Share Progress
                </button>
              </div>
            </div>
            
            {/* Streak Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[250px]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-200">Current Streak</span>
                <div className="flex items-center gap-2">
                  <FiStar className="h-5 w-5 text-yellow-300" />
                  <span className="text-yellow-300 font-medium">{stats.currentStreak} days</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-4">{stats.currentStreak} 🔥</div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${streakProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-blue-200 flex justify-between">
                <span>Day {stats.currentStreak}</span>
                <span>Max: {stats.maxStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
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
          value={`#${stats.ranking}`}
          change={stats.ranking > 0 ? "↑ 24 places" : "Not ranked yet"}
          color="blue"
          progress={stats.ranking > 0 ? Math.min((1000 - stats.ranking) / 10, 100) : 0}
        />
        <StatCard
          icon={<FiTrendingUp className="h-6 w-6" />}
          title="Acceptance Rate"
          value={`${stats.acceptanceRate}%`}
          change={stats.acceptanceRate > 0 ? "+2.5%" : "Submit first solution"}
          color="purple"
          progress={stats.acceptanceRate}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Weekly Activity</h3>
              <p className="text-gray-400 text-sm mt-1">Submissions & Solved Problems</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <span className="text-gray-300">Submissions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <span className="text-gray-300">Solved</span>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            {chartsReady && (
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
                    formatter={(value, name) => [value, name === 'submissions' ? 'Submissions' : 'Problems Solved']}
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
            )}
          </div>
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700/50">
            <div>
              <div className="text-sm text-gray-400">Weekly Total</div>
              <div className="text-2xl font-bold text-white">
                {activityData.reduce((sum, day) => sum + day.submissions, 0)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <FiTrendingUp className="h-4 w-4" />
              <span>+15% from last week</span>
            </div>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Difficulty Distribution</h3>
              <p className="text-gray-400 text-sm mt-1">Problems solved by difficulty level</p>
            </div>
            <div className="text-sm text-gray-400">
              Total: {difficultyData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            {chartsReady && (
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
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {difficultyData.map((item, index) => (
              <div key={index} className="text-center p-3 bg-gray-700/30 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <div className="text-xl font-bold text-white">{item.value}</div>
                <div className="text-xs text-gray-400 mt-1">problems</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                  <FiCode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Recent Submissions</h3>
                  <p className="text-gray-400 text-sm mt-1">Your latest coding attempts</p>
                </div>
              </div>
              <Link
                to="/submissions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
              >
                View All
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="group flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${submission.verdict === 'accepted' 
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {submission.verdict === 'accepted' ? (
                          <FiCheckCircle className="h-5 w-5" />
                        ) : (
                          <FiClock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/problem/${submission.problem?._id}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors text-lg"
                        >
                          {submission.problem?.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                          <span className="px-3 py-1 bg-gray-800 rounded-lg">
                            {submission.language}
                          </span>
                          <span>•</span>
                          <span>{submission.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${submission.verdict === 'accepted'
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30'
                          }`}
                      >
                        {submission.verdict.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-400">{submission.runtime} ms</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{submission.memory} MB</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-700/50">
                    <FiCode className="h-8 w-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">No submissions yet</h4>
                  <p className="text-gray-500 mb-6">Start solving problems to see your submissions here!</p>
                  <Link
                    to="/problems"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <FiCode className="h-4 w-4" />
                    Browse Problems
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Problems */}
          <div className="mt-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <FiTarget className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Recommended Problems</h3>
                  <p className="text-gray-400 text-sm mt-1">Based on your progress</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => toast.success('More recommendations loaded')}
              >
                See More
              </Button>
            </div>
            <div className="space-y-4">
              {recommendedProblems.map((problem) => (
                <Link
                  key={problem._id}
                  to={`/problem/${problem._id}`}
                  className="group flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      problem.difficulty === 'Easy' 
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                        : problem.difficulty === 'Medium'
                          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <FiTarget className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {problem.title}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-xs ${
                          problem.difficulty === 'Easy'
                            ? 'bg-green-500/10 text-green-400'
                            : problem.difficulty === 'Medium'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-sm text-gray-400">{problem.acceptance}% acceptance</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {problem.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg">
                        {tag}
                      </span>
                    ))}
                    <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Upcoming Contests */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upcoming Contests</h3>
                  <p className="text-gray-400 text-sm mt-1">Join the next coding challenge</p>
                </div>
              </div>
              <Link
                to="/contests"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
              >
                View All
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingContests.length > 0 ? (
                upcomingContests.map((contest) => (
                  <div
                    key={contest._id}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-gray-700/50 hover:border-blue-500/30"
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
                              {contest.difficulty}
                            </span>
                            <span className="text-sm text-gray-400">
                              {contest.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">
                            {contest.startTime.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contest.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                          <FiUsers className="h-4 w-4" />
                          <span>{contest.participants} participants</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{contest.prize}</span>
                          <Link
                            to={`/contests/${contest._id}`}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                          >
                            Register
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-700/50">
                    <FiCalendar className="h-8 w-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">No contests scheduled</h4>
                  <p className="text-gray-500">Check back later for upcoming contests</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
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
                  <span className="font-medium text-white">Leaderboard</span>
                  <span className="text-sm text-gray-400 mt-1">Check rankings</span>
                </div>
              </Link>
              <Link
                to="/achievements"
                className="group relative overflow-hidden p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl hover:from-yellow-500/20 hover:to-amber-500/20 transition-all duration-300 border border-gray-700/50 hover:border-yellow-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 p-3 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiAward className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium text-white">Achievements</span>
                  <span className="text-sm text-gray-400 mt-1">Earn badges</span>
                </div>
              </Link>
              <button
                onClick={() => toast.success('Download started')}
                className="group relative overflow-hidden p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl hover:from-cyan-500/20 hover:to-blue-500/20 transition-all duration-300 border border-gray-700/50 hover:border-cyan-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FiDownload className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium text-white">Progress Report</span>
                  <span className="text-sm text-gray-400 mt-1">Download PDF</span>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500">
                  <FiBell className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Notifications</h3>
              </div>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full">3 new</span>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FiAward className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">New achievement unlocked!</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FiTrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Rank improved by 5 places</p>
                    <p className="text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FiCalendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">New contest starting soon</p>
                    <p className="text-xs text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors text-sm">
              View All Notifications
            </button>
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
    <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-xl ${bgColorClasses[color]} bg-opacity-20 group-hover:scale-110 transition-transform`}>
            <div className={`text-transparent bg-clip-text bg-gradient-to-r ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${
            change.includes('↑') || change.includes('+')
              ? 'bg-green-500/20 text-green-300' 
              : change.includes('Start') || change.includes('Not') || change.includes('No')
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