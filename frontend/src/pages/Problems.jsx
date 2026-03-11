// frontend/src/pages/Problems.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle, 
  FiClock, FiStar, FiCode, FiX
} from 'react-icons/fi';
import { BsCircle, BsCheckCircleFill, BsStarFill, BsStar } from 'react-icons/bs';
import { TbRefresh } from 'react-icons/tb';
import { problemsApi, submissionsApi, usersApi } from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/common/ThemeToggle';

const Problems = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userSolved, setUserSolved] = useState([]);
  const [userAttempted, setUserAttempted] = useState([]);
  const [bookmarkedProblems, setBookmarkedProblems] = useState([]);
  const [tagStats, setTagStats] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [tags, setTags] = useState(searchParams.getAll('tags') || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  const difficulties = ['easy', 'medium', 'hard'];
  const statusOptions = ['solved', 'attempted', 'unsolved'];
  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'createdAt', label: 'Oldest' },
    { value: '-metadata.acceptanceRate', label: 'Acceptance Rate (High-Low)' },
    { value: 'metadata.acceptanceRate', label: 'Acceptance Rate (Low-High)' },
    { value: '-metadata.views', label: 'Most Viewed' },
    { value: '-metadata.submissions', label: 'Most Submitted' },
  ];

  useEffect(() => {
    fetchProblems();
    fetchTagStats();
    if (user) {
      fetchUserSolved();
      fetchBookmarks();
    }
  }, [page, difficulty, tags, sortBy, searchQuery, user]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search: searchQuery || undefined,
        difficulty: difficulty || undefined,
        tags: tags.length > 0 ? tags.join(',') : undefined,
        sort: sortBy,
      };

      const response = await problemsApi.getAll(params);
      
      // Your API returns { success, data, message }
      const problemsList = response.data?.problems || [];
      const paginationData = response.data?.pagination || response.pagination;
      
      setProblems(problemsList);
      setPagination(paginationData || {
        page,
        limit: 20,
        total: problemsList.length,
        pages: Math.ceil(problemsList.length / 20)
      });
      syncUserStatusFromProblems(problemsList);
      
      // Update URL params
      const newParams = new URLSearchParams();
      if (searchQuery) newParams.set('search', searchQuery);
      if (difficulty) newParams.set('difficulty', difficulty);
      if (status) newParams.set('status', status);
      tags.forEach(tag => newParams.append('tags', tag));
      if (sortBy !== '-createdAt') newParams.set('sort', sortBy);
      if (page > 1) newParams.set('page', page.toString());
      
      setSearchParams(newParams);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast.error('Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchTagStats = async () => {
    try {
      const response = await problemsApi.getTagStats();
      setTagStats(response.data?.tagStats || []);
    } catch (error) {
      console.error('Failed to fetch tag stats:', error);
    }
  };

  const fetchUserSolved = async () => {
    try {
      const response = await submissionsApi.getUserSolved();
      const data = response.data || response;
      setUserSolved(data.solvedProblems || []);
      setUserAttempted(data.attemptedProblems || []);
    } catch (error) {
      console.error('Failed to fetch solved problems:', error);
      setUserSolved([]);
      setUserAttempted([]);
    }
  };

  // Sync userStatus from problems list (backup — problems API now returns userStatus per problem)
  const syncUserStatusFromProblems = (problemsList) => {
    if (!user) return;
    const solved = [];
    const attempted = [];
    for (const p of problemsList) {
      if (p.userStatus === 'solved') solved.push(p._id);
      else if (p.userStatus === 'attempted') attempted.push(p._id);
    }
    if (solved.length > 0 || attempted.length > 0) {
      setUserSolved(prev => [...new Set([...prev, ...solved])]);
      setUserAttempted(prev => [...new Set([...prev, ...attempted])]);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await usersApi.getBookmarks();
      const bookmarks = response.data?.bookmarks || [];
      setBookmarkedProblems(bookmarks.map(b => b._id));
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setBookmarkedProblems([]);
    }
  };

  const toggleBookmark = async (problemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to bookmark problems');
      return;
    }

    try {
      const response = await usersApi.toggleBookmark(problemId);
      
      if (response.data?.isBookmarked) {
        setBookmarkedProblems(prev => [...prev, problemId]);
        toast.success('Added to bookmarks');
      } else {
        setBookmarkedProblems(prev => prev.filter(id => id !== problemId));
        toast.success('Removed from bookmarks');
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleTagToggle = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDifficulty('');
    setStatus('');
    setTags([]);
    setSortBy('-createdAt');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusIcon = (problemId) => {
    if (userSolved.includes(problemId)) {
      return <BsCheckCircleFill className="text-green-500 text-lg" />;
    } else if (userAttempted.includes(problemId)) {
      return <BsCheckCircleFill className="text-yellow-500 text-lg" />;
    }
    return <BsCircle className={`text-lg ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />;
  };

  const isBookmarked = (problemId) => bookmarkedProblems.includes(problemId);

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  // Filter problems based on status
  const filteredProblems = problems.filter(problem => {
    const problemId = problem._id;
    
    if (!status) return true;
    if (status === 'solved') return userSolved.includes(problemId);
    if (status === 'attempted') return userAttempted.includes(problemId) && !userSolved.includes(problemId);
    if (status === 'unsolved') return !userSolved.includes(problemId) && !userAttempted.includes(problemId);
    
    return true;
  });

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark 
    ? 'bg-gray-900 border-gray-800' 
    : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentClass = isDark ? 'text-rose-400' : 'text-rose-600';
  const hoverClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const inputClass = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const filterButtonClass = (active) => active
    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
    : isDark
      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100';

  if (loading && problems.length === 0) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Theme Toggle */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className={`${cardClass} rounded-xl p-6 border`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-500">
              <FiCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Problem Set</h1>
              <p className={`text-sm ${subTextClass}`}>
                Master coding through practice • {pagination.total} problems
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextClass}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search problems..."
              className={`w-full pl-10 pr-4 py-2.5 ${inputClass} rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 mt-4 px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg text-sm ${textClass}`}
          >
            <FiFilter size={16} />
            <span>Filters</span>
            {showFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={`${cardClass} rounded-xl p-6 border space-y-6`}>
            {/* Difficulty */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      setDifficulty(difficulty === diff ? '' : diff);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterButtonClass(difficulty === diff)}`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(stat => (
                  <button
                    key={stat}
                    onClick={() => setStatus(status === stat ? '' : stat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterButtonClass(status === stat)}`}
                  >
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Topics</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2">
                {tagStats.map(stat => (
                  <button
                    key={stat._id}
                    onClick={() => handleTagToggle(stat._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      tags.includes(stat._id)
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {stat._id} ({stat.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-4 py-2.5 ${inputClass} rounded-lg border text-sm`}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg text-sm ${textClass} hover:opacity-80`}
            >
              <TbRefresh size={16} />
              Reset Filters
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${cardClass} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FiCheckCircle className="text-green-500 h-4 w-4" />
              </div>
              <div>
                <div className={`text-xl font-bold ${textClass}`}>{userSolved.length}</div>
                <div className={`text-xs ${subTextClass}`}>Solved</div>
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <FiClock className="text-yellow-500 h-4 w-4" />
              </div>
              <div>
                <div className={`text-xl font-bold ${textClass}`}>{userAttempted.length}</div>
                <div className={`text-xs ${subTextClass}`}>Attempted</div>
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FiStar className="text-purple-500 h-4 w-4" />
              </div>
              <div>
                <div className={`text-xl font-bold ${textClass}`}>{bookmarkedProblems.length}</div>
                <div className={`text-xs ${subTextClass}`}>Bookmarked</div>
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FiCode className="text-blue-500 h-4 w-4" />
              </div>
              <div>
                <div className={`text-xl font-bold ${textClass}`}>{pagination.total}</div>
                <div className={`text-xs ${subTextClass}`}>Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>
          {/* Header */}
          <div className={`grid grid-cols-12 gap-4 px-6 py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-xs font-medium ${subTextClass}`}>
            <div className="col-span-1">Status</div>
            <div className="col-span-5">Problem</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Acceptance</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Problems */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => {
                const problemId = problem._id;
                const acceptanceRate = problem.metadata?.acceptanceRate || 
                  ((problem.metadata?.acceptedSubmissions / (problem.metadata?.submissions || 1)) * 100).toFixed(1);
                
                return (
                  <div key={problemId} className={`grid grid-cols-12 gap-4 px-6 py-4 ${hoverClass} transition-colors`}>
                    <div className="col-span-1 flex items-center">
                      {getStatusIcon(problemId)}
                    </div>
                    <div className="col-span-5">
                      <Link to={`/problem/${problemId}`} className={`font-medium ${textClass} hover:${accentClass}`}>
                        {problem.title}
                      </Link>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {problem.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full ${subTextClass}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className={`text-sm font-medium ${textClass}`}>{acceptanceRate}%</div>
                        <div className={`text-xs ${subTextClass}`}>{problem.metadata?.submissions || 0} subs</div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Link
                        to={`/problem/${problemId}`}
                        className={`px-3 py-1.5 text-xs ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'} rounded-lg hover:opacity-80 transition-opacity`}
                      >
                        Solve
                      </Link>
                      <button 
                        onClick={(e) => toggleBookmark(problemId, e)}
                        className={`p-1.5 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded-lg transition-colors`}
                      >
                        {isBookmarked(problemId) ? (
                          <BsStarFill className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <BsStar className={`h-4 w-4 ${subTextClass}`} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className={subTextClass}>No problems found</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${textClass} disabled:opacity-50`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages}
              className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${textClass} disabled:opacity-50`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;