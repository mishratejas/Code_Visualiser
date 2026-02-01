import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import LeaderboardCard from './LeaderboardCard';
import Loader from '../common/Loader';

/**
 * LeaderboardTable Component
 * Displays leaderboard in table/card format with pagination
 */
const LeaderboardTable = ({ 
  leaderboard = [],
  loading = false,
  error = null,
  currentUser = null,
  page = 1,
  totalPages = 1,
  onPageChange,
  variant = 'default', // 'default', 'podium'
  showPagination = true
}) => {
  const [hoveredRank, setHoveredRank] = useState(null);

  // Calculate offset for rank numbers
  const rankOffset = (page - 1) * 50; // Assuming 50 items per page

  // Check if user is in current page
  const isCurrentUser = (user) => {
    if (!currentUser) return false;
    return user.username === currentUser.username || user._id === currentUser._id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
        <div className="text-gray-400 mb-2">No leaderboard data available</div>
        <p className="text-sm text-gray-500">Check back later for rankings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Podium View for Top 3 (only on first page) */}
      {variant === 'podium' && page === 1 && leaderboard.length >= 3 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            Top Performers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <div className="md:order-1 md:self-end">
                <LeaderboardCard
                  user={leaderboard[1]}
                  rank={2}
                  showStats={true}
                  isCurrentUser={isCurrentUser(leaderboard[1])}
                  variant="podium"
                />
              </div>
            )}
            
            {/* 1st Place (center and larger) */}
            {leaderboard[0] && (
              <div className="md:order-2">
                <LeaderboardCard
                  user={leaderboard[0]}
                  rank={1}
                  showStats={true}
                  isCurrentUser={isCurrentUser(leaderboard[0])}
                  variant="podium"
                />
              </div>
            )}
            
            {/* 3rd Place */}
            {leaderboard[2] && (
              <div className="md:order-3 md:self-end md:mt-12">
                <LeaderboardCard
                  user={leaderboard[2]}
                  rank={3}
                  showStats={true}
                  isCurrentUser={isCurrentUser(leaderboard[2])}
                  variant="podium"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.map((user, index) => {
          // Skip top 3 in podium view on first page
          if (variant === 'podium' && page === 1 && index < 3) {
            return null;
          }

          const actualRank = rankOffset + index + 1;

          return (
            <div
              key={user._id || user.id || `user-${index}`}
              onMouseEnter={() => setHoveredRank(actualRank)}
              onMouseLeave={() => setHoveredRank(null)}
              className="transform transition-all duration-200"
              style={{
                transform: hoveredRank === actualRank ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <LeaderboardCard
                user={user}
                rank={actualRank}
                showStats={true}
                isCurrentUser={isCurrentUser(user)}
                variant="default"
              />
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl">
          {/* Page Info */}
          <div className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page === 1}
              className={`p-2 rounded-lg transition-all ${
                page === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              {page > 3 && (
                <>
                  <PageButton
                    pageNum={1}
                    currentPage={page}
                    onClick={() => onPageChange && onPageChange(1)}
                  />
                  {page > 4 && <span className="text-gray-500 px-2">...</span>}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2)
                .map(p => (
                  <PageButton
                    key={p}
                    pageNum={p}
                    currentPage={page}
                    onClick={() => onPageChange && onPageChange(p)}
                  />
                ))}

              {/* Last Page */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-gray-500 px-2">...</span>}
                  <PageButton
                    pageNum={totalPages}
                    currentPage={page}
                    onClick={() => onPageChange && onPageChange(totalPages)}
                  />
                </>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page === totalPages}
              className={`p-2 rounded-lg transition-all ${
                page === totalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Items Info */}
          <div className="text-sm text-gray-400">
            {((page - 1) * 50 + 1).toLocaleString()} - {Math.min(page * 50, leaderboard.length).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// Page Button Component
const PageButton = ({ pageNum, currentPage, onClick }) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 rounded-lg transition-all font-medium ${
      pageNum === currentPage
        ? 'bg-gradient-to-br from-rose-600 to-red-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {pageNum}
  </button>
);

export default LeaderboardTable;