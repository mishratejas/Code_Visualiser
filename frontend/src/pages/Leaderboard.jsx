import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiSearch, FiChevronUp, FiChevronDown, FiMinus } from 'react-icons/fi';
import { BsTrophy } from 'react-icons/bs';
import { FaMedal } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/common/ThemeToggle';
import Loader from '../components/common/Loader';

const PAGE_SIZE = 100;

const getTier = (rating) => {
  if (rating >= 2400) return { label: 'Grandmaster',   color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30' };
  if (rating >= 2100) return { label: 'Master',        color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' };
  if (rating >= 1900) return { label: 'Cand. Master',  color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' };
  if (rating >= 1600) return { label: 'Expert',        color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' };
  if (rating >= 1400) return { label: 'Specialist',    color: 'text-cyan-400',   bg: 'bg-cyan-500/15 border-cyan-500/30' };
  if (rating >= 1200) return { label: 'Pupil',         color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' };
  return               { label: 'Newbie',              color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/30' };
};

const PodiumCard = ({ item, position, isDark, isMe }) => {
  const cfgs = {
    1: { grad: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/60', ht: 'h-36', crown: '👑', lbl: '1st' },
    2: { grad: 'from-slate-300 to-slate-500',  ring: 'ring-slate-300/50',  ht: 'h-28', crown: '🥈', lbl: '2nd' },
    3: { grad: 'from-amber-600 to-amber-800',  ring: 'ring-amber-600/50',  ht: 'h-24', crown: '🥉', lbl: '3rd' },
  };
  const c    = cfgs[position];
  const tier = getTier(item.rating || 1500);
  const order = position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${order}`}>
      <span className="text-2xl">{c.crown}</span>
      <div className={`relative w-14 h-14 rounded-full ring-4 ${c.ring} overflow-hidden bg-gradient-to-br ${c.grad} flex items-center justify-center text-white font-bold text-lg`}>
        {item.avatar
          ? <img src={item.avatar} alt="" className="w-full h-full object-cover" />
          : item.username?.charAt(0).toUpperCase()
        }
        {isMe && <div className="absolute inset-0 bg-rose-500/40 flex items-center justify-center text-[10px] font-black">YOU</div>}
      </div>
      <div className="text-center max-w-[88px]">
        <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.username}</div>
        <div className={`text-[10px] font-semibold ${tier.color}`}>{tier.label}</div>
      </div>
      <div className={`w-20 ${c.ht} bg-gradient-to-b ${c.grad} rounded-t-xl flex flex-col items-center justify-center shadow-lg`}>
        <span className="text-white font-black text-base">{c.lbl}</span>
        <span className="text-white/75 text-[10px] font-medium">{(item.rating || 1500).toLocaleString()}</span>
      </div>
    </div>
  );
};

const DeltaBadge = ({ delta }) => {
  if (delta == null) return null;
  if (delta > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400"><FiChevronUp className="h-2.5 w-2.5"/>{delta}</span>;
  if (delta < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400"><FiChevronDown className="h-2.5 w-2.5"/>{Math.abs(delta)}</span>;
  return <FiMinus className="h-3 w-3 text-gray-500" />;
};

const Leaderboard = () => {
  const { user }                = useAuth();
  const { isDark }              = useTheme();
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('global');
  const [userRank, setUserRank] = useState(null);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [more, setMore]         = useState(false);

  const fetchLeaderboard = useCallback(async (pageNum, reset) => {
    pageNum === 1 ? setLoading(true) : setMore(true);
    try {
      const res     = await api.get('/leaderboard', { params: { timeframe: filter === 'global' ? 'all' : filter, limit: PAGE_SIZE, page: pageNum } });
      const payload = res?.data || res;
      const raw     = payload?.leaderboard || (Array.isArray(payload) ? payload : []);
      const totalN  = payload?.total ?? raw.length;

      const norm = raw.map((item, idx) => ({
        rank:         item.rank    || (pageNum - 1) * PAGE_SIZE + idx + 1,
        userId:       item.userId  || item._id,
        username:     item.username || `User${idx + 1}`,
        name:         item.name    || item.profile?.name || '',
        avatar:       item.avatar  || item.profile?.avatar || null,
        country:      item.country || item.profile?.country || '',
        totalSolved:  item.totalSolved || 0,
        score:        item.score   || 0,
        rating:       item.rating  || 1500,
        streak:       item.streak  || 0,
        contests:     item.contests || 0,
        ratingChange: item.ratingChange ?? null,
      }));

      setData(prev => (reset || pageNum === 1) ? norm : [...prev, ...norm]);
      setTotal(prev => totalN > 0 ? totalN : (pageNum === 1 ? norm.length : prev));
      setPage(pageNum);

      if (user && pageNum === 1) {
        const myIdx = norm.findIndex(i => i.userId === (user._id || user.id) || i.username === user.username);
        setUserRank(myIdx !== -1 ? myIdx + 1 : null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load leaderboard');
      if (pageNum === 1) setData([]);
    } finally {
      setLoading(false);
      setMore(false);
    }
  }, [filter, user]);

  useEffect(() => { setPage(1); setData([]); setTotal(0); fetchLeaderboard(1, true); }, [fetchLeaderboard]);

  const filtered = data.filter(i => !search || i.username.toLowerCase().includes(search.toLowerCase()));
  const top3     = filtered.slice(0, 3);
  const rest     = filtered.slice(3);

  // ── Theme helpers ──
  const bg       = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card     = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt      = isDark ? 'text-white' : 'text-gray-900';
  const sub      = isDark ? 'text-gray-400' : 'text-gray-500';
  const div      = isDark ? 'divide-gray-800/50' : 'divide-gray-100';
  const inputCls = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const rowH     = isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50';

  const rankBadge = (rank) => {
    if (rank === 1) return <BsTrophy className="text-yellow-400 text-2xl drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <FaMedal  className="text-slate-400 text-2xl" />;
    if (rank === 3) return <FaMedal  className="text-amber-600 text-2xl" />;
    return <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{rank}</div>;
  };

  const rowAccent = (rank) => {
    if (rank === 1) return isDark ? 'border-l-2 border-yellow-400/50 bg-yellow-500/5' : 'border-l-2 border-yellow-400 bg-yellow-50/70';
    if (rank === 2) return isDark ? 'border-l-2 border-slate-400/50 bg-slate-500/5'   : 'border-l-2 border-slate-400 bg-slate-50';
    if (rank === 3) return isDark ? 'border-l-2 border-amber-600/50 bg-amber-500/5'   : 'border-l-2 border-amber-600 bg-amber-50/70';
    return '';
  };

  const FILTERS = [{ value: 'global', label: 'All Time' }, { value: 'weekly', label: 'This Week' }, { value: 'monthly', label: 'This Month' }];

  if (loading) return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/25">
              <BsTrophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${txt}`}>Leaderboard</h1>
              <p className={`text-sm ${sub}`}>{total > data.length ? `Showing ${data.length} of ${total} coders` : `${data.length} coders ranked`}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Your rank */}
        {userRank && (
          <div className={`rounded-xl p-4 border flex items-center gap-4 ${isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
            <span className="text-2xl">🎯</span>
            <div>
              <p className={`text-sm ${sub}`}>Your current ranking</p>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-bold ${txt}`}>#{userRank} globally</p>
                {data[userRank - 1] && (() => { const t = getTier(data[userRank-1].rating); return <span className={`text-xs font-bold px-2 py-0.5 rounded border ${t.bg} ${t.color}`}>{t.label}</span>; })()}
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {!search && top3.length === 3 && (
          <div className={`${card} border rounded-2xl p-6`}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">🏆</span>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${sub}`}>Top Performers</h2>
            </div>
            <div className="flex justify-center items-end gap-3 sm:gap-6">
              {[2, 1, 3].map(pos => {
                const item = top3[pos - 1];
                if (!item) return null;
                return <PodiumCard key={item.userId} item={item} position={pos} isDark={isDark} isMe={item.username === user?.username} />;
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={`${card} rounded-xl p-4 border flex flex-col sm:flex-row gap-3`}>
          <div className="relative flex-1">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub} h-4 w-4`} />
            <input type="text" placeholder="Search by username…" value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 ${inputCls} rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500`} />
          </div>
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/20' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={`${card} rounded-xl border overflow-hidden`}>

          {/* Column headers */}
          <div className={`grid grid-cols-12 px-5 py-3 text-xs font-semibold uppercase tracking-wider ${sub} ${isDark ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-2 text-center">Solved</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-1 text-center">🔥</div>
          </div>

          {/* Rows */}
          <div className={`divide-y ${div}`}>
            {filtered.length > 0 ? filtered.map(item => {
              const isMe = item.username === user?.username;
              const tier = getTier(item.rating || 1500);
              return (
                <div key={item.userId || item.rank}
                  className={`grid grid-cols-12 px-5 py-3.5 transition-colors ${rowAccent(item.rank)} ${rowH} ${isMe ? (isDark ? '!bg-rose-500/10' : '!bg-rose-50') : ''}`}>

                  {/* Rank */}
                  <div className="col-span-1 flex items-center">{rankBadge(item.rank)}</div>

                  {/* User */}
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {item.avatar ? <img src={item.avatar} alt="" className="w-full h-full object-cover" /> : item.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-semibold text-sm ${txt} flex items-center gap-1 flex-wrap`}>
                        <span className="truncate">{item.username}</span>
                        {isMe && <span className="text-xs text-rose-500 font-bold">(you)</span>}
                      </div>
                      {item.name && <div className={`text-xs ${sub} truncate`}>{item.name}</div>}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2 flex flex-col items-center justify-center gap-0.5">
                    <span className={`font-bold text-sm ${tier.color}`}>{(item.rating || 1500).toLocaleString()}</span>
                    <span className={`hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tier.bg} ${tier.color}`}>{tier.label}</span>
                  </div>

                  {/* Solved */}
                  <div className={`col-span-2 flex items-center justify-center font-semibold text-sm ${txt}`}>{item.totalSolved}</div>

                  {/* Score + delta */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <span className="font-semibold text-sm text-rose-500">{(item.score || 0).toLocaleString()}</span>
                    <DeltaBadge delta={item.ratingChange} />
                  </div>

                  {/* Streak */}
                  <div className={`col-span-1 flex items-center justify-center text-sm ${sub}`}>
                    {item.streak > 0 ? item.streak : '—'}
                  </div>
                </div>
              );
            }) : (
              <div className={`py-16 text-center ${sub}`}>
                <BsTrophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No rankings found{search ? ` for "${search}"` : ''}.</p>
              </div>
            )}
          </div>

          {/* Load more */}
          {!search && data.length > 0 && data.length < total && (
            <div className={`px-5 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'} text-center`}>
              <button onClick={() => fetchLeaderboard(page + 1, false)} disabled={more}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 mx-auto disabled:opacity-50 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {more ? <><FiTrendingUp className="h-4 w-4 animate-spin" />Loading…</> : <>Load More ({total - data.length} remaining)</>}
              </button>
            </div>
          )}
        </div>

        {/* Rating tier legend */}
        <div className={`${card} border rounded-xl p-4`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${sub} mb-3`}>Rating Tiers</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Grandmaster',  min: 2400, color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30' },
              { label: 'Master',       min: 2100, color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
              { label: 'Cand. Master', min: 1900, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
              { label: 'Expert',       min: 1600, color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
              { label: 'Specialist',   min: 1400, color: 'text-cyan-400',   bg: 'bg-cyan-500/15 border-cyan-500/30' },
              { label: 'Pupil',        min: 1200, color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
              { label: 'Newbie',       min: 0,    color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/30' },
            ].map(t => (
              <span key={t.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${t.bg} ${t.color}`}>
                {t.label} <span className="opacity-60">≥{t.min}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;