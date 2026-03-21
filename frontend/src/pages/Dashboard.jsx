import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiActivity, FiAward, FiTrendingUp, FiBarChart2, FiCalendar,
  FiCode, FiCheckCircle, FiTarget, FiZap, FiChevronRight,
  FiRefreshCw, FiClock, FiUsers,
} from 'react-icons/fi';
import { BsTrophyFill, BsFire } from 'react-icons/bs';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import ThemeToggle from '../components/common/ThemeToggle';

const StatCard = ({ icon, title, value, color, sub, isDark }) => {
  const colors = {
    green:  { bg: 'bg-green-500/10',  txt: 'text-green-500'  },
    blue:   { bg: 'bg-blue-500/10',   txt: 'text-blue-500'   },
    purple: { bg: 'bg-purple-500/10', txt: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/10', txt: 'text-orange-500' },
    rose:   { bg: 'bg-rose-500/10',   txt: 'text-rose-500'   },
    yellow: { bg: 'bg-yellow-500/10', txt: 'text-yellow-500' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`rounded-2xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <span className={c.txt}>{icon}</span>
        </div>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</span>
      </div>
      <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value ?? '—'}</div>
      {sub && <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</div>}
    </div>
  );
};

const VerdictBadge = ({ verdict }) => {
  const map = {
    accepted:            'bg-green-500/10 text-green-500 border-green-500/20',
    wrong_answer:        'bg-red-500/10 text-red-500 border-red-500/20',
    time_limit_exceeded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    runtime_error:       'bg-orange-500/10 text-orange-500 border-orange-500/20',
    compilation_error:   'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  const labels = {
    accepted:'AC', wrong_answer:'WA', time_limit_exceeded:'TLE',
    runtime_error:'RE', compilation_error:'CE',
  };
  const v = verdict?.toLowerCase().replace(/-/g,'_');
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[v] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
      {labels[v] || verdict}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [stats, setStats]             = useState(null);
  const [recentSubs, setRecentSubs]   = useState([]);
  const [contests, setContests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    if (user?._id || user?.id) loadDashboard();
    const t = setTimeout(() => setChartsReady(true), 300);
    return () => clearTimeout(t);
  }, [user?._id, user?.id]);

  const loadDashboard = async () => {
    setLoading(true);
    const userId = user._id || user.id;
    try {
      const [statsRes, subsRes, contestsRes] = await Promise.allSettled([
        api.get(`/users/${userId}/stats`),
        api.get('/submissions/recent', { params: { limit: 8 } }),
        api.get('/contests', { params: { limit: 4 } }),
      ]);

      // ── Stats ── (response.data is already unwrapped by interceptor)
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value;
        // ApiResponse wraps in { success, data: { user: { stats }, detailedStats } }
        const raw = d?.data?.user?.stats
                 || d?.data?.stats
                 || d?.user?.stats
                 || d?.stats
                 || {};
        const detailed = d?.data?.detailedStats || d?.detailedStats || {};
        setStats({
          totalSubmissions:    raw.totalSubmissions    ?? 0,
          acceptedSubmissions: raw.acceptedSubmissions ?? 0,
          problemsSolved:      raw.totalProblemsSolved ?? raw.problemsSolved ?? 0,
          easySolved:          raw.easySolved          ?? 0,
          mediumSolved:        raw.mediumSolved        ?? 0,
          hardSolved:          raw.hardSolved          ?? 0,
          streak:              raw.streak              ?? 0,
          maxStreak:           raw.maxStreak           ?? 0,
          rank:                raw.rank                ?? 0,
          score:               raw.score               ?? 0,
          rating:              raw.rating              ?? 1500,
          contestsParticipated:raw.contestsParticipated?? 0,
          acceptanceRate: raw.totalSubmissions > 0
            ? Math.round((raw.acceptedSubmissions / raw.totalSubmissions) * 100)
            : 0,
          weeklyActivity: detailed?.dailyActivity || [],
          languageStats:  detailed?.languageStats  || [],
        });
      }

      // ── Submissions ── /submissions/recent returns { submissions: [...], stats: {...} }
      if (subsRes.status === 'fulfilled') {
        const d = subsRes.value;
        // Unwrap: interceptor gives us response.data, ApiResponse wraps in { success, data }
        const payload = d?.data ?? d;
        const list = payload?.submissions ?? payload?.data?.submissions ?? [];
        setRecentSubs(Array.isArray(list) ? list.slice(0, 8) : []);
      }

      // ── Contests ──
      if (contestsRes.status === 'fulfilled') {
        const d = contestsRes.value;
        const list = d?.data || d?.contests || [];
        setContests(Array.isArray(list) ? list.slice(0, 4) : []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';

  const buildActivity = () => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    if (stats?.weeklyActivity?.length > 0) {
      return stats.weeklyActivity.slice(-7).map(d => ({
        day: d.date ? new Date(d.date).toLocaleDateString('en',{weekday:'short'}) : '?',
        submissions: d.submissions || d.count || 0,
        solved: d.solved || d.accepted || 0,
      }));
    }
    return days.map(d => ({ day: d, submissions: 0, solved: 0 }));
  };

  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <Loader />
    </div>
  );

  if (!user) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4`}>
      <div className={`max-w-md text-center ${card} rounded-2xl p-8 border`}>
        <FiZap className="h-12 w-12 mx-auto mb-4 text-rose-500" />
        <h2 className={`text-xl font-bold mb-3 ${txt}`}>Please log in</h2>
        <Link to="/login" className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm inline-block">
          Go to Login
        </Link>
      </div>
    </div>
  );

  const solved   = stats?.problemsSolved ?? 0;
  const diffData = solved > 0 ? [
    { name:'Easy',   value: stats.easySolved   || 0, color:'#10B981' },
    { name:'Medium', value: stats.mediumSolved  || 0, color:'#F59E0B' },
    { name:'Hard',   value: stats.hardSolved    || 0, color:'#EF4444' },
  ].filter(d => d.value > 0) : [];

  const activityData = buildActivity();
  const ratingLabel = stats?.rating >= 2000 ? 'Expert' : stats?.rating >= 1700 ? 'Specialist' : stats?.rating >= 1400 ? 'Pupil' : 'Newbie';
  const ratingColor = stats?.rating >= 2000 ? 'text-yellow-400' : stats?.rating >= 1700 ? 'text-blue-400' : stats?.rating >= 1400 ? 'text-green-400' : 'text-gray-400';

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-black ${txt}`}>Dashboard</h1>
            {lastRefresh && (
              <p className={`text-xs ${sub} mt-1`}>
                Last updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              className={`p-2 rounded-xl border ${card} ${sub} hover:text-rose-400 transition-colors`}
              title="Refresh"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 shadow-xl shadow-rose-500/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative z-10 p-6 text-white flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm mb-1">Welcome back 👋</p>
              <h2 className="text-3xl font-black">{user.username}</h2>
              <p className="text-rose-100 text-sm mt-2">
                {solved > 0
                  ? `🔥 ${solved} problems solved · ${stats?.streak || 0}-day streak · Rating ${stats?.rating || 1500}`
                  : 'Start your coding journey — solve your first problem!'}
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-center">
              <BsTrophyFill className="h-12 w-12 text-yellow-300 drop-shadow-lg" />
              <span className={`text-xs font-bold mt-1 ${ratingColor === 'text-yellow-400' ? 'text-yellow-300' : 'text-white/70'}`}>
                {ratingLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FiCheckCircle className="h-5 w-5"/>} title="Problems Solved" value={solved} color="green" isDark={isDark} />
          <StatCard icon={<FiTarget className="h-5 w-5"/>} title="Rating" value={stats?.rating ?? 1500} color="yellow" isDark={isDark} sub={ratingLabel} />
          <StatCard icon={<FiTrendingUp className="h-5 w-5"/>} title="Acceptance Rate" value={`${stats?.acceptanceRate ?? 0}%`} color="purple" isDark={isDark} sub={`${stats?.totalSubmissions ?? 0} total`} />
          <StatCard icon={<BsFire className="h-5 w-5"/>} title="Current Streak" value={`${stats?.streak ?? 0}d`} color="orange" isDark={isDark} sub={`Best: ${stats?.maxStreak ?? 0}d`} />
        </div>

        {/* Difficulty Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Easy', val:stats?.easySolved||0, color:'text-green-400', bg:'bg-green-500/10', border:'border-green-500/20' },
            { label:'Medium', val:stats?.mediumSolved||0, color:'text-yellow-400', bg:'bg-yellow-500/10', border:'border-yellow-500/20' },
            { label:'Hard', val:stats?.hardSolved||0, color:'text-red-400', bg:'bg-red-500/10', border:'border-red-500/20' },
          ].map(d => (
            <div key={d.label} className={`${card} border ${d.border} rounded-2xl p-4 text-center`}>
              <div className={`text-3xl font-black ${d.color}`}>{d.val}</div>
              <div className={`text-xs mt-1 ${sub}`}>{d.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity — pure SVG (recharts v3 has a Decimal.js bug with CartesianGrid) */}
          <div className={`${card} rounded-2xl p-5 border`}>
            <h3 className={`text-sm font-bold mb-4 ${txt}`}>Weekly Activity</h3>
            {chartsReady ? (() => {
              const W = 500, H = 200, PAD_X = 40, PAD_Y = 28;
              const maxVal = Math.max(1, ...activityData.map(d => Math.max(d.submissions||0, d.solved||0)));
              const xs = activityData.map((_, i) =>
                PAD_X + i * ((W - PAD_X * 2) / Math.max(activityData.length - 1, 1))
              );
              const yFor = (val) => H - PAD_Y - (val / maxVal) * (H - PAD_Y * 2);
              const ys = (key) => activityData.map(d => yFor(d[key] || 0));
              const polyline = (key) => activityData.map((_, i) => `${xs[i].toFixed(1)},${ys(key)[i].toFixed(1)}`).join(' ');
              const area = (key) => {
                const pts = activityData.map((_, i) => `${xs[i].toFixed(1)},${ys(key)[i].toFixed(1)}`).join(' ');
                return `${xs[0].toFixed(1)},${H - PAD_Y} ${pts} ${xs[xs.length-1].toFixed(1)},${H - PAD_Y}`;
              };
              // Y-axis labels
              const yTicks = [0, Math.ceil(maxVal/2), maxVal];
              return (
                <div className="relative w-full">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height: 220}} preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="gSol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* Horizontal grid lines + Y labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                      const y = PAD_Y + pct * (H - PAD_Y * 2);
                      const val = Math.round(maxVal * (1 - pct));
                      return (
                        <g key={i}>
                          <line x1={PAD_X} x2={W - PAD_X / 2} y1={y} y2={y}
                            stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="1"/>
                          <text x={PAD_X - 6} y={y + 4} textAnchor="end" fontSize="10"
                            fill={isDark ? '#4b5563' : '#9ca3af'}>{val}</text>
                        </g>
                      );
                    })}
                    {/* Area fills */}
                    <polygon points={area('submissions')} fill="url(#gSub)"/>
                    <polygon points={area('solved')} fill="url(#gSol)"/>
                    {/* Lines */}
                    <polyline points={polyline('submissions')} fill="none" stroke="#F43F5E"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points={polyline('solved')} fill="none" stroke="#10B981"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Dots + tooltips */}
                    {activityData.map((d, i) => (
                      <g key={i}>
                        <circle cx={xs[i]} cy={ys('submissions')[i]} r="4" fill="#F43F5E"
                          stroke={isDark ? '#111827' : '#fff'} strokeWidth="2"/>
                        <circle cx={xs[i]} cy={ys('solved')[i]} r="4" fill="#10B981"
                          stroke={isDark ? '#111827' : '#fff'} strokeWidth="2"/>
                        {/* Value label on hover via title */}
                        <title>{d.day}: {d.submissions} submissions, {d.solved} solved</title>
                      </g>
                    ))}
                    {/* X-axis day labels */}
                    {activityData.map((d, i) => (
                      <text key={i} x={xs[i]} y={H - 8} textAnchor="middle" fontSize="11"
                        fontWeight="500" fill={isDark ? '#6b7280' : '#9ca3af'}>{d.day}</text>
                    ))}
                  </svg>
                  <div className="flex items-center gap-6 mt-2 justify-center">
                    <span className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-4 h-0.5 bg-rose-500 inline-block rounded"/>
                      Submissions
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded"/>
                      Solved
                    </span>
                  </div>
                </div>
              );
            })() : <div className="h-[220px] flex items-center justify-center"><Loader /></div>}
          </div>

          {/* Difficulty Breakdown */}
          <div className={`${card} rounded-2xl p-5 border`}>
            <h3 className={`text-sm font-bold mb-4 ${txt}`}>Problems by Difficulty</h3>
            {solved === 0 ? (
              <div className={`flex flex-col items-center justify-center h-[200px] ${sub}`}>
                <FiCode className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No problems solved yet</p>
                <Link to="/problems" className="mt-3 px-4 py-1.5 bg-rose-500 text-white text-xs rounded-xl">
                  Browse Problems
                </Link>
              </div>
            ) : chartsReady ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={diffData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {diffData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: isDark ? '#111827' : '#fff', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {[
                    { label:'Easy',   value: stats?.easySolved   || 0, color:'text-green-400' },
                    { label:'Medium', value: stats?.mediumSolved  || 0, color:'text-yellow-400' },
                    { label:'Hard',   value: stats?.hardSolved    || 0, color:'text-red-400' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${d.color}`}>{d.value}</span>
                      <span className={`text-xs ${sub}`}>{d.label}</span>
                    </div>
                  ))}
                  <div className={`text-xs ${sub} pt-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    Total: <span className={`font-black ${txt}`}>{solved}</span>
                  </div>
                </div>
              </div>
            ) : <div className="h-[200px] flex items-center justify-center"><Loader /></div>}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <div className={`${card} rounded-2xl border overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${txt}`}>Recent Submissions</h3>
              <Link to="/submissions" className="text-xs text-rose-500 flex items-center gap-1 hover:text-rose-400">
                View all <FiChevronRight />
              </Link>
            </div>
            {recentSubs.length === 0 ? (
              <div className={`py-12 text-center ${sub}`}>
                <FiActivity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No submissions yet</p>
                <Link to="/problems" className="mt-2 inline-block text-xs text-rose-500">Solve a problem →</Link>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-50'}`}>
                {recentSubs.map((s, i) => (
                  <div key={s._id || i} className={`flex items-center gap-3 px-5 py-3 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <VerdictBadge verdict={s.verdict} />
                    <div className="flex-1 min-w-0">
                      <Link to={`/problem/${s.problem?._id}`} className={`text-sm font-medium truncate block ${isDark ? 'text-gray-200 hover:text-rose-300' : 'text-gray-800 hover:text-rose-500'} transition-colors`}>
                        {s.problem?.title || 'Problem'}
                      </Link>
                      <p className={`text-xs ${sub}`}>{s.language} {s.executionTime ? `· ${s.executionTime}ms` : ''}</p>
                    </div>
                    <span className={`text-xs ${sub} whitespace-nowrap`}>
                      {new Date(s.submittedAt || s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contests */}
          <div className={`${card} rounded-2xl border overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${txt}`}>Upcoming Contests</h3>
              <Link to="/contests" className="text-xs text-rose-500 flex items-center gap-1 hover:text-rose-400">
                View all <FiChevronRight />
              </Link>
            </div>
            {contests.length === 0 ? (
              <div className={`py-12 text-center ${sub}`}>
                <FiCalendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No upcoming contests</p>
                <Link to="/contests" className="mt-2 inline-block text-xs text-rose-500">Browse contests →</Link>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-50'}`}>
                {contests.map((c, i) => {
                  const status = c.currentStatus || c.status;
                  const statusColors = { live:'bg-green-500/10 text-green-400', upcoming:'bg-blue-500/10 text-blue-400', ended:'bg-gray-500/10 text-gray-400' };
                  return (
                    <Link key={c.id || c._id || i} to={`/contests/${c.id || c._id}`}
                      className={`flex items-center gap-3 px-5 py-3.5 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors block`}>
                      <div className="p-2 rounded-lg bg-rose-500/10">
                        <BsTrophyFill className="h-4 w-4 text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${txt}`}>{c.title}</p>
                        <p className={`text-xs ${sub}`}>
                          {c.start_time ? new Date(c.start_time).toLocaleDateString() : 'TBD'} · {c.duration_minutes || '?'}min
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] || statusColors.upcoming}`}>
                        {status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FiCode,      label:'Practice',     to:'/problems',    color:'from-blue-500 to-indigo-500' },
            { icon: BsTrophyFill,label:'Contests',     to:'/contests',    color:'from-yellow-500 to-orange-500' },
            { icon: FiActivity,  label:'Interview Prep',to:'/interview',  color:'from-purple-500 to-pink-500' },
            { icon: FiUsers,     label:'Leaderboard',  to:'/leaderboard', color:'from-rose-500 to-red-500' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className={`rounded-2xl p-4 bg-gradient-to-br ${item.color} text-white flex items-center gap-3 hover:opacity-90 transition-opacity shadow-lg`}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;