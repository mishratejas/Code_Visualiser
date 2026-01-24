import React from 'react';
import { FiPlay, FiTerminal, FiSettings, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const EditorToolbar = ({
  isRunning = false,
  isFullscreen = false,
  onRun = () => {},
  onFullscreenToggle = () => {},
  onSettingsClick = () => {},
  language = 'javascript',
  executionTime = 0,
  memoryUsed = 0,
  status = 'idle'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-500 animate-pulse';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Running...';
      case 'success': return 'Success';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 dark:bg-gray-800 border-b border-gray-800 dark:border-gray-700">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition ${isRunning
              ? 'bg-blue-600 text-white cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isRunning ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Running
            </>
          ) : (
            <>
              <FiPlay className="mr-2" />
              Run Code
            </>
          )}
        </button>

        {/* Submit Button */}
        <button
          className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-sm font-medium transition"
        >
          <BsLightningFill className="mr-2" />
          Submit
        </button>
      </div>

      {/* Middle Section - Status */}
      <div className="flex items-center space-x-6">
        {/* Status Indicator */}
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor().replace('text-', 'bg-')}`}></div>
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Language Badge */}
        <div className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-gray-300 text-xs rounded">
          {language.toUpperCase()}
        </div>

        {/* Performance Stats */}
        {executionTime > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-gray-400">
              <FiTerminal className="mr-1" />
              <span>{executionTime}ms</span>
            </div>
            <div className="flex items-center text-gray-400">
              <div className="w-1 h-1 rounded-full bg-gray-400 mr-1"></div>
              <span>{memoryUsed}MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center space-x-2">
        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition"
          title="Editor Settings"
        >
          <FiSettings size={16} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onFullscreenToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;