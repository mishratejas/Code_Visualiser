import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FiTrendingUp, FiChevronRight, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { TbCategory } from 'react-icons/tb';
import { problemsApi } from '../services/api';
import ThemeToggle from '../components/common/ThemeToggle';
import Loader from '../components/common/Loader';

// Maps BOTH "array" AND "Array" style keys to display metadata
// Backend uses lowercase-hyphen (from PROBLEM_TAGS constant)
const CATEGORY_META = {
  'array':               { label: 'Array',                icon: '📊', description: 'Array manipulation and algorithms',     color: 'from-blue-500 to-cyan-500' },
  'string':              { label: 'String',               icon: '📝', description: 'String processing and pattern matching',color: 'from-purple-500 to-pink-500' },
  'dynamic-programming': { label: 'Dynamic Programming',  icon: '🧮', description: 'Optimization with memoization',         color: 'from-green-500 to-teal-500' },
  'tree':                { label: 'Tree',                 icon: '🌳', description: 'Binary and n-ary tree problems',         color: 'from-yellow-500 to-orange-500' },
  'graph':               { label: 'Graph',                icon: '🕸️', description: 'Graph traversal and algorithms',         color: 'from-red-500 to-rose-500' },
  'binary-search':       { label: 'Binary Search',        icon: '🔍', description: 'Logarithmic search algorithms',          color: 'from-indigo-500 to-blue-500' },
  'sorting':             { label: 'Sorting',              icon: '📈', description: 'Sorting techniques and algorithms',      color: 'from-pink-500 to-red-500' },
  'hash-table':          { label: 'Hash Table',           icon: '🗂️', description: 'Hash map and set based solutions',       color: 'from-teal-500 to-green-500' },
  'stack':               { label: 'Stack',                icon: '📚', description: 'Stack data structure problems',          color: 'from-orange-500 to-amber-500' },
  'queue':               { label: 'Queue',                icon: '🎯', description: 'Queue and deque problems',               color: 'from-cyan-500 to-blue-500' },
  'math':                { label: 'Math',                 icon: '🔢', description: 'Mathematical and number theory',         color: 'from-emerald-500 to-green-500' },
  'backtracking':        { label: 'Backtracking',         icon: '🔙', description: 'Exhaustive search with pruning',         color: 'from-violet-500 to-purple-500' },
  'greedy':              { label: 'Greedy',               icon: '💡', description: 'Locally optimal greedy choices',         color: 'from-amber-500 to-yellow-500' },
  'two-pointers':        { label: 'Two Pointers',         icon: '👆', description: 'Dual pointer technique',                color: 'from-lime-500 to-green-500' },
  'sliding-window':      { label: 'Sliding Window',       icon: '🪟', description: 'Contiguous subarray problems',          color: 'from-sky-500 to-blue-500' },
  'linked-list':         { label: 'Linked List',          icon: '🔗', description: 'Linked list traversal and ops',         color: 'from-fuchsia-500 to-pink-500' },
  'recursion':           { label: 'Recursion',            icon: '🌀', description: 'Recursive problem solving',             color: 'from-rose-500 to-red-500' },
  'bit-manipulation':    { label: 'Bit Manipulation',     icon: '⚡', description: 'Bitwise operations and tricks',         color: 'from-blue-600 to-indigo-500' },
  'heap':                { label: 'Heap',                 icon: '⛏️', description: 'Priority queue problems',               color: 'from-red-600 to-orange-500' },
  'divide-and-conquer':  { label: 'Divide & Conquer',     icon: '✂️', description: 'Divide problem into sub-problems',       color: 'from-green-600 to-teal-500' },
};

// Normalize an _id from the backend (could be any case/format) to lowercase-hyphen
const normalize = (id) => (id || '').toLowerCase().replace(/\s+/g, '-');

