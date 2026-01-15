import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCalendar, FiAward, FiBarChart2, FiCode, FiUsers, FiGlobe, FiMail, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { BsTrophyFill } from 'react-icons/bs';
import { AiFillFire } from 'react-icons/ai';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, submissionsRes] = await Promise.all([
        api.get(`/users/${username}`),
        api.get(`/users/${username}/stats`),
        api.get(`/submissions/user/${username}?limit=10`)
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data);

      // Mock recent activity
      setRecentActivity([
        { type: 'submission', problem: 'Two Sum', status: 'accepted', time: '2 hours ago' },
        { type: 'contest', name: 'Weekly Contest 350', rank: 45, time: '1 day ago' },
        { type: 'achievement', title: 'Solved 100 Problems', time: '2 days ago' },
        { type: 'submission', problem: 'Binary Tree Inorder', status: 'wrong_answer', time: '3 days ago' },
        { type: 'streak', days: 15, time: '1 week ago' },
      ]);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User not found</h2>
        <Link to="/leaderboard" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
          Browse leaderboard
        </Link>
      </div>
    );
  }

  const difficultyData = [
    { name: 'Easy', solved: stats?.easySolved || 0, total: 50 },
    { name: 'Medium', solved: stats?.mediumSolved || 0, total: 100 },
    { name: 'Hard', solved: stats?.hardSolved || 0, total: 30 },
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

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-32 w-32 rounded-full border-4 border-white/20 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-4xl font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <p className="text-blue-100">{user.name}</p>
                {user.title && (
                  <p className="text-blue-100 mt-1">{user.title}</p>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-2">
                  <AiFillFire className="text-orange-300" />
                  <span className="text-xl font-bold">{stats?.streak || 0} day streak</span>
                </div>
                <p className="text-blue-100 text-sm">Current coding streak</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.globalRank || 'N/A'}</div>
                <div className="text-sm text-blue-100">Global Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.problemsSolved || 0}</div>
                <div className="text-sm text-blue-100">Problems Solved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.acceptanceRate || 0}%</div>
                <div className="text-sm text-blue-100">Acceptance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.contestsParticipated || 0}</div>
                <div className="text-sm text-blue-100">Contests</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              {user.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'submissions', 'activity', 'achievements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Difficulty Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Problems Solved by Difficulty
                </h3>
                <div className="space-y-4">
                  {difficultyData.map((diff) => {
                    const percentage = (diff.solved / diff.total) * 100;
                    return (
                      <div key={diff.name}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {diff.name}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {diff.solved} / {diff.total}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${diff.name === 'Easy'
                                ? 'bg-green-500'
                                : diff.name === 'Medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Weekly Activity
                </h3>
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
            </>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Submissions
              </h3>
              {submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div>
                        <Link
                          to={`/problem/${submission.problem?._id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {submission.problem?.title}
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
                          {submission.executionTime} ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
                  <p className="text-gray-600 dark:text-gray-400">No submissions yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {activity.type === 'submission' && (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.status === 'accepted'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                          }`}>
                          <FiCode />
                        </div>
                      )}
                      {activity.type === 'contest' && (
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center">
                          <BsTrophyFill />
                        </div>
                      )}
                      {activity.type === 'achievement' && (
                        <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300 flex items-center justify-center">
                          <FiAward />
                        </div>
                      )}
                      {activity.type === 'streak' && (
                        <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 flex items-center justify-center">
                          <AiFillFire />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {activity.type === 'submission' && (
                          <>
                            {activity.status === 'accepted' ? 'Solved' : 'Attempted'} "{activity.problem}"
                          </>
                        )}
                        {activity.type === 'contest' && (
                          <>Ranked #{activity.rank} in {activity.name}</>
                        )}
                        {activity.type === 'achievement' && (
                          <>Unlocked achievement: {activity.title}</>
                        )}
                        {activity.type === 'streak' && (
                          <>Maintained {activity.days} day coding streak</>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'First Blood', description: 'Solve your first problem', unlocked: true },
                  { title: 'Quick Learner', description: 'Solve 10 problems in a week', unlocked: true },
                  { title: 'Marathon Runner', description: 'Maintain 30-day streak', unlocked: false },
                  { title: 'Perfectionist', description: '10 consecutive accepted submissions', unlocked: true },
                  { title: 'Contest Champion', description: 'Top 10 in a contest', unlocked: false },
                  { title: 'Problem Solver', description: 'Solve 100 problems', unlocked: stats?.problemsSolved >= 100 },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${achievement.unlocked
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50'
                      }`}
                  >
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${achievement.unlocked
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                        }`}>
                        <FiAward />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              About
            </h3>
            <div className="space-y-3">
              {user.email && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiMail className="mr-3" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiMapPin className="mr-3" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiBriefcase className="mr-3" />
                  <span>{user.company}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiGlobe className="mr-3" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <FiCalendar className="mr-3" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>

            {user.bio && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bio</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Language Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Language Distribution
            </h3>
            <div className="space-y-3">
              {[
                { language: 'Python', percentage: 45, color: 'bg-blue-500' },
                { language: 'JavaScript', percentage: 30, color: 'bg-yellow-500' },
                { language: 'Java', percentage: 15, color: 'bg-red-500' },
                { language: 'C++', percentage: 10, color: 'bg-purple-500' },
              ].map((lang) => (
                <div key={lang.language}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{lang.language}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{lang.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${lang.color}`}
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contest Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Contest Performance
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.contestRating || 1500}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rating</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats?.bestContestRank || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Best Rank</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats?.contestsParticipated || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Participated</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats?.topPercentage || '0'}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Top %</div>
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