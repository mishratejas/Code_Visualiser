import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle, 
  FiClock, FiStar, FiTrendingUp, FiCode, FiAward, FiLock 
} from 'react-icons/fi';
import { BsCircle, BsCheckCircleFill, BsStarFill, BsStar, BsLightningFill } from 'react-icons/bs';
import { TbRefresh } from 'react-icons/tb';
import { HiSparkles } from 'react-icons/hi';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Problems = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [userSolved, setUserSolved] = useState([]);
  const [userAttempted, setUserAttempted] = useState([]);
  const [bookmarkedProblems, setBookmarkedProblems] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [tags, setTags] = useState(searchParams.getAll('tags') || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'acceptance');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(20);

  const difficulties = ['easy', 'medium', 'hard'];
  const statusOptions = ['solved', 'attempted', 'unsolved'];
  const tagOptions = [
    'Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 
    'Binary Search', 'Sorting', 'Greedy', 'Backtracking', 'Matrix',
    'Stack', 'Queue', 'Hash Table', 'Two Pointers', 'Sliding Window'
  ];
  const sortOptions = [
    { value: 'acceptance', label: 'Acceptance Rate' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'title', label: 'Title' },
    { value: 'submissions', label: 'Submissions' },
  ];

  useEffect(() => {
    fetchProblems();
    if (user) {
      fetchUserSolved();
      fetchBookmarks();
    }
  }, [page, difficulty, status, tags, sortBy, searchQuery, user]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchQuery || undefined,
        difficulty: difficulty || undefined,
        tags: tags.length > 0 ? tags.join(',') : undefined,
        sort: sortBy,
      };

      const response = await api.get('/problems', { params });
      
      let problemsList = response.data?.problems || response.data?.data?.problems || [];
      const total = response.data?.pagination?.total || response.data?.total || problemsList.length;
      
      setProblems(problemsList);
      setTotalPages(Math.ceil(total / limit));
      
      // Update URL params
      const newParams = new URLSearchParams();
      if (searchQuery) newParams.set('search', searchQuery);
      if (difficulty) newParams.set('difficulty', difficulty);
      if (status) newParams.set('status', status);
      tags.forEach(tag => newParams.append('tags', tag));
      if (sortBy) newParams.set('sort', sortBy);
      if (page > 1) newParams.set('page', page.toString());
      
      setSearchParams(newParams);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast.error('Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSolved = async () => {
    try {
      const response = await api.get('/submissions/user/solved');
      
      let solvedIds = [];
      let attemptedIds = [];
      
      const data = response.data?.data || response.data;
      
      if (data) {
        if (Array.isArray(data.solvedProblems)) {
          solvedIds = data.solvedProblems;
        } else if (Array.isArray(data.solved)) {
          solvedIds = data.solved;
        } else if (Array.isArray(data)) {
          solvedIds = data;
        }
        
        if (Array.isArray(data.attemptedProblems)) {
          attemptedIds = data.attemptedProblems;
        } else if (Array.isArray(data.attempted)) {
          attemptedIds = data.attempted;
        }
      }
      
      setUserSolved(Array.isArray(solvedIds) ? solvedIds : []);
      setUserAttempted(Array.isArray(attemptedIds) ? attemptedIds : []);
    } catch (error) {
      console.error('Failed to fetch solved problems:', error);
      setUserSolved([]);
      setUserAttempted([]);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/users/me/bookmarks');
      const bookmarks = response.data?.bookmarks || response.data?.data?.bookmarks || [];
      setBookmarkedProblems(Array.isArray(bookmarks) ? bookmarks : []);
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
      await api.post(`/users/bookmarks/${problemId}`);
      
      setBookmarkedProblems(prev => {
        if (prev.includes(problemId)) {
          toast.success('Removed from bookmarks');
          return prev.filter(id => id !== problemId);
        } else {
          toast.success('Added to bookmarks');
          return [...prev, problemId];
        }
      });
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
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDifficulty('');
    setStatus('');
    setTags([]);
    setSortBy('acceptance');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusIcon = (problemId) => {
    if (userSolved.includes(problemId)) {
      return <BsCheckCircleFill className="text-green-500 text-xl" />;
    } else if (userAttempted.includes(problemId)) {
      return <BsCheckCircleFill className="text-yellow-500 text-xl" />;
    }
    return <BsCircle className="text-gray-400 text-xl" />;
  };

  const isBookmarked = (problemId) => bookmarkedProblems.includes(problemId);

  // Filter problems based on status
  const filteredProblems = problems.filter(problem => {
    const problemId = problem._id || problem.id;
    
    if (!status) return true;
    if (status === 'solved') return userSolved.includes(problemId);
    if (status === 'attempted') return userAttempted.includes(problemId) && !userSolved.includes(problemId);
    if (status === 'unsolved') return !userSolved.includes(problemId) && !userAttempted.includes(problemId);
    
    return true;
  });

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': 
        return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-600 dark:text-green-400';
      case 'medium': 
        return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      case 'hard': 
        return 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30 text-red-600 dark:text-red-400';
      default: 
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  if (loading && problems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <FiCode className="text-blue-600 dark:text-blue-400" />
                  Problem Set
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  Master coding through practice • {problems.length} problems available
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <FiFilter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems by title or description..."
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-5"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 space-y-6">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Difficulty Level
                </label>
                <div className="flex flex-wrap gap-3">
                  {difficulties.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(difficulty === diff ? '' : diff)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                        difficulty === diff
                          ? getDifficultyColor(diff) + ' border-2 shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </label>
                <div className="flex flex-wrap gap-3">
                  {statusOptions.map(stat => (
                    <button
                      key={stat}
                      onClick={() => setStatus(status === stat ? '' : stat)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                        status === stat
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Topics
                </label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        tags.includes(tag)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-900 dark:text-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium"
              >
                <TbRefresh size={18} />
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              icon: FiCheckCircle, 
              label: 'Solved', 
              value: userSolved.length, 
              gradient: 'from-green-500 to-emerald-500',
              bg: 'from-green-500/10 to-emerald-500/10'
            },
            { 
              icon: FiClock, 
              label: 'Attempted', 
              value: userAttempted.length, 
              gradient: 'from-yellow-500 to-amber-500',
              bg: 'from-yellow-500/10 to-amber-500/10'
            },
            { 
              icon: FiStar, 
              label: 'Bookmarked', 
              value: bookmarkedProblems.length, 
              gradient: 'from-purple-500 to-pink-500',
              bg: 'from-purple-500/10 to-pink-500/10'
            },
            { 
              icon: FiAward, 
              label: 'Total Available', 
              value: problems.length, 
              gradient: 'from-blue-500 to-indigo-500',
              bg: 'from-blue-500/10 to-indigo-500/10'
            }
          ].map((stat, index) => (
            <div key={index} className="group relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              <div className={`relative bg-gradient-to-br ${stat.bg} backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 transform transition-all duration-200 hover:scale-105`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Problems Table */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-5"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
            {/* Table Header */}
            <div className="px-8 py-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">Status</div>
                <div className="col-span-5 flex items-center">Problem</div>
                <div className="col-span-2 flex items-center justify-center">Difficulty</div>
                <div className="col-span-2 flex items-center justify-center">Acceptance</div>
                <div className="col-span-1 flex items-center justify-center">Time</div>
                <div className="col-span-1 flex items-center justify-center">
                  <FiStar size={16} />
                </div>
              </div>
            </div>

            {/* Problems List */}
            {filteredProblems.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProblems.map((problem, index) => {
                  const problemId = problem._id || problem.id;
                  const isSolved = userSolved.includes(problemId);
                  const isAttempted = userAttempted.includes(problemId);
                  
                  return (
                    <Link
                      key={problemId}
                      to={`/problem/${problemId}`}
                      className="grid grid-cols-12 gap-4 px-8 py-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 group"
                    >
                      {/* Status Icon */}
                      <div className="col-span-1 flex items-center justify-center">
                        {getStatusIcon(problemId)}
                      </div>

                      {/* Title and Tags */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {(page - 1) * limit + index + 1}. {problem.title}
                          </h3>
                          {isSolved && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg">
                              <BsLightningFill size={10} />
                              Solved
                            </span>
                          )}
                          {isAttempted && !isSolved && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-lg">
                              In Progress
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {problem.tags?.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-lg font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {problem.tags?.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-500 font-medium">
                              +{problem.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div className="col-span-2 flex items-center justify-center">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                        </span>
                      </div>

                      {/* Acceptance Rate */}
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <div className="text-base font-bold text-gray-900 dark:text-white">
                          {problem.acceptanceRate || 
                            ((problem.acceptedSubmissions / (problem.totalSubmissions || 1)) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {problem.acceptedSubmissions || 0} / {problem.totalSubmissions || 0}
                        </div>
                      </div>

                      {/* Time Limit */}
                      <div className="col-span-1 flex items-center justify-center">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {problem.timeLimit || problem.constraints?.timeLimit || 2000}ms
                        </div>
                      </div>

                      {/* Bookmark */}
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          onClick={(e) => toggleBookmark(problemId, e)}
                          className="text-gray-400 hover:text-yellow-500 transition-all transform hover:scale-110"
                        >
                          {isBookmarked(problemId) ? (
                            <BsStarFill className="text-yellow-500 text-xl" />
                          ) : (
                            <BsStar className="text-xl" />
                          )}
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No problems found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredProblems.length > 0 && totalPages > 1 && (
              <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredProblems.length + (page - 1) * limit)} of {filteredProblems.length} problems
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problems;