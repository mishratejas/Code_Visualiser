import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiSearch, FiAward, FiLock, FiCheckCircle, FiCode,
  FiTrendingUp, FiTarget, FiStar, FiFilter,
} from 'react-icons/fi';
import { BsTrophyFill, BsFire } from 'react-icons/bs';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

// ── Full achievement definitions ──────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Milestone
  { id:'first_solve',    category:'milestone', title:'Hello World',        desc:'Solve your first problem',          icon:'🎉', points:10,  threshold:1,   stat:'totalSolved' },
  { id:'solve_10',       category:'milestone', title:'Getting Warmed Up',  desc:'Solve 10 problems',                 icon:'🔥', points:25,  threshold:10,  stat:'totalSolved' },
  { id:'solve_25',       category:'milestone', title:'Problem Crusher',    desc:'Solve 25 problems',                 icon:'💪', points:50,  threshold:25,  stat:'totalSolved' },
  { id:'solve_50',       category:'milestone', title:'Half Century',       desc:'Solve 50 problems',                 icon:'🎯', points:100, threshold:50,  stat:'totalSolved' },
  { id:'solve_100',      category:'milestone', title:'Centurion',          desc:'Solve 100 problems',                icon:'💯', points:200, threshold:100, stat:'totalSolved' },
  { id:'solve_250',      category:'milestone', title:'Algorithm Master',   desc:'Solve 250 problems',                icon:'🧠', points:500, threshold:250, stat:'totalSolved' },
  { id:'solve_500',      category:'milestone', title:'Code Legend',        desc:'Solve 500 problems',                icon:'👑', points:1000,threshold:500, stat:'totalSolved' },

  // Difficulty
  { id:'easy_20',        category:'difficulty', title:'Easy Rider',        desc:'Solve 20 easy problems',            icon:'😊', points:30,  threshold:20,  stat:'easySolved' },
  { id:'medium_10',      category:'difficulty', title:'Medium Rare',       desc:'Solve 10 medium problems',          icon:'🤔', points:50,  threshold:10,  stat:'mediumSolved' },
  { id:'medium_50',      category:'difficulty', title:'Medium Well',       desc:'Solve 50 medium problems',          icon:'🔥', points:150, threshold:50,  stat:'mediumSolved' },
  { id:'hard_1',         category:'difficulty', title:'Hard Hitter',       desc:'Solve your first hard problem',     icon:'😤', points:75,  threshold:1,   stat:'hardSolved' },
  { id:'hard_10',        category:'difficulty', title:'Hard Boiled',       desc:'Solve 10 hard problems',            icon:'⚡', points:200, threshold:10,  stat:'hardSolved' },
  { id:'hard_50',        category:'difficulty', title:'Nightmare Mode',    desc:'Solve 50 hard problems',            icon:'💀', points:750, threshold:50,  stat:'hardSolved' },

  // Streaks
  { id:'streak_3',       category:'streak',    title:'Hot Streak',         desc:'Maintain a 3-day solving streak',   icon:'🔥', points:20,  threshold:3,   stat:'streak' },
  { id:'streak_7',       category:'streak',    title:'Week Warrior',       desc:'Maintain a 7-day solving streak',   icon:'📅', points:50,  threshold:7,   stat:'streak' },
  { id:'streak_14',      category:'streak',    title:'Two-Week Machine',   desc:'Maintain a 14-day solving streak',  icon:'💪', points:100, threshold:14,  stat:'streak' },
  { id:'streak_30',      category:'streak',    title:'Monthly Grinder',    desc:'Maintain a 30-day solving streak',  icon:'🏆', points:300, threshold:30,  stat:'streak' },
  { id:'streak_100',     category:'streak',    title:'Unstoppable',        desc:'Maintain a 100-day solving streak', icon:'🌟', points:1000,threshold:100, stat:'streak' },

  // Contests
  { id:'contest_first',  category:'contest',   title:'First Blood',        desc:'Participate in your first contest', icon:'🏁', points:30,  threshold:1,   stat:'contestsParticipated' },
  { id:'contest_5',      category:'contest',   title:'Regular Competitor', desc:'Participate in 5 contests',         icon:'🎮', points:100, threshold:5,   stat:'contestsParticipated' },
  { id:'contest_top10',  category:'contest',   title:'Top 10 Finisher',    desc:'Finish in top 10 of a contest',     icon:'🥉', points:250, threshold:1,   stat:'contestTopTen' },
  { id:'contest_rated',  category:'contest',   title:'Rating Climber',     desc:'Reach a contest rating of 1700+',   icon:'📈', points:200, threshold:1700,stat:'rating' },
  { id:'contest_expert', category:'contest',   title:'Expert Coder',       desc:'Reach a contest rating of 2000+',   icon:'⭐', points:500, threshold:2000,stat:'rating' },

  // Submissions
  { id:'subs_50',        category:'submission','title':'Persistent',       desc:'Submit 50 solutions',               icon:'📤', points:25,  threshold:50,  stat:'totalSubmissions' },
  { id:'subs_100',       category:'submission','title':'Solution Machine', desc:'Submit 100 solutions',              icon:'🤖', points:50,  threshold:100, stat:'totalSubmissions' },
  { id:'accept_rate_90', category:'submission','title':'Precision Coder',  desc:'Maintain 90%+ acceptance rate',     icon:'🎯', points:200, threshold:90,  stat:'acceptanceRate' },

  // Special
  { id:'all_easy',       category:'special',   title:'Easy Completionist', desc:'Solve every easy problem',          icon:'✅', points:500, threshold:999, stat:'easySolved' },
  { id:'night_owl',      category:'special',   title:'Night Owl',          desc:'Solve a problem after midnight',    icon:'🦉', points:20,  threshold:1,   stat:'_special_night' },
  { id:'speed_demon',    category:'special',   title:'Speed Demon',        desc:'Solve a problem in under 5 min',    icon:'⚡', points:50,  threshold:1,   stat:'_special_speed' },
];

const CATEGORIES = ['all','milestone','difficulty','streak','contest','submission','special'];
const CAT_LABELS = { all:'All', milestone:'Milestones', difficulty:'Difficulty', streak:'Streaks', contest:'Contests', submission:'Submissions', special:'Special' };
const CAT_COLORS = {
  milestone:  'from-blue-500 to-cyan-500',
  difficulty: 'from-red-500 to-orange-500',
  streak:     'from-orange-500 to-yellow-500',
  contest:    'from-yellow-500 to-amber-500',
  submission: 'from-green-500 to-teal-500',
  special:    'from-purple-500 to-pink-500',
};

// ── Achievement Card ──────────────────────────────────────────────────────────
const AchievementCard = ({ ach, progress, isDark }) => {
  const val        = progress[ach.stat] ?? 0;
  const pct        = Math.min(100, Math.round((val / ach.threshold) * 100));
  const unlocked   = pct >= 100;
  const gradBg     = CAT_COLORS[ach.category] || 'from-gray-500 to-gray-600';
  const card       = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`rounded-2xl border p-4 flex gap-4 transition-all ${card} ${unlocked ? 'ring-1 ring-yellow-500/30' : 'opacity-80'}`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
        ${unlocked ? `bg-gradient-to-br ${gradBg} shadow-lg` : isDark ? 'bg-gray-800' : 'bg-gray-100'}
        ${!unlocked ? 'grayscale' : ''}`}>
        {unlocked ? ach.icon : <FiLock className={isDark ? 'text-gray-600' : 'text-gray-400'} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ach.title}</span>
          {unlocked && <FiCheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />}
          <span className={`ml-auto text-xs font-bold ${unlocked ? 'text-yellow-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            +{ach.points} pts
          </span>
        </div>
        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{ach.desc}</p>

        {/* Progress bar */}
        {!ach.stat.startsWith('_special') && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                {unlocked ? 'Completed!' : `${Math.min(val, ach.threshold)} / ${ach.threshold}`}
              </span>
              <span className={unlocked ? 'text-green-400' : isDark ? 'text-gray-500' : 'text-gray-400'}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${unlocked ? `bg-gradient-to-r ${gradBg}` : 'bg-gray-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
        {ach.stat.startsWith('_special') && !unlocked && (
          <p className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Complete special condition to unlock</p>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Achievements = () => {
  const { isDark } = useTheme();
  const { user }   = useAuth();

  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('all');
  const [filter, setFilter]       = useState('all');   // all | unlocked | locked
  const [search, setSearch]       = useState('');

  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => { if (user?._id || user?.id) loadStats(); }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const userId = user._id || user.id;
      const res    = await api.get(`/users/${userId}/stats`);
      const d      = res?.data?.user?.stats || res?.data?.stats || res?.user?.stats || res?.stats || {};
      setStats({
        totalSolved:          d.totalProblemsSolved ?? d.problemsSolved ?? 0,
        easySolved:           d.easySolved   ?? 0,
        mediumSolved:         d.mediumSolved ?? 0,
        hardSolved:           d.hardSolved   ?? 0,
        streak:               d.streak       ?? 0,
        maxStreak:            d.maxStreak    ?? 0,
        contestsParticipated: d.contestsParticipated ?? 0,
        rating:               d.rating       ?? 1500,
        totalSubmissions:     d.totalSubmissions ?? 0,
        acceptanceRate:       d.totalSubmissions > 0
          ? Math.round((d.acceptedSubmissions / d.totalSubmissions) * 100) : 0,
        contestTopTen:        0, // would come from contest stats
        _special_night:       0,
        _special_speed:       0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      toast.error('Could not load achievement progress');
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (ach) => {
    const val       = stats[ach.stat] ?? 0;
    const pct       = Math.min(100, Math.round((val / ach.threshold) * 100));
    return { val, pct, unlocked: pct >= 100 };
  };

  const filtered = ACHIEVEMENTS.filter(ach => {
    const p       = getProgress(ach);
    const matchCat = category === 'all' || ach.category === category;
    const matchFil = filter === 'all' || (filter === 'unlocked' ? p.unlocked : !p.unlocked);
    const matchSrch= !search || ach.title.toLowerCase().includes(search.toLowerCase()) || ach.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchFil && matchSrch;
  });

  const unlockedCount = ACHIEVEMENTS.filter(a => getProgress(a).unlocked).length;
  const totalPoints   = ACHIEVEMENTS.filter(a => getProgress(a).unlocked).reduce((sum,a) => sum + a.points, 0);

  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <Loader />
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black ${txt}`}>Achievements</h1>
            <p className={`text-sm ${sub} mt-1`}>
              {unlockedCount}/{ACHIEVEMENTS.length} unlocked · {totalPoints} points earned
            </p>
          </div>
          <Link to="/profile" className={`text-xs ${sub} hover:text-rose-400`}>View Profile →</Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Problems Solved', value: stats.totalSolved || 0, icon:'💯', color:'text-blue-400' },
            { label:'Current Streak',  value: `${stats.streak || 0}d`, icon:'🔥', color:'text-orange-400' },
            { label:'Contest Rating',  value: stats.rating || 1500,    icon:'⭐', color:'text-yellow-400' },
            { label:'Points Earned',   value: totalPoints,             icon:'🏆', color:'text-green-400' },
          ].map(s => (
            <div key={s.label} className={`${card} border rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className={`text-xs ${sub} mt-1`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className={`${card} border rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-bold ${txt}`}>Overall Progress</span>
            <span className="text-sm font-bold text-rose-400">{unlockedCount}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-500">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Expert</span>
            <span>Legend</span>
          </div>
        </div>

        {/* Filters */}
        <div className={`${card} border rounded-2xl p-4 flex flex-wrap gap-3 items-center`}>
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${sub}`} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search achievements..."
              className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-rose-500
                ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1">
            {['all','unlocked','locked'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f ? 'bg-rose-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                {f === 'unlocked' ? '✅' : f === 'locked' ? '🔒' : '📋'} {f}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => {
            const count = ACHIEVEMENTS.filter(a => (c === 'all' || a.category === c) && getProgress(a).unlocked).length;
            const total = ACHIEVEMENTS.filter(a => c === 'all' || a.category === c).length;
            return (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  category === c
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow'
                    : isDark ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}>
                {CAT_LABELS[c]}
                <span className={`text-xs ${category === c ? 'text-rose-100' : 'text-gray-500'}`}>{count}/{total}</span>
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        {filtered.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <FiAward className={`h-12 w-12 mx-auto mb-3 ${sub} opacity-30`} />
            <p className={sub}>No achievements match your filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered
              .sort((a, b) => {
                const pa = getProgress(a).unlocked;
                const pb = getProgress(b).unlocked;
                if (pa !== pb) return pb - pa; // unlocked first
                return getProgress(b).pct - getProgress(a).pct; // then by progress
              })
              .map(ach => (
                <AchievementCard
                  key={ach.id}
                  ach={ach}
                  progress={stats}
                  isDark={isDark}
                />
              ))}
          </div>
        )}

        {/* Tips */}
        <div className={`${card} border rounded-2xl p-5`}>
          <h3 className={`text-sm font-bold ${txt} mb-3`}>💡 How to earn more achievements</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {[
              { tip:'Solve problems daily to build streaks — even 1 problem/day counts', icon:'🔥' },
              { tip:'Join rated contests to improve your rating and unlock contest badges', icon:'🏆' },
              { tip:'Challenge yourself with hard problems — they give the most achievement points', icon:'💪' },
            ].map((t,i) => (
              <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-3 flex gap-2`}>
                <span className="text-lg">{t.icon}</span>
                <span className={sub}>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;