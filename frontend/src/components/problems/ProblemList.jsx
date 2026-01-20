import React, { useState } from 'react';
import { FiFilter, FiChevronUp, FiChevronDown, FiSearch, FiClock, FiBarChart2, FiCode, FiUsers, FiX } from 'react-icons/fi';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';

const ProblemList = ({
  problems = [],
  loading = false,
  totalProblems = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange = () => {},
  onFilterChange = () => {},
  filters = {},
  solvedProblems = [],
  attemptedProblems = [],
  showFilters = true,
  viewMode = 'table' // 'table' or 'grid' or 'list'
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    difficulty: filters.difficulty || '',
    status: filters.status || '',
    tags: filters.tags || [],
    sortBy: filters.sortBy || 'acceptance'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState(filters.tags || []);

  const difficultyOptions = [
    { value: '', label: 'All Difficulty' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'solved', label: 'Solved' },
    { value: 'attempted', label: 'Attempted' },
    { value: 'unsolved', label: 'Unsolved' }
  ];

  const sortOptions = [
    { value: 'acceptance', label: 'Acceptance Rate' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'title', label: 'Title' },
    { value: 'submissions', label: 'Submissions' },
    { value: 'newest', label: 'Newest' }
  ];

  const availableTags = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
    'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Tree',
    'Graph', 'Two Pointers', 'Stack', 'Queue', 'Linked List',
    'Recursion', 'Backtracking', 'Divide and Conquer', 'Bit Manipulation'
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    handleFilterChange('tags', newTags);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      difficulty: '',
      status: '',
      tags: [],
      sortBy: 'acceptance'
    };
    setLocalFilters(resetFilters);
    setSelectedTags([]);
    onFilterChange(resetFilters);
  };

  const getProblemStatus = (problemId) => {
    if (solvedProblems.includes(problemId)) return 'solved';
    if (attemptedProblems.includes(problemId)) return 'attempted';
    return 'unsolved';
  };

  const getStatusIcon = (problemId) => {
    const status = getProblemStatus(problemId);
    switch (status) {
      case 'solved':
        return <BsCheckCircleFill className="text-green-500" />;
      case 'attempted':
        return <BsCheckCircleFill className="text-yellow-500" />;
      default:
        return <BsCircle className="text-gray-300 dark:text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const renderTableRow = (problem) => {
    const status = getProblemStatus(problem._id);
    const acceptanceRate = problem.acceptanceRate || 
      ((problem.acceptedSubmissions || 0) / (problem.totalSubmissions || 1) * 100).toFixed(1);

    return (
      <tr 
        key={problem._id} 
        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      >
        <td className="px-4 py-3">
          <div className="flex items-center justify-center">
            {getStatusIcon(problem._id)}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-start space-x-3">
            <div className={`w-2 h-10 rounded-full ${
              status === 'solved' ? 'bg-green-500' :
              status === 'attempted' ? 'bg-yellow-500' : 'bg-transparent'
            }`}></div>
            <div className="min-w-0 flex-1">
              <Link
                to={`/problem/${problem._id}`}
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
              >
                {problem.title}
              </Link>
              <div className="flex flex-wrap gap-1 mt-1">
                {problem.tags?.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
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
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty?.toUpperCase() || 'N/A'}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {acceptanceRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {problem.acceptedSubmissions || 0}/{problem.totalSubmissions || 0}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-center text-sm text-gray-900 dark:text-white">
            {problem.constraints?.timeLimit || problem.timeLimit || 2000}ms
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-center space-x-2">
            <Link
              to={`/problem/${problem._id}`}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Solve
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  const renderGridItem = (problem) => {
    return (
      <div
        key={problem._id}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all"
      >
        <Link to={`/problem/${problem._id}`} className="block p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(problem._id)}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {problem.description?.substring(0, 100)}
                  {problem.description?.length > 100 ? '...' : ''}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {problem.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Acceptance</div>
              <div className="font-bold text-gray-900 dark:text-white">
                {problem.acceptanceRate?.toFixed(1) || 0}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
              <div className="font-bold text-gray-900 dark:text-white">
                {problem.constraints?.timeLimit || 2000}ms
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  if (loading && problems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <div className="flex items-center">
              <FiFilter className="mr-3 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">Filters</span>
              {(localFilters.search || localFilters.difficulty || localFilters.status || selectedTags.length > 0) && (
                <span className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  Active Filters
                </span>
              )}
            </div>
            {showFilterPanel ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showFilterPanel && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Problems
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by title or description..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Difficulty & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {difficultyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('difficulty', option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          localFilters.difficulty === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('status', option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          localFilters.status === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tags
                  </label>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => handleFilterChange('tags', [])}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear all tags
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagToggle(tag)}
                          className="ml-2 hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sortBy', option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        localFilters.sortBy === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
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
                  onClick={() => setShowFilterPanel(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
              <FiBarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalProblems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Problems
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg mr-4">
              <BsCheckCircleFill className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {solvedProblems.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Solved
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-lg mr-4">
              <FiClock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {attemptedProblems.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Attempted
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg mr-4">
              <FiCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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

      {/* Problems Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="col-span-1 text-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</span>
            </div>
            <div className="col-span-5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Problem</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Difficulty</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Acceptance</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Time</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Actions</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {problems.length > 0 ? (
              problems.map(renderTableRow)
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No problems found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.length > 0 ? (
            problems.map(renderGridItem)
          ) : (
            <div className="col-span-3 text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No problems found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalProblems > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalProblems / pageSize)}
          onPageChange={onPageChange}
          showInfo={true}
          className="mt-6"
        />
      )}
    </div>
  );
};

export default ProblemList;