import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';

const ProblemList = ({
  problems = [],
  loading = false,
  totalProblems = 0,
  currentPage = 1,
  onPageChange = () => {},
  filters = {},
  onFilterChange = () => {},
  solvedProblems = [],
  attemptedProblems = [],
  showFilters = true,
}) => {
  const { isDark } = useTheme();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-900' : 'bg-white';
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

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const statuses = ['Solved', 'Attempted', 'Unsolved'];

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (problemId) => {
    if (solvedProblems.includes(problemId)) {
      return <BsCheckCircleFill className="text-green-500 h-4 w-4" />;
    } else if (attemptedProblems.includes(problemId)) {
      return <BsCheckCircleFill className="text-yellow-500 h-4 w-4" />;
    }
    return <BsCircle className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      {showFilters && (
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg text-sm ${textClass}`}
        >
          <FiFilter size={16} />
          <span>Filters</span>
          {showFilterPanel ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
      )}

      {/* Filter Panel */}
      {showFilterPanel && showFilters && (
        <div className={`${cardClass} rounded-xl p-6 border space-y-6`}>
          {/* Search */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textClass}`}>Search</label>
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextClass}`} />
              <input
                type="text"
                placeholder="Search problems..."
                className={`w-full pl-10 pr-4 py-2 ${inputClass} rounded-lg border text-sm`}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textClass}`}>Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  className={`px-4 py-2 rounded-lg text-sm border ${
                    isDark 
                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textClass}`}>Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg text-sm border ${
                    isDark 
                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textClass}`}>Tags</label>
            <input
              type="text"
              placeholder="Filter by tags..."
              className={`w-full px-4 py-2 ${inputClass} rounded-lg border text-sm`}
            />
          </div>
        </div>
      )}

      {/* Problems Table */}
      <div className={`${cardClass} rounded-xl border overflow-hidden`}>
        {/* Header */}
        <div className={`grid grid-cols-12 gap-4 px-6 py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-xs font-medium ${subTextClass}`}>
          <div className="col-span-1">Status</div>
          <div className="col-span-6">Problem</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-3">Acceptance</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <div key={problem._id} className={`grid grid-cols-12 gap-4 px-6 py-4 ${hoverClass} transition-colors`}>
                <div className="col-span-1 flex items-center">
                  {getStatusIcon(problem._id)}
                </div>
                <div className="col-span-6">
                  <Link to={`/problem/${problem._id}`} className={`font-medium ${textClass} hover:${accentClass}`}>
                    {problem.title}
                  </Link>
                </div>
                <div className="col-span-2">
                  <span className={`px-3 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className={`text-sm ${textClass}`}>{problem.acceptanceRate || 0}%</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className={subTextClass}>No problems found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemList;