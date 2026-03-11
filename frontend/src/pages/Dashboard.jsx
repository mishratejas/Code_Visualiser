import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiActivity, FiAward, FiTrendingUp,
  FiBarChart2, FiCalendar, FiCode, FiUsers,
  FiCheckCircle, FiTarget, FiZap,
  FiChevronRight,
} from 'react-icons/fi';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import ThemeToggle from '../components/common/ThemeToggle';

// ── Tiny stat card ─────────────────────────────────────────────────────────
const StatCard = ({ icon, title, value, color, sub }) => {
  const colors = {
    green:  { bg: 'bg-green-500/10',  txt: 'text-green-500'  },
    blue:   { bg: 'bg-blue-500/10',   txt: 'text-blue-500'   },
    purple: { bg: 'bg-purple-500/10', txt: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/10', txt: 'text-orange-500' },
    rose:   { bg: 'bg-rose-500/10',   txt: 'text-rose-500'   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`rounded-xl p-4 border ${sub.card}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <span className={c.txt}>{icon}</span>
        </div>
        <span className={`text-xs ${sub.sub}`}>{title}</span>
      </div>
      <div className={`text-2xl font-bold ${sub.txt}`}>{value ?? '—'}</div>
    </div>
  );
};

// ── Verdict badge ───────────────────────────────────────────────────────────
const VerdictBadge = ({ verdict }) => {
  const map = {
    accepted:            'bg-green-500/10 text-green-500',
    wrong_answer:        'bg-red-500/10 text-red-500',
    time_limit_exceeded: 'bg-yellow-500/10 text-yellow-500',
    runtime_error:       'bg-orange-500/10 text-orange-500',
    compilation_error:   'bg-purple-500/10 text-purple-500',
  };
  const labels = {
    accepted:            'Accepted',
    wrong_answer:        'Wrong Answer',
    time_limit_exceeded: 'TLE',
    runtime_error:       'Runtime Error',
    compilation_error:   'Compile Error',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[verdict] || 'bg-gray-500/10 text-gray-500'}`}>
      {labels[verdict] || verdict}
    </span>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [stats, setStats]               = useState(null);
  const [recentSubs, setRecentSubs]     = useState([]);
  const [contests, setContests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [chartsReady, setChartsReady]   = useState(false);

  useEffect(() => {
    if (user?._id) loadDashboard();
    const t = setTimeout(() => setChartsReady(true), 200);
    return () => clearTimeout(t);
  }, [user?._id]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, contestsRes] = await Promise.allSettled([
        api.get(`/users/${user._id}/stats`),
        api.get('/submissions', { params: { limit: 5 } }),
        api.get('/contests', { params: { status: 'upcoming', limit: 3 } }),
      ]);

      // ── Stats ──
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value;
        // Possible shapes: d.user.stats  |  d.stats  |  d
        const raw = d?.user?.stats || d?.stats || d || {};
        setStats({
          totalSubmissions:    raw.totalSubmissions    || 0,
          acceptedSubmissions: raw.acceptedSubmissions || 0,
          problemsSolved:      raw.totalProblemsSolved || raw.problemsSolved || 0,
          easySolved:          raw.easySolved          || 0,
          mediumSolved:        raw.mediumSolved        || 0,
          hardSolved:          raw.hardSolved          || 0,
          streak:              raw.streak              || 0,
          maxStreak:           raw.maxStreak           || 0,
          rank:                raw.rank                || 0,
          score:               raw.score               || 0,
          acceptanceRate: raw.totalSubmissions > 0
            ? Math.round((raw.acceptedSubmissions / raw.totalSubmissions) * 100)
            : 0,
          weeklyActivity: d?.detailedStats?.dailyActivity || [],
        });
      }

      // ── Recent submissions ──
      if (subsRes.status === 'fulfilled') {
        const d = subsRes.value;
        const list = d?.submissions || d?.data?.submissions || d?.data || [];
        setRecentSubs(Array.isArray(list) ? list.slice(0, 5) : []);
      }

      // ── Upcoming contests ──
      if (contestsRes.status === 'fulfilled') {
        const d = contestsRes.value;
        const list = d?.data?.contests || d?.contests || d?.data || [];
        setContests(Array.isArray(list) ? list.slice(0, 3) : []);
      }
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  // Theme tokens
  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const S    = {
    card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm',
    txt:  isDark ? 'text-white' : 'text-gray-900',
    sub:  isDark ? 'text-gray-400' : 'text-gray-600',
  };

  // Build chart data from weeklyActivity or empty 7-day placeholder
  const buildActivity = () => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    if (stats?.weeklyActivity?.length > 0) {
      return stats.weeklyActivity.slice(-7).map(d => ({
        day: d.date ? new Date(d.date).toLocaleDateString('en',{weekday:'short'}) : '?',
        submissions: d.submissions || d.count || 0,
        solved: d.solved || d.accepted || 0,
      }));
    }
    // Zero-filled placeholder (no fake numbers)
    return days.map(d => ({ day: d, submissions: 0, solved: 0 }));
  };

  if (loading) return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;

  if (!user) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4`}>
      <div className={`max-w-md text-center ${S.card} rounded-2xl p-8 border`}>
        <FiZap className="h-12 w-12 mx-auto mb-4 text-rose-500" />
        <h2 className={`text-xl font-bold mb-3 ${S.txt}`}>Please log in</h2>
        <Link to="/login" className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm inline-block">
          Go to Login
        </Link>
      </div>
    </div>
  );

  const solved   = stats?.problemsSolved ?? 0;
  const diffData = solved > 0 ? [
    { name: 'Easy',   value: stats.easySolved   || 0, color: '#10B981' },
    { name: 'Medium', value: stats.mediumSolved  || 0, color: '#F59E0B' },
    { name: 'Hard',   value: stats.hardSolved    || 0, color: '#EF4444' },
  ].filter(d => d.value > 0) : [];

  const activityData = buildActivity();

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div />
          <ThemeToggle />
        </div>

        {/* Welcome */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600">
          <div className="relative z-10 p-6 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-white/20 rounded-xl"><FiAward className="h-6 w-6" /></div>
              <div>
                <p className="text-rose-100 text-sm">Welcome back</p>
                <h1 className="text-2xl font-bold">{user.username}! 👋</h1>
              </div>
            </div>
            <p className="text-rose-100 text-sm">
              {solved > 0 ? `You've solved ${solved} problem${solved !== 1 ? 's' : ''} — keep going!` : 'Start your coding journey — solve your first problem!'}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FiCheckCircle className="h-5 w-5" />} title="Solved"      value={solved}                           color="green"  sub={S} />
          <StatCard icon={<FiTarget      className="h-5 w-5" />} title="Rank"        value={stats?.rank ? `#${stats.rank}` : '—'} color="blue"   sub={S} />
          <StatCard icon={<FiTrendingUp  className="h-5 w-5" />} title="Acceptance"  value={`${stats?.acceptanceRate ?? 0}%`} color="purple" sub={S} />
          <StatCard icon={<FiZap         className="h-5 w-5" />} title="Streak"      value={`${stats?.streak ?? 0}d`}         color="orange" sub={S} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Activity */}
          <div className={`${S.card} rounded-xl p-5 border`}>
            <h3 className={`text-base font-bold mb-4 ${S.txt}`}>Weekly Activity</h3>
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="day" stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                  <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                  <Tooltip contentStyle={{ background: isDark ? '#1F2937' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="submissions" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="solved"      stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center"><Loader /></div>}
          </div>

          {/* Difficulty breakdown */}
          <div className={`${S.card} rounded-xl p-5 border`}>
            <h3 className={`text-base font-bold mb-4 ${S.txt}`}>Problems by Difficulty</h3>
            {solved === 0 ? (
              <div className={`flex flex-col items-center justify-center h-[220px] ${S.sub}`}>
                <FiCode className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No problems solved yet</p>
                <Link to="/problems" className="mt-3 px-4 py-1.5 bg-rose-500 text-white text-xs rounded-lg">Browse Problems</Link>
              </div>
            ) : chartsReady ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={diffData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {diffData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {[
                    { label: 'Easy',   value: stats?.easySolved   || 0, color: 'text-green-500' },
                    { label: 'Medium', value: stats?.mediumSolved  || 0, color: 'text-yellow-500' },
                    { label: 'Hard',   value: stats?.hardSolved    || 0, color: 'text-red-500' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className={`font-bold ${d.color}`}>{d.value}</span>
                      <span className={`text-xs ${S.sub}`}>{d.label}</span>
                    </div>
                  ))}
                  <div className={`text-xs ${S.sub} pt-1`}>Total: <span className={`font-bold ${S.txt}`}>{solved}</span></div>
                </div>
              </div>
            ) : <div className="h-[220px] flex items-center justify-center"><Loader /></div>}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent submissions */}
          <div className={`${S.card} rounded-xl p-5 border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${S.txt}`}>Recent Submissions</h3>
              <Link to="/submissions" className="text-xs text-rose-500 flex items-center gap-1">View all <FiChevronRight /></Link>
            </div>
            {recentSubs.length === 0 ? (
              <div className={`text-center py-8 ${S.sub}`}>
                <FiActivity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions yet</p>
                <Link to="/problems" className="mt-2 inline-block text-xs text-rose-500">Solve a problem →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSubs.map((sub, i) => (
                  <div key={sub._id || i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${S.txt}`}>{sub.problem?.title || 'Problem'}</p>
                      <p className={`text-xs ${S.sub}`}>{sub.language} · {sub.runtime ? `${sub.runtime}ms` : ''}</p>
                    </div>
                    <VerdictBadge verdict={sub.verdict} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming contests */}
          <div className={`${S.card} rounded-xl p-5 border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${S.txt}`}>Upcoming Contests</h3>
              <Link to="/contests" className="text-xs text-rose-500 flex items-center gap-1">View all <FiChevronRight /></Link>
            </div>
            {contests.length === 0 ? (
              <div className={`text-center py-8 ${S.sub}`}>
                <FiCalendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming contests</p>
                <Link to="/contests" className="mt-2 inline-block text-xs text-rose-500">Browse contests →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {contests.map((c, i) => (
                  <Link key={c._id || i} to={`/contests/${c._id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${S.txt}`}>{c.title}</p>
                      <p className={`text-xs ${S.sub}`}>
                        {c.startTime ? new Date(c.startTime).toLocaleDateString() : 'Date TBD'} · {c.duration || '?'}min
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full ml-2 whitespace-nowrap">
                      {c.participants || 0} joined
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;