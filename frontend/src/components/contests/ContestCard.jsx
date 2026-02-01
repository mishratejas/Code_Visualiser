import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiUsers, FiArrowRight } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';import { formatDistanceToNow } from 'date-fns';
import Button from '../common/Button';

/**
 * ContestCard Component
 * Displays a single contest with all relevant information
 */
const ContestCard = ({ contest }) => {
  const navigate = useNavigate();

  if (!contest) return null;

  const {
    _id,
    id,
    title,
    description,
    startTime,
    endTime,
    duration,
    participantsCount = 0,
    problemsCount = 0,
    difficulty,
    status,
    isRegistered = false,
    banner
  } = contest;

  const contestId = _id || id;

  // Calculate contest status
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const isUpcoming = now < start;
  const isLive = now >= start && now <= end;
  const isEnded = now > end;

  // Status badge configuration
  const statusConfig = {
    upcoming: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      label: 'Upcoming',
      icon: FiCalendar
    },
    live: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      label: 'Live Now',
      icon: FiClock
    },
    ended: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      label: 'Ended',
      icon: FiTrophy
    }
  };

  const currentStatus = isLive ? 'live' : isEnded ? 'ended' : 'upcoming';
  const statusInfo = statusConfig[currentStatus];
  const StatusIcon = statusInfo.icon;

  // Difficulty color
  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400'
  };

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Handle contest actions
  const handleContestClick = () => {
    if (isLive && isRegistered) {
      navigate(`/contests/${contestId}/live`);
    } else {
      navigate(`/contests/${contestId}`);
    }
  };

  const handleRegister = (e) => {
    e.stopPropagation();
    navigate(`/contests/${contestId}`);
  };

  return (
    <div 
      className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-rose-500/50 transition-all duration-300 group cursor-pointer"
      onClick={handleContestClick}
    >
      {/* Banner Image */}
      {banner && (
        <div className="h-40 overflow-hidden bg-gradient-to-br from-rose-600/20 to-red-600/20">
          <img 
            src={banner} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text} text-sm font-medium`}>
            <StatusIcon className="w-4 h-4" />
            {statusInfo.label}
          </div>
          
          {difficulty && (
            <span className={`text-sm font-medium ${difficultyColors[difficulty] || 'text-gray-400'}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Contest Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Start Time */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiCalendar className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-xs text-gray-500">Starts</div>
              <div className="text-white">
                {formatDistanceToNow(start, { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiClock className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-white">
                {formatDuration(duration || 180)}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiUsers className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-xs text-gray-500">Participants</div>
              <div className="text-white">{participantsCount}</div>
            </div>
          </div>

          {/* Problems */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiTrophy className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-xs text-gray-500">Problems</div>
              <div className="text-white">{problemsCount}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isLive && isRegistered ? (
            <Button 
              fullWidth 
              variant="primary"
              className="group/btn"
            >
              <span>Enter Contest</span>
              <FiArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          ) : isUpcoming && !isRegistered ? (
            <Button 
              fullWidth 
              variant="primary"
              onClick={handleRegister}
            >
              Register Now
            </Button>
          ) : isRegistered ? (
            <Button 
              fullWidth 
              variant="secondary"
            >
              Registered ✓
            </Button>
          ) : (
            <Button 
              fullWidth 
              variant="outline"
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestCard;