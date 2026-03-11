import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FiClock, FiBarChart2, FiCode, FiStar } from 'react-icons/fi';
import { BsCheckCircleFill, BsCircle, BsLightningFill } from 'react-icons/bs';

const ProblemCard = ({
  problem,
  solved = false,
  attempted = false,
  showStatus = true,
  showTags = true,
  showStats = true,
  compact = false,
  className = '',
  onClick,
  isBookmarked = false,
}) => {
  const { isDark } = useTheme();

  // Theme-specific classes
  const cardClass = isDark 
    ? 'bg-gray-900 border-gray-800 hover:border-rose-500/30' 
    : 'bg-white border-gray-200 hover:border-rose-400 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentClass = isDark ? 'text-rose-400' : 'text-rose-600';
  const hoverClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = () => {
    if (solved) {
      return <BsCheckCircleFill className="text-green-500 text-lg" />;
    } else if (attempted) {
      return <BsCheckCircleFill className="text-yellow-500 text-lg" />;
    }
    return <BsCircle className={`text-lg ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />;
  };

  if (compact) {
    return (
      <Link
        to={`/problem/${problem._id}`}
        className={`block p-4 ${cardClass} border rounded-xl transition-all ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {showStatus && getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${textClass} truncate`}>{problem.title}</span>
              {isBookmarked && <FiStar className={`h-3 w-3 ${accentClass}`} />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              {showTags && problem.tags && problem.tags[0] && (
                <span className={`text-xs ${subTextClass}`}>{problem.tags[0]}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`${cardClass} border rounded-xl overflow-hidden transition-all ${className}`}
      onClick={onClick ? () => onClick(problem) : undefined}
    >
      <Link to={`/problem/${problem._id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {showStatus && getStatusIcon()}
            <h3 className={`font-bold ${textClass} hover:${accentClass} transition-colors`}>
              {problem.title}
            </h3>
            {isBookmarked && <FiStar className={`h-4 w-4 ${accentClass}`} />}
          </div>
          <span className={`px-3 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>

        {showTags && problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {problem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded ${subTextClass}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {showStats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className={`text-sm font-bold ${textClass}`}>
                {problem.acceptanceRate || 0}%
              </div>
              <div className={`text-xs ${subTextClass}`}>Acceptance</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold ${textClass}`}>
                {problem.timeLimit || 2000}ms
              </div>
              <div className={`text-xs ${subTextClass}`}>Time</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold ${textClass}`}>
                {problem.submissions || 0}
              </div>
              <div className={`text-xs ${subTextClass}`}>Submissions</div>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
};

export default ProblemCard;