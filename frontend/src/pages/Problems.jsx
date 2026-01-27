import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle, FiClock, FiStar } from 'react-icons/fi';
import { BsCircle, BsCheckCircleFill, BsStarFill, BsStar } from 'react-icons/bs';
import { TbRefresh } from 'react-icons/tb';
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
  const tagOptions = ['Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 'Binary Search', 'Sorting', 'Greedy', 'Backtracking', 'Matrix'];
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

      // Apply status filter on frontend after getting solved/attempted data
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
      console.log('Solved problems API response:', response);
      
      let solvedIds = [];
      let attemptedIds = [];
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      
      if (data) {
        // Extract solved problems
        if (Array.isArray(data.solvedProblems)) {
          solvedIds = data.solvedProblems;
        } else if (Array.isArray(data.solved)) {
          solvedIds = data.solved;
        } else if (Array.isArray(data)) {
          solvedIds = data;
        }
        
        // Extract attempted problems
        if (Array.isArray(data.attemptedProblems)) {
          attemptedIds = data.attemptedProblems;
        } else if (Array.isArray(data.attempted)) {
          attemptedIds = data.attempted;
        }
      }
      
      console.log('Solved IDs:', solvedIds);
      console.log('Attempted IDs:', attemptedIds);
      
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
      return <BsCheckCircleFill className="text-green-500 text-lg" />;
    } else if (userAttempted.includes(problemId)) {
      return <BsCheckCircleFill className="text-yellow-500 text-lg" />;
    }
    return <BsCircle className="text-gray-400 dark:text-gray-600 text-lg" />;
  };

  const isBookmarked = (problemId) => {
    return bookmarkedProblems.includes(problemId);
  };

  // Filter problems based on status
  const filteredProblems = React.useMemo(() => {
    if (!status || !user) return problems;
    
    return problems.filter(problem => {
      switch (status) {
        case 'solved':
          return userSolved.includes(problem._id);
        case 'attempted':
          return userAttempted.includes(problem._id) && !userSolved.includes(problem._id);
        case 'unsolved':
          return !userSolved.includes(problem._id) && !userAttempted.includes(problem._id);
        default:
          return true;
      }
    });
  }, [problems, status, userSolved, userAttempted, user]);

  if (loading && problems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Problems
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Solve coding problems and improve your skills
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProblems}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Refresh"
          >
            <TbRefresh size={20} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiFilter className="mr-2" />
            Filters
            {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                <option value="">All</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff} className="capitalize">
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                disabled={!user}
              >
                <option value="">All</option>
                {statusOptions.map((stat) => (
                  <option key={stat} value={stat} className="capitalize">
                    {stat}
                  </option>
                ))}
              </select>
              {!user && (
                <p className="text-xs text-gray-500 mt-1">Login to filter by status</p>
              )}
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    tags.includes(tag)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Reset all filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Problems List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-1 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Status
          </div>
          <div className="col-span-5 md:col-span-5 text-sm font-medium text-gray-600 dark:text-gray-400">
            Title
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Difficulty
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Acceptance
          </div>
          <div className="col-span-1 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            <FiClock className="mx-auto" />
          </div>
          <div className="col-span-1 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            <FiStar className="mx-auto" />
          </div>
        </div>

        {/* Problems */}
        {filteredProblems.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProblems.map((problem) => (
              <div
                key={problem._id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                <div className="col-span-1 flex items-center justify-center">
                  {getStatusIcon(problem._id)}
                </div>
                <div className="col-span-5 md:col-span-5">
                  <Link
                    to={`/problem/${problem._id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {problem.title}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {problem.tags?.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {problem.tags && problem.tags.length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        +{problem.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      problem.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : problem.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {problem.acceptanceRate || 
                      ((problem.acceptedSubmissions / (problem.totalSubmissions || 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {problem.acceptedSubmissions || 0}/{problem.totalSubmissions || 0}
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {problem.timeLimit || problem.constraints?.timeLimit || 2000}ms
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={(e) => toggleBookmark(problem._id, e)}
                    className="text-gray-400 hover:text-yellow-500 transition"
                  >
                    {isBookmarked(problem._id) ? (
                      <BsStarFill className="text-yellow-500" />
                    ) : (
                      <BsStar />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No problems found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredProblems.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredProblems.length + (page - 1) * limit)}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-3 py-1 rounded ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
              <FiCheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userSolved.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Solved
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-lg mr-4">
              <FiClock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userAttempted.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Attempted
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg mr-4">
              <FiStar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookmarkedProblems.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Bookmarked
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg mr-4">
              <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {problems.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problems;