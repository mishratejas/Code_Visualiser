import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (date, includeSeconds = false) => {
  if (!date) return 'N/A';
  const formatStr = includeSeconds 
    ? 'MMM dd, yyyy • hh:mm:ss a' 
    : 'MMM dd, yyyy • hh:mm a';
  return formatDate(date, formatStr);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format duration from seconds
 */
export const formatDurationFromSeconds = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format execution time in milliseconds
 */
export const formatExecutionTime = (ms) => {
  if (!ms && ms !== 0) return 'N/A';
  
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(2);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Format memory usage
 */
export const formatMemory = (bytes) => {
  if (!bytes && bytes !== 0) return 'N/A';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format contest time remaining
 */
export const formatContestTimeRemaining = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    // Contest hasn't started
    const diff = start - now;
    const duration = intervalToDuration({ start: now, end: start });
    
    if (duration.days > 0) {
      return `Starts in ${duration.days}d ${duration.hours}h`;
    } else if (duration.hours > 0) {
      return `Starts in ${duration.hours}h ${duration.minutes}m`;
    } else {
      return `Starts in ${duration.minutes}m`;
    }
  } else if (now >= start && now <= end) {
    // Contest ongoing
    const diff = end - now;
    const duration = intervalToDuration({ start: now, end: end });
    
    if (duration.days > 0) {
      return `${duration.days}d ${duration.hours}h remaining`;
    } else if (duration.hours > 0) {
      return `${duration.hours}h ${duration.minutes}m remaining`;
    } else {
      return `${duration.minutes}m remaining`;
    }
  } else {
    // Contest ended
    return 'Contest ended';
  }
};

/**
 * Format problem difficulty with color
 */
export const formatDifficulty = (difficulty) => {
  if (!difficulty) return 'Unknown';
  
  const colors = {
    easy: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    hard: 'text-red-600 dark:text-red-400',
  };

  const colorClass = colors[difficulty.toLowerCase()] || 'text-gray-600 dark:text-gray-400';
  
  return {
    text: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    color: colorClass,
  };
};

/**
 * Format submission status with icon and color
 */
export const formatSubmissionStatus = (status) => {
  if (!status) return { text: 'Unknown', color: 'text-gray-600', icon: '❓' };
  
  const statusMap = {
    accepted: {
      text: 'Accepted',
      color: 'text-green-600 dark:text-green-400',
      icon: '✅',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    wrong_answer: {
      text: 'Wrong Answer',
      color: 'text-red-600 dark:text-red-400',
      icon: '❌',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
    time_limit_exceeded: {
      text: 'Time Limit Exceeded',
      color: 'text-yellow-600 dark:text-yellow-400',
      icon: '⏱️',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    runtime_error: {
      text: 'Runtime Error',
      color: 'text-red-600 dark:text-red-400',
      icon: '💥',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
    compilation_error: {
      text: 'Compilation Error',
      color: 'text-red-600 dark:text-red-400',
      icon: '🔧',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
    memory_limit_exceeded: {
      text: 'Memory Limit Exceeded',
      color: 'text-yellow-600 dark:text-yellow-400',
      icon: '💾',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    pending: {
      text: 'Pending',
      color: 'text-blue-600 dark:text-blue-400',
      icon: '⏳',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    running: {
      text: 'Running',
      color: 'text-blue-600 dark:text-blue-400',
      icon: '⚙️',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
  };

  return statusMap[status.toLowerCase()] || {
    text: status,
    color: 'text-gray-600 dark:text-gray-400',
    icon: '❓',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
  };
};

/**
 * Format programming language
 */
export const formatLanguage = (language) => {
  if (!language) return 'Unknown';
  
  const languageMap = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    typescript: 'TypeScript',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
  };

  return languageMap[language.toLowerCase()] || language;
};

/**
 * Format contest type
 */
export const formatContestType = (type) => {
  if (!type) return 'Regular';
  
  const typeMap = {
    weekly: 'Weekly Contest',
    biweekly: 'Biweekly Contest',
    monthly: 'Monthly Contest',
    special: 'Special Contest',
    rated: 'Rated Contest',
    unrated: 'Unrated Contest',
  };

  return typeMap[type.toLowerCase()] || type;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format social number (e.g., 1.2K, 3.5M)
 */
export const formatSocialNumber = (num) => {
  if (!num && num !== 0) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
};