import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiBarChart2, FiCode, FiLock, FiUnlock, FiUsers, FiStar } from 'react-icons/fi';
import { BsCheckCircleFill, BsCircle, BsLightningFill } from 'react-icons/bs';
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
  isBookmarked = false,
}) => {
  const difficultyColor = getDifficultyColor(problem.difficulty);
  const acceptanceRate = problem.acceptanceRate || 
    ((problem.acceptedSubmissions / (problem.totalSubmissions || 1)) * 100).toFixed(1);

  const getStatusIcon = () => {
    if (solved) {
      return <BsCheckCircleFill className="text-green-500 text-lg" />;
    } else if (attempted) {
      return <BsCheckCircleFill className="text-yellow-500 text-lg" />;
    }
    return <BsCircle className="text-gray-300 dark:text-gray-600 text-lg" />;
  };

  const getDifficultyBadge = () => (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-bold tracking-wide",
      difficultyColor.bg,
      difficultyColor.text
    )}>
      {problem.difficulty?.toUpperCase()}
    </span>
  );

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
          "group block p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
          "rounded-2xl border border-gray-200/70 dark:border-gray-700/70",
          "hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-xl",
          "hover:scale-[1.02] transform transition-all duration-300",
          "backdrop-blur-sm",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showStatus && (
              <div className="flex-shrink-0">
                {getStatusIcon()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {problem.title}
                </h4>
                {isBookmarked && (
                  <FiStar className="text-yellow-500 fill-yellow-500" size={14} />
                )}
              </div>
              <div className="flex items-center space-x-3 mt-2">
                {getDifficultyBadge()}
                {showTags && problem.tags && problem.tags.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {problem.tags[0]}
                    {problem.tags.length > 1 && ` +${problem.tags.length - 1}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          {showStats && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white text-lg">
                  {acceptanceRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Acceptance
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center font-bold text-gray-900 dark:text-white text-lg">
                  <BsLightningFill className="mr-1 text-yellow-500" size={14} />
                  {problem.timeLimit}ms
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
        "group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700/70",
        "hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-2xl",
        "hover:scale-[1.01] transform transition-all duration-300",
        "backdrop-blur-sm overflow-hidden",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick ? () => onClick(problem) : undefined}
    >
      <Link
        to={`/problem/${problem._id}`}
        className="block p-7"
        onClick={handleClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start space-x-4">
            {showStatus && (
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {problem.title}
                </h3>
                {isBookmarked && (
                  <FiStar className="text-yellow-500 fill-yellow-500 flex-shrink-0" size={18} />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {problem.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getDifficultyBadge()}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ID: {problem.problemId || problem._id?.slice(-6)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {showTags && problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                {tag}
              </span>
            ))}
            {problem.tags.length > 4 && (
              <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                +{problem.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center group/stat">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2 group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400 transition-colors">
                <FiBarChart2 className="mr-2" />
                <span className="text-xs font-medium">Acceptance</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white group-hover/stat:text-blue-700 dark:group-hover/stat:text-blue-300 transition-colors">
                {acceptanceRate}%
              </div>
            </div>
            <div className="text-center group/stat">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2 group-hover/stat:text-yellow-600 dark:group-hover/stat:text-yellow-400 transition-colors">
                <BsLightningFill className="mr-2" />
                <span className="text-xs font-medium">Time Limit</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white group-hover/stat:text-yellow-700 dark:group-hover/stat:text-yellow-300 transition-colors">
                {problem.timeLimit}ms
              </div>
            </div>
            <div className="text-center group/stat">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2 group-hover/stat:text-purple-600 dark:group-hover/stat:text-purple-400 transition-colors">
                <FiCode className="mr-2" />
                <span className="text-xs font-medium">Memory</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white group-hover/stat:text-purple-700 dark:group-hover/stat:text-purple-300 transition-colors">
                {problem.memoryLimit}MB
              </div>
            </div>
            <div className="text-center group/stat">
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2 group-hover/stat:text-green-600 dark:group-hover/stat:text-green-400 transition-colors">
                <FiUsers className="mr-2" />
                <span className="text-xs font-medium">Submissions</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white group-hover/stat:text-green-700 dark:group-hover/stat:text-green-300 transition-colors">
                {formatNumber(problem.totalSubmissions || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm">
            {problem.isPremium ? (
              <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-300 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <FiLock className="mr-2" />
                <span className="font-medium">Premium</span>
              </div>
            ) : (
              <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700">
                <FiUnlock className="mr-2" />
                <span className="font-medium">Free</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="opacity-70">Last updated: </span>
            {problem.updatedAt ? new Date(problem.updatedAt).toLocaleDateString() : 'Recently'}
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="px-7 py-5 bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-900/30 dark:to-gray-800/30 border-t border-gray-200/50 dark:border-gray-700/50 rounded-b-2xl">
        <div className="flex space-x-3">
          <Link
            to={`/problem/${problem._id}`}
            className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 font-medium transition-all hover:scale-[1.02]"
          >
            View Details
          </Link>
          <Link
            to={`/submit/${problem._id}`}
            className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 dark:shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            Solve Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;