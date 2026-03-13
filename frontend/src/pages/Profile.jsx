import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiGithub, FiGlobe, FiSettings, FiMapPin, FiLinkedin,
  FiCode, FiAward, FiTrendingUp, FiCalendar, FiStar,
  FiCheckCircle, FiClock, FiUsers, FiEdit2, FiRefreshCw,
} from 'react-icons/fi';
import { BsTrophyFill, BsFire } from 'react-icons/bs';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const VerdictBadge = ({ verdict }) => {
  const map = {
    accepted:'bg-green-500/15 text-green-400 border-green-500/30',
    wrong_answer:'bg-red-500/15 text-red-400 border-red-500/30',
    time_limit_exceeded:'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    runtime_error:'bg-orange-500/15 text-orange-400 border-orange-500/30',
    compilation_error:'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };
  const labels = { accepted:'AC', wrong_answer:'WA', time_limit_exceeded:'TLE', runtime_error:'RE', compilation_error:'CE' };
  const v = verdict?.toLowerCase().replace(/-/g,'_');
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[v]||'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {labels[v]||verdict}
    </span>
  );
};

const HeatCell = ({ count }) => {
  const lvl = count===0?0:count<2?1:count<5?2:count<10?3:4;
  return (
    <div
      title={`${count} submission${count!==1?'s':''}`}
      className={`w-[11px] h-[11px] rounded-sm ${['bg-gray-800','bg-green-900','bg-green-700','bg-green-500','bg-green-300'][lvl]}`}
    />
  );
};

const getRatingInfo = (r) => {
  if (r >= 2400) return { label:'Grandmaster', color:'text-red-400',    bg:'bg-red-500/10' };
  if (r >= 2000) return { label:'Expert',      color:'text-yellow-400', bg:'bg-yellow-500/10' };
  if (r >= 1700) return { label:'Specialist',  color:'text-blue-400',   bg:'bg-blue-500/10' };
  if (r >= 1400) return { label:'Pupil',        color:'text-green-400',  bg:'bg-green-500/10' };
  return               { label:'Newbie',        color:'text-gray-400',   bg:'bg-gray-500/10' };
};

/* ── Donut progress ring ─────────────────────────────────────────────────── */
const DonutProgress = ({ solved, total, easy, medium, hard }) => {
  const r = 54, circ = 2 * Math.PI * r;
  const pct = total > 0 ? solved / total : 0;
  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
      <svg className="-rotate-90 absolute inset-0" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <defs>
          <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-black text-white">{solved}</div>
        <div className="text-xs text-gray-500">/ {total}</div>
        <div className="text-xs text-gray-400 mt-0.5">solved</div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Profile = () => {
  const { username }      = useParams();
  const navigate          = useNavigate();
  const { user: me }      = useAuth();
  const { isDark }        = useTheme();

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats]             = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activity, setActivity]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('overview');
  const [chartsReady, setChartsReady] = useState(false);

  const isOwn       = me?.username === username || (!username && me);
  const targetUser  = username || me?.username;

  useEffect(() => { setTimeout(() => setChartsReady(true), 300); }, []);

  const load = useCallback(async () => {
    if (!targetUser) { navigate('/login'); return; }
    try {
      setLoading(true);
      const userRes  = await api.get(`/users/${targetUser}`);
      const userData = userRes?.data?.user || userRes?.data?.data?.user || userRes?.data || userRes;
      if (!userData?._id && !userData?.id) throw new Error('Not found');
      setProfileData(userData);
      const uid = userData._id || userData.id;

      const [sRes, subRes, actRes] = await Promise.allSettled([
        api.get(`/users/${uid}/stats`),
        api.get('/submissions', { params: { limit: 20 } }),
        api.get(`/users/${uid}/activity`).catch(() => ({ data: [] })),
      ]);

      if (sRes.status === 'fulfilled') {
        const raw = sRes.value?.data?.user?.stats || sRes.value?.data?.stats || sRes.value?.stats || {};
        setStats({
          easySolved:   raw.easySolved   ?? 0,
          mediumSolved: raw.mediumSolved ?? 0,
          hardSolved:   raw.hardSolved   ?? 0,
          totalSolved:  raw.totalProblemsSolved ?? raw.problemsSolved ?? 0,
          streak:       raw.streak       ?? 0,
          maxStreak:    raw.maxStreak    ?? 0,
          globalRank:   raw.rank         ?? 0,
          rating:       raw.rating       ?? 1500,
          score:        raw.score        ?? 0,
          contests:     raw.contestsParticipated ?? 0,
          totalSubs:    raw.totalSubmissions ?? 0,
          accepted:     raw.acceptedSubmissions ?? 0,
          acceptRate:   raw.totalSubmissions > 0
            ? Math.round((raw.acceptedSubmissions / raw.totalSubmissions) * 100) : 0,
        });
      } else {
        setStats({ easySolved:0, mediumSolved:0, hardSolved:0, totalSolved:0, streak:0, maxStreak:0, globalRank:0, rating:1500, score:0, contests:0, totalSubs:0, accepted:0, acceptRate:0 });
      }

      if (subRes.status === 'fulfilled') {
        const d = subRes.value;
        const list = d?.submissions || d?.data?.submissions || d?.data || [];
        setSubmissions(Array.isArray(list) ? list.slice(0, 20) : []);
      }

      if (actRes.status === 'fulfilled') {
        const d = actRes.value;
        setActivity(d?.data?.activity || d?.activity || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load profile');
    } finally { setLoading(false); }
  }, [targetUser, navigate]);

  useEffect(() => { load(); }, [load]);

  /* ── theme tokens ──────────────────────────────────────────────────────── */
  const bg     = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card   = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const card2  = isDark ? 'bg-gray-800/50' : 'bg-gray-50';
  const txt    = isDark ? 'text-white' : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
  const divClr = isDark ? 'divide-gray-800' : 'divide-gray-100';
  const bdrClr = isDark ? 'border-gray-800' : 'border-gray-100';

  if (loading) return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;
  if (!profileData) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <div className={`${card} border rounded-2xl p-12 text-center`}>
        <FiUsers className={`h-12 w-12 mx-auto mb-4 ${sub}`} />
        <p className={txt}>User not found</p>
        <Link to="/leaderboard" className="mt-4 inline-block px-5 py-2 bg-rose-500 text-white rounded-xl text-sm">Browse Users</Link>
      </div>
    </div>
  );

  const p = profileData.profile || {};
  const ratingInfo = getRatingInfo(stats?.rating || 1500);

  // Heatmap — 52 weeks × 7 days
  const heatmap = Array.from({ length: 52 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const daysAgo = (51 - w) * 7 + (6 - d);
      const target  = new Date(); target.setDate(target.getDate() - daysAgo);
      const match   = activity.find?.(a => new Date(a.date).toDateString() === target.toDateString());
      return match?.count || 0;
    })
  );

  const diffData = [
    { name:'Easy',   value:stats?.easySolved||0,   color:'#10B981' },
    { name:'Medium', value:stats?.mediumSolved||0,  color:'#F59E0B' },
    { name:'Hard',   value:stats?.hardSolved||0,    color:'#EF4444' },
  ].filter(d => d.value > 0);

  const totalSolved = stats?.totalSolved || 0;
  const TOTAL_PROBS = 300; // approximate — update to real total if you have it

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="w-full max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[280px_1fr] gap-6 min-w-0 items-start">

        {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Avatar + name */}
          <div className={`${card} border rounded-2xl p-6 text-center`}>
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-4xl font-black mx-auto shadow-lg shadow-rose-500/20">
                {profileData.avatar
                  ? <img src={profileData.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  : profileData.username?.charAt(0).toUpperCase()
                }
              </div>
              {(stats?.streak||0) > 2 && (
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-sm shadow-md">🔥</div>
              )}
            </div>

            <h1 className={`text-xl font-black ${txt}`}>{profileData.username}</h1>
            {p.name && <p className={`text-sm ${sub} mt-0.5`}>{p.name}</p>}

            {/* Rating badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${ratingInfo.bg} ${ratingInfo.color}`}>
              <FiStar className="h-3 w-3" /> {ratingInfo.label} · {stats?.rating||1500}
            </div>

            {/* Edit button */}
            {isOwn && (
              <Link to="/settings" className={`mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl border text-xs font-medium transition-all
                ${isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <FiEdit2 className="h-3 w-3" /> Edit Profile
              </Link>
            )}

            {/* Links */}
            <div className={`mt-4 space-y-2 text-left border-t ${bdrClr} pt-4`}>
              {p.bio && <p className={`text-xs ${sub} leading-relaxed`}>{p.bio}</p>}
              <div className="space-y-1.5">
                {p.country && (
                  <div className={`flex items-center gap-2 text-xs ${sub}`}>
                    <FiMapPin className="h-3 w-3 flex-shrink-0" /> {p.country}
                  </div>
                )}
                <div className={`flex items-center gap-2 text-xs ${sub}`}>
                  <FiCalendar className="h-3 w-3 flex-shrink-0" />
                  Joined {new Date(profileData.createdAt||Date.now()).toLocaleDateString('en',{month:'long',year:'numeric'})}
                </div>
                {p.github && (
                  <a href={`https://github.com/${p.github}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                    <FiGithub className="h-3 w-3" /> {p.github}
                  </a>
                )}
                {p.linkedin && (
                  <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://linkedin.com/in/${p.linkedin}`}
                    target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                    <FiLinkedin className="h-3 w-3" /> LinkedIn
                  </a>
                )}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                    <FiGlobe className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            {[
              { label:'Ranking',       value: stats?.globalRank ? `#${stats.globalRank}` : 'N/A', icon:'🏅' },
              { label:'Rating',        value: stats?.rating || 1500, icon:'⭐' },
              { label:'Contests',      value: stats?.contests || 0,  icon:'🏆' },
              { label:'Streak',        value: `${stats?.streak||0}d`, icon:'🔥' },
              { label:'Acceptance',    value: `${stats?.acceptRate||0}%`, icon:'✅' },
            ].map((s, i) => (
              <div key={s.label} className={`flex items-center justify-between px-4 py-3 ${i>0?`border-t ${bdrClr}`:''}`}>
                <span className={`text-xs ${sub} flex items-center gap-2`}><span>{s.icon}</span>{s.label}</span>
                <span className={`text-sm font-bold ${txt}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className={`${card} border rounded-2xl p-4`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${sub} mb-3`}>Badges</h3>
            <div className="flex flex-wrap gap-1.5">
              {totalSolved >= 1  && <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs rounded-full">First Solve</span>}
              {totalSolved >= 10 && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded-full">Problem Solver</span>}
              {totalSolved >= 50 && <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs rounded-full">Algorithm Expert</span>}
              {(stats?.streak||0) >= 7 && <span className="px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs rounded-full">🔥 Week Streak</span>}
              {(stats?.hardSolved||0) >= 5 && <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded-full">Hard Killer</span>}
              {(stats?.contests||0) >= 1 && <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs rounded-full">Competitor</span>}
              {(stats?.rating||1500) >= 2000 && <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs rounded-full">★ Expert</span>}
              {totalSolved === 0 && <span className={`text-xs ${sub}`}>Solve problems to earn badges</span>}
            </div>
          </div>
        </div>

        {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
        <div className="space-y-4 min-w-0 overflow-hidden">

          {/* Tabs */}
          <div className={`flex border-b ${bdrClr}`}>
            {['overview','submissions','contests'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px
                  ${tab===t ? 'border-rose-500 text-rose-400' : `border-transparent ${sub} hover:text-gray-200`}`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-4">

              {/* Solved summary card — LeetCode style */}
              <div className={`${card} border rounded-2xl p-6`}>
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Donut */}
                  <div className="flex-shrink-0">
                    <DonutProgress
                      solved={totalSolved}
                      total={TOTAL_PROBS}
                      easy={stats?.easySolved||0}
                      medium={stats?.mediumSolved||0}
                      hard={stats?.hardSolved||0}
                    />
                  </div>
                  {/* Difficulty breakdown */}
                  <div className="flex-1 w-full space-y-4">
                    {[
                      { label:'Easy',   solved:stats?.easySolved||0,   total:100, color:'bg-green-500', text:'text-green-400' },
                      { label:'Medium', solved:stats?.mediumSolved||0,  total:150, color:'bg-yellow-500',text:'text-yellow-400' },
                      { label:'Hard',   solved:stats?.hardSolved||0,    total:50,  color:'bg-red-500',   text:'text-red-400' },
                    ].map(d => (
                      <div key={d.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-sm font-semibold ${d.text}`}>{d.label}</span>
                          <span className={`text-sm font-bold ${txt}`}>
                            {d.solved} <span className={`font-normal ${sub}`}>/ {d.total}</span>
                          </span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
                          <div className={`h-full ${d.color} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.min(100,(d.solved/d.total)*100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-0 mt-6 border-t ${bdrClr} pt-4 divide-x ${divClr}`}>
                  {[
                    { label:'Submissions', value: stats?.totalSubs||0 },
                    { label:'Accepted',    value: stats?.accepted||0 },
                    { label:'Accept Rate', value: `${stats?.acceptRate||0}%` },
                    { label:'Best Streak', value: `${stats?.maxStreak||0}d` },
                  ].map(s => (
                    <div key={s.label} className="text-center px-2">
                      <div className={`text-lg font-black ${txt}`}>{s.value}</div>
                      <div className={`text-xs ${sub} mt-0.5`}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className={`${card} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${txt}`}>Submission Activity</h3>
                  <div className="flex items-center gap-2"><button onClick={load} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"><FiRefreshCw className="h-3 w-3"/>Refresh</button><span className={`text-xs ${sub}`}>Past year</span></div>
                </div>
                <div className="overflow-x-auto pb-2" style={{WebkitOverflowScrolling:"touch"}}>
                  <div className="flex gap-[3px] min-w-max">
                    {heatmap.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((cnt, di) => <HeatCell key={di} count={cnt} />)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center gap-2 mt-3 text-xs ${sub}`}>
                  <span>Less</span>
                  {['bg-gray-800','bg-green-900','bg-green-700','bg-green-500','bg-green-300'].map((c,i) => (
                    <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
                  ))}
                  <span>More</span>
                </div>
              </div>

              {/* Contest Rating */}
              <div className={`${card} border rounded-2xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <BsTrophyFill className="h-5 w-5 text-yellow-400" />
                  <h3 className={`text-sm font-bold ${txt}`}>Contest Rating</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-black ${ratingInfo.color}`}>{stats?.rating||1500}</div>
                    <div className={`text-xs ${sub} mt-1`}>{ratingInfo.label}</div>
                  </div>
                  <div className={`flex-1 h-px ${isDark?'bg-gray-800':'bg-gray-200'}`} />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className={`text-xl font-bold ${txt}`}>{stats?.contests||0}</div>
                      <div className={`text-xs ${sub}`}>Attended</div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${txt}`}>#{stats?.globalRank||'—'}</div>
                      <div className={`text-xs ${sub}`}>Global Rank</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SUBMISSIONS ───────────────────────────────────────────────── */}
          {tab === 'submissions' && (
            <div className={`${card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${bdrClr} flex items-center justify-between`}>
                <span className={`text-sm font-bold ${txt}`}>Recent Submissions</span>
                <Link to="/submissions" className="text-xs text-rose-400 hover:text-rose-300">All →</Link>
              </div>
              {submissions.length === 0 ? (
                <div className={`py-16 text-center ${sub}`}>
                  <FiCode className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No submissions yet</p>
                  <Link to="/problems" className="mt-3 inline-block px-4 py-1.5 bg-rose-500 text-white text-xs rounded-xl">Solve Problems</Link>
                </div>
              ) : (
                <div className={`divide-y ${divClr}`}>
                  {submissions.map((s, i) => (
                    <div key={s._id||i} className={`flex items-center gap-3 px-5 py-3.5 ${isDark?'hover:bg-gray-800/40':'hover:bg-gray-50'} transition-colors`}>
                      <VerdictBadge verdict={s.verdict} />
                      <div className="flex-1 min-w-0">
                        <Link to={`/problem/${s.problem?._id}`}
                          className={`text-sm font-medium truncate block ${isDark?'text-gray-200 hover:text-rose-300':'text-gray-800 hover:text-rose-500'} transition-colors`}>
                          {s.problem?.title||'Unknown'}
                        </Link>
                        <div className={`text-xs ${sub} flex gap-2 mt-0.5`}>
                          <span>{s.language}</span>
                          {s.executionTime && <><span>·</span><span>{s.executionTime}ms</span></>}
                        </div>
                      </div>
                      <span className={`text-xs ${sub} whitespace-nowrap`}>
                        {new Date(s.submittedAt||s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTESTS ──────────────────────────────────────────────────── */}
          {tab === 'contests' && (
            <div className={`${card} border rounded-2xl p-6 text-center`}>
              <BsTrophyFill className={`h-10 w-10 mx-auto mb-3 ${sub} opacity-30`} />
              <p className={`${sub} text-sm`}>Contest history coming soon</p>
              <Link to="/contests" className="mt-4 inline-block px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm rounded-xl">
                Join a Contest
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;