import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiCalendar, FiAward, FiBarChart2, FiCode, FiUsers, FiGlobe, FiMail, FiMapPin, FiBriefcase,
  FiStar, FiTrendingUp, FiZap, FiActivity, FiTarget, FiCheckCircle, FiClock, FiHeart, FiUser
} from 'react-icons/fi';
import { BsTrophyFill, BsFire } from 'react-icons/bs';
import { AiFillFire } from 'react-icons/ai';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const userRes = await api.get(`/users/${username}`);
      let userData = userRes.data?.user || userRes.data || userRes;
      
      if (!userData) {
        throw new Error('User data not found');
      }
      
      setUser(userData);
      
      // Get user stats
      const userId = userData._id || userData.id;
      if (userId) {
        try {
          const statsRes = await api.get(`/users/${userId}/stats`);
          const statsData = statsRes.data || statsRes;
          setStats({
            easySolved: statsData.easySolved || 0,
            mediumSolved: statsData.mediumSolved || 0,
            hardSolved: statsData.hardSolved || 0,
            problemsSolved: statsData.totalProblemsSolved || 0,
            streak: statsData.streak || 0,
            acceptanceRate: statsData.acceptanceRate || 0,
            globalRank: statsData.rank || 'N/A',
            contestRating: statsData.score || 1500,
            contestsParticipated: statsData.contestsParticipated || 0,
            bestContestRank: statsData.bestContestRank || 'N/A',
            totalSubmissions: statsData.totalSubmissions || 0,
            topPercentage: statsData.topPercentage || '0',
          });
        } catch (statsError) {
          console.log('Using fallback stats');
          setStats({
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            problemsSolved: 0,
            streak: 0,
            acceptanceRate: 0,
            globalRank: 'N/A',
            contestRating: 1500,
            contestsParticipated: 0,
            bestContestRank: 'N/A',
            totalSubmissions: 0,
            topPercentage: '0',
          });
        }
      }
      
      // Mock data for demo
      setSubmissions([
        { _id: '1', problem: { _id: '1', title: 'Two Sum' }, language: 'Python', status: 'accepted', executionTime: 45, submittedAt: new Date(Date.now() - 7200000) },
        { _id: '2', problem: { _id: '2', title: 'Add Two Numbers' }, language: 'Java', status: 'accepted', executionTime: 120, submittedAt: new Date(Date.now() - 86400000) },
        { _id: '3', problem: { _id: '3', title: 'Longest Substring' }, language: 'JavaScript', status: 'wrong', executionTime: 200, submittedAt: new Date(Date.now() - 172800000) },
      ]);
      
      setRecentActivity([
        { type: 'submission', problem: 'Two Sum', status: 'accepted', time: '2 hours ago', icon: '✅' },
        { type: 'achievement', title: 'Quick Learner', description: 'Solved 10 problems', time: '1 day ago', icon: '🏆' },
        { type: 'streak', days: 7, time: 'Today', icon: '🔥' },
        { type: 'contest', rank: 25, name: 'Weekly Challenge', time: '3 days ago', icon: '📈' },
      ]);
      
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = () => {
    setFollowed(!followed);
    toast.success(followed ? `Unfollowed ${username}` : `Following ${username}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
          <FiUsers className="h-12 w-12 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">User not found</h2>
        <p className="text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
        <Link to="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all">
          Browse Leaderboard
        </Link>
      </div>
    );
  }

  const difficultyData = [
    { name: 'Easy', solved: stats?.easySolved || 0, total: 50, color: '#10B981' },
    { name: 'Medium', solved: stats?.mediumSolved || 0, total: 100, color: '#F59E0B' },
    { name: 'Hard', solved: stats?.hardSolved || 0, total: 30, color: '#EF4444' },
  ];

  const activityData = [
    { day: 'Mon', submissions: 4 },
    { day: 'Tue', submissions: 7 },
    { day: 'Wed', submissions: 3 },
    { day: 'Thu', submissions: 9 },
    { day: 'Fri', submissions: 6 },
    { day: 'Sat', submissions: 11 },
    { day: 'Sun', submissions: 8 },
  ];

  const languageData = [
    { language: 'Python', percentage: 45, color: '#3B82F6' },
    { language: 'JavaScript', percentage: 30, color: '#F59E0B' },
    { language: 'Java', percentage: 15, color: '#EF4444' },
    { language: 'C++', percentage: 10, color: '#8B5CF6' },
  ];

  const skillData = [
    { subject: 'Arrays', value: 95 },
    { subject: 'DP', value: 75 },
    { subject: 'Trees', value: 85 },
    { subject: 'Graphs', value: 65 },
    { subject: 'Strings', value: 90 },
    { subject: 'Math', value: 80 },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="h-40 w-40 rounded-2xl border-4 border-white/20 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl font-bold shadow-2xl">
                  {user.username?.charAt(0).toUpperCase()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
                <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full shadow-lg">
                  <AiFillFire className="h-5 w-5" />
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
                  <BsTrophyFill className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-4xl font-bold">{user.username}</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                      <BsFire className="h-4 w-4 text-orange-300" />
                      <span className="font-semibold">{stats?.streak || 0} day streak</span>
                    </div>
                  </div>
                  <p className="text-blue-100 text-lg">{user.name || 'Code Enthusiast'}</p>
                  {user.title && (
                    <p className="text-blue-200 mt-2">{user.title}</p>
                  )}
                  
                  {/* Follow Button */}
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={toggleFollow}
                      className={`px-6 py-2 rounded-xl font-medium transition-all ${followed
                        ? 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg'
                      }`}
                    >
                      {followed ? 'Following' : 'Follow'}
                    </button>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-blue-100">
                        <strong className="text-white">1.2k</strong> Followers
                      </span>
                      <span className="text-blue-100">
                        <strong className="text-white">450</strong> Following
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Ranking Badge */}
                <div className="mt-6 lg:mt-0">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center min-w-[150px]">
                    <div className="text-3xl font-bold">#{stats?.globalRank || 'N/A'}</div>
                    <div className="text-sm text-blue-200 mt-1">Global Rank</div>
                    <div className="flex items-center justify-center gap-1 mt-2 text-green-400 text-sm">
                      <FiTrendingUp className="h-4 w-4" />
                      <span>↑ 24 places</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { value: stats?.problemsSolved || 0, label: 'Problems Solved', icon: <FiCheckCircle />, color: 'from-green-500 to-emerald-500' },
                  { value: `${stats?.acceptanceRate || 0}%`, label: 'Acceptance Rate', icon: <FiTarget />, color: 'from-blue-500 to-cyan-500' },
                  { value: stats?.contestsParticipated || 0, label: 'Contests', icon: <FiAward />, color: 'from-purple-500 to-pink-500' },
                  { value: stats?.totalSubmissions || 0, label: 'Submissions', icon: <FiCode />, color: 'from-orange-500 to-amber-500' },
                ].map((stat, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} mb-3`}>
                      <div className="text-white">{stat.icon}</div>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-blue-200 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {user.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm hover:bg-white/20 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {['overview', 'submissions', 'activity', 'achievements', 'skills', 'contests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-4 font-medium capitalize whitespace-nowrap transition-all ${activeTab === tab
                  ? 'text-white border-b-2 border-blue-500 bg-gradient-to-t from-blue-500/10 to-transparent'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                }`}
            >
              {tab === 'overview' && <FiBarChart2 className="h-4 w-4" />}
              {tab === 'submissions' && <FiCode className="h-4 w-4" />}
              {tab === 'activity' && <FiActivity className="h-4 w-4" />}
              {tab === 'achievements' && <FiAward className="h-4 w-4" />}
              {tab === 'skills' && <FiTarget className="h-4 w-4" />}
              {tab === 'contests' && <BsTrophyFill className="h-4 w-4" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Difficulty Distribution */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                      <FiBarChart2 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Problems Solved by Difficulty
                    </h3>
                  </div>
                  <div className="text-sm text-gray-400">
                    Total: {difficultyData.reduce((sum, item) => sum + item.solved, 0)}
                  </div>
                </div>
                <div className="space-y-6">
                  {difficultyData.map((diff) => {
                    const percentage = (diff.solved / diff.total) * 100;
                    return (
                      <div key={diff.name} className="space-y-3">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: diff.color }}></div>
                              <span className="font-medium text-gray-300">{diff.name}</span>
                            </div>
                            <span className="text-sm text-gray-400">{diff.solved}/{diff.total}</span>
                          </div>
                          <span className="font-medium text-white">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: diff.color,
                              boxShadow: `0 0 20px ${diff.color}40`
                            }}
                          ></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <FiActivity className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Weekly Activity
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">Last 7 days</span>
                    <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                      <span className="text-blue-400">+12% from last week</span>
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)',
                        }}
                        formatter={(value) => [value, 'Submissions']}
                      />
                      <Line
                        type="monotone"
                        dataKey="submissions"
                        stroke="url(#colorGradient)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#8B5CF6' }}
                        activeDot={{ r: 6, fill: '#8B5CF6' }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <FiCode className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Recent Submissions
                  </h3>
                </div>
                <Button
                  variant="outline"
                  onClick={() => toast.success('View all submissions')}
                >
                  View All
                </Button>
              </div>
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission._id}
                      className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${submission.status === 'accepted'
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                          }`}>
                          {submission.status === 'accepted' ? (
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
                            <span>{submission.submittedAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${submission.status === 'accepted'
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30'
                            }`}
                        >
                          {submission.status.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-gray-400">{submission.executionTime} ms</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">12.5 MB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center">
                    <FiCode className="h-10 w-10 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">No submissions yet</h4>
                  <p className="text-gray-500">Start solving problems to see submissions here!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                    <FiActivity className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Recent Activity
                  </h3>
                </div>
                <div className="text-sm text-gray-400">Last 30 days</div>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all group"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <span className="text-xl">{activity.icon}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="font-medium text-white text-lg">
                        {activity.type === 'submission' && (
                          <>
                            Solved "<span className="text-blue-400">{activity.problem}</span>"
                          </>
                        )}
                        {activity.type === 'achievement' && (
                          <>Unlocked achievement: <span className="text-yellow-400">{activity.title}</span></>
                        )}
                        {activity.type === 'streak' && (
                          <>
                            Maintained <span className="text-orange-400">{activity.days} day</span> coding streak
                          </>
                        )}
                        {activity.type === 'contest' && (
                          <>
                            Ranked <span className="text-green-400">#{activity.rank}</span> in {activity.name}
                          </>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-gray-400 mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-500">{activity.time}</span>
                        {activity.type === 'submission' && activity.status === 'accepted' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Accepted</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
                    <FiAward className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Achievements
                  </h3>
                </div>
                <div className="text-sm text-gray-400">
                  {6} total • {3} unlocked
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'First Blood', description: 'Solve your first problem', unlocked: true, icon: '🩸', points: 50 },
                  { title: 'Quick Learner', description: 'Solve 10 problems in a week', unlocked: true, icon: '🚀', points: 100 },
                  { title: 'Marathon Runner', description: 'Maintain 30-day streak', unlocked: false, icon: '🏃', points: 200 },
                  { title: 'Perfectionist', description: '10 consecutive accepted submissions', unlocked: true, icon: '✨', points: 150 },
                  { title: 'Contest Champion', description: 'Top 10 in a contest', unlocked: false, icon: '🏆', points: 300 },
                  { title: 'Problem Solver', description: 'Solve 100 problems', unlocked: stats?.problemsSolved >= 100, icon: '💪', points: 500 },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border transition-all hover:scale-[1.02] ${achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30'
                        : 'bg-gray-800/30 border-gray-700/50 opacity-60'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">
                            {achievement.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-400">{achievement.description}</span>
                            {achievement.unlocked && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Unlocked</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">{achievement.points} pts</div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-400">
                        {achievement.unlocked ? 'Unlocked recently' : 'Not achieved yet'}
                      </div>
                      {!achievement.unlocked && (
                        <div className="text-xs text-gray-500">
                          {achievement.title === 'Problem Solver' ? `${stats?.problemsSolved || 0}/100` : '0%'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                    <FiTarget className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Skill Analysis
                  </h3>
                </div>
                <div className="text-sm text-gray-400">Based on 100+ submissions</div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                    <PolarRadiusAxis stroke="#9CA3AF" />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* User Details */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                <FiUser className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                About
              </h3>
            </div>
            <div className="space-y-4">
              {user.email && (
                <div className="flex items-center text-gray-300">
                  <FiMail className="mr-3 text-blue-400" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center text-gray-300">
                  <FiMapPin className="mr-3 text-green-400" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center text-gray-300">
                  <FiBriefcase className="mr-3 text-purple-400" />
                  <span>{user.company}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center text-gray-300">
                  <FiGlobe className="mr-3 text-cyan-400" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-300">
                <FiCalendar className="mr-3 text-yellow-400" />
                <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {user.bio && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-medium text-white mb-3">Bio</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Language Stats */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                  <FiCode className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Language Distribution
                </h3>
              </div>
              <div className="text-sm text-gray-400">Top 4</div>
            </div>
            <div className="space-y-4">
              {languageData.map((lang) => (
                <div key={lang.language} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">{lang.language}</span>
                    <span className="text-sm text-gray-400">{lang.percentage}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${lang.percentage}%`,
                        backgroundColor: lang.color,
                        boxShadow: `0 0 10px ${lang.color}40`
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contest Performance */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500">
                  <BsTrophyFill className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Contest Performance
                </h3>
              </div>
              <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                <span className="text-sm text-blue-400">Active</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  {stats?.contestRating || 1500}
                </div>
                <div className="text-sm text-gray-400 mt-1">Rating</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-sm">
                  <FiTrendingUp className="h-4 w-4" />
                  <span>+150 this month</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-700/30 rounded-xl">
                  <div className="text-xl font-bold text-white">
                    {stats?.bestContestRank || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Best Rank</div>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-xl">
                  <div className="text-xl font-bold text-white">
                    {stats?.contestsParticipated || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Participated</div>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-xl">
                  <div className="text-xl font-bold text-white">
                    {stats?.topPercentage || '0'}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Top %</div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Current Season</div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Progress to next tier</span>
                  <span className="text-blue-400">65%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                  <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;