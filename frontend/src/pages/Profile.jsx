import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiAward, FiBarChart2, FiCode, FiGlobe, FiGithub,
  FiStar, FiTrendingUp, FiZap, FiTarget, FiCheckCircle, FiClock,
  FiUser, FiSettings, FiEdit2, FiMapPin, FiBriefcase
} from 'react-icons/fi';
import { BsTrophyFill, BsFire } from 'react-icons/bs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartsReady, setChartsReady] = useState(false);

  const isOwnProfile = currentUser?.username === username || !username;

  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const targetUsername = username || currentUser?.username;
      
      if (!targetUsername) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      const userRes = await api.get(`/users/${targetUsername}`);
      const userData = userRes.data?.user || userRes.data?.data?.user || userRes.data || userRes;

      if (!userData || typeof userData !== 'object') throw new Error('Invalid profile data');
      setProfileData(userData);

      const userId = userData._id || userData.id;

      // Fetch stats and recent submissions in parallel
      const [statsRes, subsRes] = await Promise.allSettled([
        api.get(`/users/${userId}/stats`),
        api.get('/submissions', { params: { limit: 10, page: 1 } }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data?.data || statsRes.value.data || {};
        setStats({
          easySolved: s.easySolved || 0,
          mediumSolved: s.mediumSolved || 0,
          hardSolved: s.hardSolved || 0,
          totalSolved: s.totalProblemsSolved || s.problemsSolved || 0,
          streak: s.streak || 0,
          maxStreak: s.maxStreak || 0,
          acceptanceRate: s.acceptanceRate ? Math.round(s.acceptanceRate) : 0,
          globalRank: s.rank || 'N/A',
          score: s.score || 0,
          contestsParticipated: s.contestsParticipated || 0,
          totalSubmissions: s.totalSubmissions || 0,
        });
      } else {
        setStats({
          easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSolved: 0,
          streak: 0, maxStreak: 0, acceptanceRate: 0, globalRank: 'N/A',
          score: 0, contestsParticipated: 0, totalSubmissions: 0,
        });
      }

      if (subsRes.status === 'fulfilled') {
        const subData = subsRes.value.data?.data?.submissions || subsRes.value.data?.submissions || [];
        setSubmissions(Array.isArray(subData) ? subData.slice(0, 10) : []);
      }

    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  const difficultyData = stats ? [
    { name: 'Easy', value: stats.easySolved, color: '#10B981' },
    { name: 'Medium', value: stats.mediumSolved, color: '#F59E0B' },
    { name: 'Hard', value: stats.hardSolved, color: '#EF4444' },
  ] : [];

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className={`${cardClass} border rounded-2xl p-8 text-center max-w-sm`}>
          <FiUser className={`mx-auto h-12 w-12 ${subTextClass} mb-4`} />
          <h2 className={`text-xl font-bold ${textClass} mb-2`}>User not found</h2>
          <p className={`${subTextClass} mb-4`}>The profile you're looking for doesn't exist.</p>
          <Link to="/leaderboard" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm">
            Browse Users
          </Link>
        </div>
      </div>
    );
  }

  const tabs = ['overview', 'submissions', 'achievements'];

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Profile Header Card */}
        <div className={`${cardClass} border rounded-2xl overflow-hidden`}>
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjIiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')]" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-900 shadow-xl flex-shrink-0">
                {profileData.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 sm:mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`text-xl font-bold ${textClass}`}>{profileData.username}</h1>
                  {profileData.role === 'admin' && (
                    <span className="px-2 py-0.5 text-xs bg-rose-500/20 text-rose-500 rounded-full font-medium">⭐ Organizer</span>
                  )}
                </div>
                {profileData.profile?.name && <p className={`text-sm ${subTextClass}`}>{profileData.profile.name}</p>}
                {profileData.profile?.bio && <p className={`text-sm ${subTextClass} mt-1 line-clamp-2`}>{profileData.profile.bio}</p>}
                <div className={`flex flex-wrap gap-3 mt-2 text-xs ${subTextClass}`}>
                  {profileData.profile?.country && <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3" />{profileData.profile.country}</span>}
                  {profileData.profile?.university && <span className="flex items-center gap-1"><FiBriefcase className="h-3 w-3" />{profileData.profile.university}</span>}
                  <span className="flex items-center gap-1"><FiCalendar className="h-3 w-3" />Joined {new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              {isOwnProfile && (
                <Link to="/settings" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <FiSettings className="h-4 w-4" />
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Social Links */}
            {(profileData.profile?.github || profileData.profile?.website || profileData.profile?.linkedin) && (
              <div className="flex gap-3 mt-2">
                {profileData.profile?.github && (
                  <a href={profileData.profile.github} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-xs ${subTextClass} hover:text-rose-500 transition-colors`}>
                    <FiCode className="h-3.5 w-3.5" />GitHub
                  </a>
                )}
                {profileData.profile?.website && (
                  <a href={profileData.profile.website} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-xs ${subTextClass} hover:text-rose-500 transition-colors`}>
                    <FiGlobe className="h-3.5 w-3.5" />Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Problems Solved', value: stats?.totalSolved ?? 0, icon: <FiCheckCircle className="h-5 w-5" />, color: 'green' },
            { label: 'Global Rank', value: stats?.globalRank !== 'N/A' ? `#${stats?.globalRank}` : 'N/A', icon: <FiBarChart2 className="h-5 w-5" />, color: 'blue' },
            { label: 'Current Streak', value: `${stats?.streak ?? 0}d`, icon: <BsFire className="h-5 w-5" />, color: 'orange' },
            { label: 'Acceptance', value: `${stats?.acceptanceRate ?? 0}%`, icon: <FiTrendingUp className="h-5 w-5" />, color: 'purple' },
          ].map(({ label, value, icon, color }) => {
            const colorMap = {
              green: { bg: isDark ? 'bg-green-500/10' : 'bg-green-50', text: 'text-green-500' },
              blue: { bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50', text: 'text-blue-500' },
              orange: { bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500' },
              purple: { bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50', text: 'text-purple-500' },
            };
            return (
              <div key={label} className={`${cardClass} border rounded-xl p-4`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorMap[color].bg} ${colorMap[color].text}`}>{icon}</div>
                  <div>
                    <div className={`text-xs ${subTextClass}`}>{label}</div>
                    <div className={`text-xl font-bold ${textClass}`}>{value}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className={`${cardClass} border rounded-xl`}>
          <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? `border-b-2 border-rose-500 text-rose-500`
                    : `${subTextClass} hover:${textClass}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Difficulty Chart */}
                {stats && stats.totalSolved > 0 ? (
                  <div>
                    <h3 className={`font-semibold ${textClass} mb-3`}>Problems by Difficulty</h3>
                    <div className="grid sm:grid-cols-2 gap-4 items-center">
                      <div style={{ height: 200 }}>
                        {chartsReady && (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                {difficultyData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: 'none', borderRadius: 8 }} />
                              <Legend wrapperStyle={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Easy', solved: stats.easySolved, total: '—', color: 'text-green-500', bg: isDark ? 'bg-green-500/10' : 'bg-green-50' },
                          { label: 'Medium', solved: stats.mediumSolved, total: '—', color: 'text-yellow-500', bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50' },
                          { label: 'Hard', solved: stats.hardSolved, total: '—', color: 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
                        ].map(({ label, solved, color, bg }) => (
                          <div key={label} className={`${bg} rounded-xl p-3 flex items-center justify-between`}>
                            <span className={`font-medium text-sm ${color}`}>{label}</span>
                            <span className={`font-bold text-lg ${textClass}`}>{solved}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-8 ${subTextClass}`}>
                    <FiCode className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No problems solved yet</p>
                    {isOwnProfile && <Link to="/problems" className="text-sm text-rose-500 hover:underline mt-2 block">Start solving</Link>}
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                {submissions.length > 0 ? (
                  <div className="space-y-2">
                    {submissions.map(sub => {
                      const isAccepted = sub.verdict === 'accepted';
                      return (
                        <div key={sub._id} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isAccepted ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              {isAccepted ? <FiCheckCircle className="text-green-500 h-4 w-4" /> : <FiClock className="text-red-500 h-4 w-4" />}
                            </div>
                            <div>
                              <Link to={`/problem/${sub.problem?._id || sub.problemId}`} className={`font-medium text-sm ${textClass} hover:text-rose-500`}>
                                {sub.problem?.title || sub.problemTitle || 'Unknown Problem'}
                              </Link>
                              <p className={`text-xs ${subTextClass}`}>{sub.language} • {sub.runtime || sub.executionTime || '?'}ms</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${isAccepted ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              {sub.verdict?.replace(/_/g, ' ') || 'Unknown'}
                            </span>
                            <p className={`text-xs ${subTextClass} mt-1`}>{new Date(sub.createdAt || sub.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-center pt-2">
                      <Link to="/submissions" className="text-sm text-rose-500 hover:underline">View all submissions</Link>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-12 ${subTextClass}`}>
                    <FiCode className="mx-auto h-12 w-12 mb-3 opacity-30" />
                    <p>No submissions yet</p>
                    {isOwnProfile && <Link to="/problems" className="text-sm text-rose-500 hover:underline mt-2 block">Solve your first problem</Link>}
                  </div>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className={`text-center py-12 ${subTextClass}`}>
                <FiAward className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p>Achievements loading...</p>
                <Link to="/achievements" className="text-sm text-rose-500 hover:underline mt-2 block">View all achievements</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;