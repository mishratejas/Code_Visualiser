import React from 'react';

const Loader = ({ size = 'medium', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-14 w-14',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
        <div className="relative">
          <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-800 border-t-rose-600`} />
        </div>
        {text && <p className="mt-6 text-gray-400 text-lg font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 dark:border-gray-700 border-t-rose-600 dark:border-t-rose-500`} />
      </div>
      {text && <p className="mt-6 text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export default Loader;