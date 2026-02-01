import React, { useState } from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import ContestCard from './ContestCard';
import Loader from '../common/Loader';
import useDebounce from '../../hooks/useDebounce';

/**
 * ContestList Component
 * Displays a list of contests with filtering and search capabilities
 */
const ContestList = ({ 
  contests = [], 
  loading = false,
  error = null,
  showFilters = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter contests based on search and filters
  const filteredContests = contests.filter(contest => {
    // Search filter
    const matchesSearch = !debouncedSearchTerm || 
      contest.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      contest.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    // Status filter
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    
    const isUpcoming = now < start;
    const isLive = now >= start && now <= end;
    const isEnded = now > end;

    let matchesStatus = true;
    if (statusFilter === 'upcoming') matchesStatus = isUpcoming;
    else if (statusFilter === 'live') matchesStatus = isLive;
    else if (statusFilter === 'ended') matchesStatus = isEnded;

    // Difficulty filter
    const matchesDifficulty = difficultyFilter === 'all' || 
      contest.difficulty === difficultyFilter;

    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Sort contests: Live > Upcoming > Ended
  const sortedContests = [...filteredContests].sort((a, b) => {
    const now = new Date();
    
    const aStart = new Date(a.startTime);
    const aEnd = new Date(a.endTime);
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    
    const aIsLive = now >= aStart && now <= aEnd;
    const bIsLive = now >= bStart && now <= bEnd;
    const aIsUpcoming = now < aStart;
    const bIsUpcoming = now < bStart;
    
    // Live contests first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    
    // Then upcoming contests
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // Sort by start time
    return new Date(b.startTime) - new Date(a.startTime);
  });

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

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      {showFilters && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Active Filters Count */}
          {(debouncedSearchTerm || statusFilter !== 'all' || difficultyFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <span>
                Showing {sortedContests.length} of {contests.length} contests
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDifficultyFilter('all');
                }}
                className="text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contest Grid */}
      {sortedContests.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-2">
            {contests.length === 0 
              ? 'No contests available at the moment' 
              : 'No contests match your filters'}
          </div>
          {contests.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDifficultyFilter('all');
              }}
              className="text-rose-400 hover:text-rose-300 transition-colors text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedContests.map((contest) => (
            <ContestCard 
              key={contest._id || contest.id} 
              contest={contest} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContestList;