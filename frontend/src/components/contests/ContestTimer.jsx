import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle } from 'react-icons/fi';

/**
 * ContestTimer Component
 * Displays a countdown timer for contests
 */
const ContestTimer = ({ 
  startTime, 
  endTime, 
  onEnd,
  size = 'medium',
  showIcon = true,
  showLabels = true
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  
  const [status, setStatus] = useState('upcoming'); // 'upcoming', 'live', 'ended'

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      // Determine contest status
      if (now < start) {
        setStatus('upcoming');
        const difference = start - now;
        return calculateTime(difference, 'Starts in');
      } else if (now >= start && now <= end) {
        setStatus('live');
        const difference = end - now;
        return calculateTime(difference, 'Ends in');
      } else {
        setStatus('ended');
        if (onEnd) onEnd();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, label: 'Ended' };
      }
    };

    const calculateTime = (milliseconds, label) => {
      if (milliseconds <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, label };
      }

      const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
      const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, total: milliseconds, label };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime, onEnd]);

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'text-sm',
      number: 'text-lg',
      label: 'text-xs'
    },
    medium: {
      container: 'text-base',
      number: 'text-2xl',
      label: 'text-sm'
    },
    large: {
      container: 'text-lg',
      number: 'text-4xl',
      label: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Status colors
  const statusColors = {
    upcoming: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      gradient: 'from-blue-600 to-indigo-600'
    },
    live: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      gradient: 'from-green-600 to-emerald-600'
    },
    ended: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
      gradient: 'from-gray-600 to-gray-700'
    }
  };

  const colors = statusColors[status];

  // Format time unit with leading zero
  const formatUnit = (value) => String(value).padStart(2, '0');

  // Show warning when less than 5 minutes remaining
  const isUrgent = status === 'live' && timeLeft.total < 5 * 60 * 1000 && timeLeft.total > 0;

  if (status === 'ended') {
    return (
      <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${colors.bg} ${colors.text} ${config.container}`}>
        {showIcon && <FiClock className="w-5 h-5" />}
        <span className="font-semibold">Contest Ended</span>
      </div>
    );
  }

  return (
    <div className={`relative ${config.container}`}>
      {/* Urgent Warning */}
      {isUrgent && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-sm animate-pulse">
          <FiAlertCircle className="w-4 h-4" />
          <span>Contest ending soon!</span>
        </div>
      )}

      {/* Timer Container */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${colors.bg} border ${colors.border}`}>
        {/* Icon */}
        {showIcon && (
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient}`}>
            <FiClock className={`w-5 h-5 text-white ${isUrgent ? 'animate-pulse' : ''}`} />
          </div>
        )}

        {/* Time Display */}
        <div className="flex items-center gap-3">
          {/* Days (only show if > 0) */}
          {timeLeft.days > 0 && (
            <>
              <TimeUnit 
                value={timeLeft.days} 
                label="Days" 
                showLabel={showLabels}
                textColor={colors.text}
                config={config}
              />
              <span className={`${colors.text} font-bold`}>:</span>
            </>
          )}

          {/* Hours */}
          <TimeUnit 
            value={formatUnit(timeLeft.hours)} 
            label="Hours" 
            showLabel={showLabels}
            textColor={colors.text}
            config={config}
          />
          
          <span className={`${colors.text} font-bold`}>:</span>

          {/* Minutes */}
          <TimeUnit 
            value={formatUnit(timeLeft.minutes)} 
            label="Minutes" 
            showLabel={showLabels}
            textColor={colors.text}
            config={config}
          />
          
          <span className={`${colors.text} font-bold`}>:</span>

          {/* Seconds */}
          <TimeUnit 
            value={formatUnit(timeLeft.seconds)} 
            label="Seconds" 
            showLabel={showLabels}
            textColor={colors.text}
            config={config}
          />
        </div>

        {/* Status Label */}
        {timeLeft.label && (
          <div className="ml-2 text-sm text-gray-400 font-medium">
            {timeLeft.label}
          </div>
        )}
      </div>
    </div>
  );
};

// Time Unit Component
const TimeUnit = ({ value, label, showLabel, textColor, config }) => (
  <div className="flex flex-col items-center">
    <div className={`${config.number} ${textColor} font-bold tabular-nums`}>
      {value}
    </div>
    {showLabel && (
      <div className={`${config.label} text-gray-400 uppercase tracking-wide`}>
        {label}
      </div>
    )}
  </div>
);

export default ContestTimer;