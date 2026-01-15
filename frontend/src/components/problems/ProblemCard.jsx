import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiBarChart2, FiCode, FiLock, FiUnlock } from 'react-icons/fi';
import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { cn, formatNumber, getDifficultyColor } from '../../utils/helpers';

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
}) => {
  const difficultyColor = getDifficultyColor(problem.difficulty);
  const acceptanceRate = problem.acceptanceRate || 
    ((problem.acceptedSubmissions / (problem.totalSubmissions || 1)) * 100).toFixed(1);

  const getStatusIcon = () => {
    if (solved) {
      return <BsCheckCircleFill className="text-green-500" />;
    } else if (attempted) {
      return <BsCheckCircleFill className="text-yellow-500" />;
    }
    return <BsCircle className="text-gray-300 dark:text-gray-600" />;
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(problem);
    }
  };

  if (compact) {
    return (
      <Link
        to={`/problem/${problem._id}`}
        onClick={handleClick}
        className={cn(
          "block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
          "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showStatus && (
              <div className="flex-shrink-0">
                {getStatusIcon()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {problem.title}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  difficultyColor.bg,
                  difficultyColor.text
                )}>
                  {problem.difficulty}
                </span>
                {showTags && problem.tags && problem.tags.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {problem.tags[0]}
                    {problem.tags.length > 1 && ` +${problem.tags.length - 1}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          {showStats && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {acceptanceRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Acceptance
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {problem.timeLimit}ms
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Time
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
        "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick ? () => onClick(problem) : undefined}
    >
      <Link
        to={`/problem/${problem._id}`}
        className="block p-6"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {showStatus && (
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {problem.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {problem.description}
              </p>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1 text-sm font-medium rounded-full",
            difficultyColor.bg,
            difficultyColor.text
          )}>
            {problem.difficulty}
          </span>
        </div>

        {showTags && problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {problem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {problem.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-500">
                +{problem.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                <FiBarChart2 className="mr-1" />
                <span className="text-xs">Acceptance</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {acceptanceRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                <FiClock className="mr-1" />
                <span className="text-xs">Time Limit</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {problem.timeLimit}ms
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                <FiCode className="mr-1" />
                <span className="text-xs">Memory</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {problem.memoryLimit}MB
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                <FiUsers className="mr-1" />
                <span className="text-xs">Submissions</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(problem.totalSubmissions || 0)}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {problem.isPremium ? (
              <>
                <FiLock className="mr-1" />
                <span>Premium</span>
              </>
            ) : (
              <>
                <FiUnlock className="mr-1" />
                <span>Free</span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {problem.problemId || problem._id?.slice(-6)}
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="flex space-x-3">
          <Link
            to={`/problem/${problem._id}`}
            className="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            View Details
          </Link>
          <Link
            to={`/submit/${problem._id}`}
            className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            Solve Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;