import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle, FiClock } from 'react-icons/fi';
import { BsCircle, BsCheckCircleFill } from 'react-icons/bs';
import { TbRefresh } from 'react-icons/tb';
import ProblemCard from '../components/problems/ProblemCard';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Problems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [userSolved, setUserSolved] = useState([]);

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
    fetchUserSolved();
  }, [page, difficulty, status, tags, sortBy, searchQuery]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchQuery || undefined,
        difficulty: difficulty || undefined,
        status: status || undefined,
        tags: tags.length > 0 ? tags : undefined,
        sort: sortBy,
      };

      const response = await api.get('/problems', { params });
      setProblems(response.data.problems);
      setTotalPages(response.data.totalPages);
      
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
      toast.error('Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

const fetchUserSolved = async () => {
  try {
    const response = await api.get('/submissions/user/solved');
    console.log('Solved problems response:', response);
    
    // FIXED: Handle the actual API response structure
    let solvedIds = [];
    
    // The API returns: { success: true, statusCode: 200, message: '...', data: {...}, meta: {...} }
    // And data contains: { solvedProblems: [...array of problem IDs...] }
    
    if (response && response.data) {
      // Case 1: { data: { solvedProblems: [...] } }
      if (response.data.solvedProblems && Array.isArray(response.data.solvedProblems)) {
        solvedIds = response.data.solvedProblems;
      }
      // Case 2: { data: { data: { solvedProblems: [...] } } }
      else if (response.data.data && response.data.data.solvedProblems && Array.isArray(response.data.data.solvedProblems)) {
        solvedIds = response.data.data.solvedProblems;
      }
      // Case 3: { data: [...] } - direct array
      else if (Array.isArray(response.data)) {
        solvedIds = response.data;
      }
      // Case 4: Direct array response
      else if (Array.isArray(response)) {
        solvedIds = response;
      }
      else {
        console.log('Using fallback: response structure not recognized');
        solvedIds = [];
      }
    }
    
    console.log('Extracted solved problem IDs:', solvedIds);
    setUserSolved(solvedIds);
  } catch (error) {
    console.error('Failed to fetch solved problems:', error);
    setUserSolved([]);
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
  // Make sure userSolved is an array before using .includes
  if (Array.isArray(userSolved) && userSolved.includes(problemId)) {
    return <BsCheckCircleFill className="text-green-500" />;
  }
  return <BsCircle className="text-gray-400 dark:text-gray-600" />;
};

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
              >
                <option value="">All</option>
                {statusOptions.map((stat) => (
                  <option key={stat} value={stat} className="capitalize">
                    {stat}
                  </option>
                ))}
              </select>
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${tags.includes(tag)
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
          <div className="col-span-5 md:col-span-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            Title
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Difficulty
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            Acceptance
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            <div className="flex items-center justify-center">
              <FiClock className="mr-1" />
              Time
            </div>
          </div>
        </div>

        {/* Problems */}
        {problems.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {problems.map((problem) => (
              <div
                key={problem._id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                <div className="col-span-1 flex items-center justify-center">
                  {getStatusIcon(problem._id)}
                </div>
                <div className="col-span-5 md:col-span-6">
                  <Link
                    to={`/problem/${problem._id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {problem.title}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {problem.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        +{problem.tags.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${problem.difficulty === 'easy'
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
                    {problem.acceptanceRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {problem.acceptedSubmissions}/{problem.totalSubmissions}
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {problem.timeLimit}ms
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {problem.memoryLimit}MB
                  </div>
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
        {problems.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, problems.length + (page - 1) * limit)} of{' '}
                {totalPages * limit} results
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
                      className={`px-3 py-1 rounded ${page === pageNum
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
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
    <div className="flex items-center">
      <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
        <FiCheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {Array.isArray(userSolved) ? userSolved.length : 0}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Problems Solved
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
          {Array.isArray(userSolved) ? userSolved.length : 0}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total Solved
        </div>
      </div>
    </div>
  </div>
  
  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
    <div className="flex items-center">
      <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg mr-4">
        <FiClock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {new Date().getHours()}h
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Coding Streak
        </div>
      </div>
    </div>
  </div>
</div>

    </div>
  );
};
export default Problems;