const ProblemCategories = () => {
  const { isDark } = useTheme();
  const [tagStats, setTagStats] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchTagStats(); }, []);

  const fetchTagStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await problemsApi.getTagStats();

      // Unwrap all possible response shapes from axios interceptor
      // interceptor returns response.data, so:
      // response = { success, data: { tagStats: [...] }, message }
      let raw = [];
      if (Array.isArray(response?.data?.tagStats)) raw = response.data.tagStats;
      else if (Array.isArray(response?.tagStats))   raw = response.tagStats;
      else if (Array.isArray(response?.data))        raw = response.data;
      else if (Array.isArray(response))              raw = response;

      if (raw.length > 0) {
        setTagStats(raw);
      } else {
        // No problems seeded yet — show all known categories with 0 count
        setTagStats(Object.keys(CATEGORY_META).map(k => ({ _id: k, count: 0, avgAcceptance: 0 })));
      }
    } catch (err) {
      console.error('Failed to fetch tag stats:', err);
      setError('Could not load live stats — showing all categories');
      setTagStats(Object.keys(CATEGORY_META).map(k => ({ _id: k, count: 0, avgAcceptance: 0 })));
    } finally {
      setLoading(false);
    }
  };

  const filtered = tagStats.filter(stat => {
    const key  = normalize(stat._id);
    const meta = CATEGORY_META[key];
    const q    = search.toLowerCase();
    return (meta?.label || stat._id).toLowerCase().includes(q)
      || (meta?.description || '').toLowerCase().includes(q);
  });

  const totalProblems = tagStats.reduce((s, c) => s + (c.count || 0), 0);
  const avgAcc = tagStats.length > 0
    ? Math.round(tagStats.reduce((s, c) => s + (c.avgAcceptance || 0), 0) / tagStats.length)
    : 0;

  const bg      = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card    = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt     = isDark ? 'text-white' : 'text-gray-900';
  const sub     = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCl = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  if (loading) return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;

  return (
    <div className={`min-h-screen ${bg} py-6 px-4`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500">
              <TbCategory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${txt}`}>Problem Categories</h1>
              <p className={`text-sm ${sub}`}>Browse problems by topic</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={fetchTagStats} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Refresh">
              <FiRefreshCw className={`h-4 w-4 ${sub}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Categories', value: tagStats.length },
            { label: 'Total Problems',   value: totalProblems },
            { label: 'Avg. Acceptance',  value: `${avgAcc}%` },
          ].map(s => (
            <div key={s.label} className={`${card} rounded-xl p-4 border`}>
              <div className={`text-xs ${sub} mb-1`}>{s.label}</div>
              <div className={`text-2xl font-bold ${txt}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub} h-4 w-4`} />
          <input type="text" placeholder="Search categories..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 ${inputCl} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500`} />
        </div>

        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-sm text-yellow-500">
            ⚠️ {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(stat => {
            const key  = normalize(stat._id);
            const meta = CATEGORY_META[key] || { label: stat._id, icon: '📁', description: `${stat._id} problems`, color: 'from-gray-500 to-gray-600' };
            const acc  = Math.min(Math.round(stat.avgAcceptance || 0), 100);

            return (
              <Link key={stat._id} to={`/problems?tags=${encodeURIComponent(stat._id)}`}
                className={`group ${card} rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${stat.count === 0 ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{meta.icon}</div>
                    <div>
                      <h3 className={`font-bold text-sm ${txt}`}>{meta.label}</h3>
                      <span className={`text-xs ${sub}`}>
                        {stat.count > 0 ? `${stat.count} problem${stat.count !== 1 ? 's' : ''}` : 'No problems yet'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${meta.color}`}>
                    <FiTrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                <p className={`text-xs ${sub} mb-3 line-clamp-2`}>{meta.description}</p>

                {stat.count > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={sub}>Acceptance</span>
                      <span className={txt}>{(stat.avgAcceptance || 0).toFixed(1)}%</span>
                    </div>
                    <div className={`h-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${meta.color}`} style={{ width: `${acc}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className={`h-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full`} />
                )}

                <div className="flex justify-end mt-2">
                  <span className={`text-xs text-rose-500 flex items-center gap-1 group-hover:gap-2 transition-all`}>
                    {stat.count > 0 ? 'Explore' : 'Coming soon'} <FiChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className={`${card} rounded-xl p-12 text-center border`}>
            <FiSearch className={`mx-auto h-10 w-10 ${sub} mb-4 opacity-40`} />
            <h3 className={`text-lg font-bold ${txt} mb-2`}>No categories found</h3>
            <button onClick={() => setSearch('')} className="mt-2 px-5 py-2 bg-rose-500 text-white rounded-lg text-sm">
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemCategories;