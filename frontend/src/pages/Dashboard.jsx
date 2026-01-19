import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiActivity, FiAward, FiClock, FiTrendingUp, 
  FiBarChart2, FiCalendar, FiCode, FiUsers 
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
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
// Dashboard.jsx - Update the fetchDashboardData function
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Only fetch if user exists and has an _id
    if (!user?._id) {
      console.log('User or user._id is undefined:', user);
      setLoading(false);
      return;
    }

    try {
      // Fetch submissions (this endpoint should exist)
      const submissionsRes = await api.get('/submissions', { 
        params: { limit: 10 } 
      }).catch(() => ({ data: { submissions: [] } })); // Fallback if fails
      
      setRecentSubmissions(submissionsRes.data?.submissions || submissionsRes.data || []);

      // Fetch upcoming contests (handle if endpoint doesn't exist)
      let contestsData = [];
      try {
        const contestsRes = await api.get('/contests', { 
          params: { status: 'upcoming', limit: 3 } 
        });
        contestsData = contestsRes.data?.contests || contestsRes.data || [];
      } catch (contestError) {
        console.log('Contests endpoint not available, using mock data');
        // Use mock data for contests
        contestsData = [
          { 
            _id: '1', 
            title: 'Weekly Coding Challenge', 
            startTime: new Date(Date.now() + 86400000), 
            duration: 120, 
            type: 'weekly', 
            participants: 1500 
          },
          { 
            _id: '2', 
            title: 'Beginner\'s Contest', 
            startTime: new Date(Date.now() + 172800000), 
            duration: 90, 
            type: 'beginner', 
            participants: 800 
          },
        ];
      }
      
      setUpcomingContests(contestsData);

      // Get user stats if endpoint exists
      let userStats = {};
      try {
        const statsRes = await api.get(`/users/${user._id}/stats`);
        userStats = statsRes.data || {};
      } catch (statsError) {
        console.log('User stats endpoint not available, using fallback');
        // Use user data from context or fallback
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

      // Update stats
      setStats({
        totalSubmissions: userStats.totalSubmissions || 0,
        acceptedSubmissions: userStats.acceptedSubmissions || 0,
        problemsSolved: userStats.problemsSolved || userStats.totalProblemsSolved || 0,
        contestsParticipated: 0, // You can add this to user stats
        currentStreak: userStats.currentStreak || userStats.streak || 0,
        maxStreak: userStats.maxStreak || 0,
        ranking: userStats.ranking || userStats.rank || 0,
        acceptanceRate: userStats.acceptanceRate || 0,
      });
      
    } catch (apiError) {
      console.error('API Error:', apiError);
      // Use mock data if all APIs fail
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
  // If no user is logged in, redirect or show message
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-4">Please log in to view dashboard</h2>
        <Link to="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
        <button 
          onClick={fetchDashboardData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Activity data for chart
  const activityData = [
    { day: 'Mon', submissions: 4 },
    { day: 'Tue', submissions: 7 },
    { day: 'Wed', submissions: 3 },
    { day: 'Thu', submissions: 9 },
    { day: 'Fri', submissions: 6 },
    { day: 'Sat', submissions: 11 },
    { day: 'Sun', submissions: 8 },
  ];

  const difficultyData = [
    { name: 'Easy', value: 25, color: '#10B981' },
    { name: 'Medium', value: 15, color: '#F59E0B' },
    { name: 'Hard', value: 5, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.username || 'User'}!
            </h1>
            <p className="text-blue-100">
              Keep coding and improving your skills. You're doing great!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{stats.currentStreak || 0} days</div>
              <div className="text-sm">Current Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your Dashboard JSX remains the same, just make sure to use optional chaining */}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FiActivity className="h-6 w-6" />}
          title="Problems Solved"
          value={stats.problemsSolved}
          change="+5 this week"
          color="blue"
        />
        <StatCard
          icon={<FiAward className="h-6 w-6" />}
          title="Global Rank"
          value={`#${stats.ranking}`}
          change="↑ 24 places"
          color="green"
        />
        <StatCard
          icon={<FiTrendingUp className="h-6 w-6" />}
          title="Acceptance Rate"
          value={`${stats.acceptanceRate}%`}
          change="+2.5%"
          color="purple"
        />
        <StatCard
          icon={<FiUsers className="h-6 w-6" />}
          title="Contests"
          value={stats.contestsParticipated}
          change="3 upcoming"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Weekly Activity
            </h3>
            <select className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
            Problems by Difficulty
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
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
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Submissions
            </h3>
            <Link
              to="/submissions"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div>
                    <Link
                      to={`/problem/${submission.problem?._id || '#'}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {submission.problem?.title || 'Unknown Problem'}
                    </Link>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{submission.language}</span>
                      <span>•</span>
                      <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${submission.status === 'accepted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                    >
                      {submission.status}
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {submission.executionTime || 0} ms
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent submissions
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Contests */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Upcoming Contests
            </h3>
            <Link
              to="/contests"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingContests.length > 0 ? (
              upcomingContests.map((contest, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {contest.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiCalendar />
                        <span>{new Date(contest.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <FiClock />
                        <span>{contest.duration} minutes</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {contest.type}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {contest.participants || 0} participants
                    </span>
                    <Link
                      to={`/contests/${contest._id || '#'}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition text-sm"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming contests
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/problems"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <FiCode className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium">Solve Problems</span>
              </Link>
              <Link
                to="/leaderboard"
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <FiBarChart2 className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium">View Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ icon, title, value, change, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{change}</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
};

export default Dashboard;