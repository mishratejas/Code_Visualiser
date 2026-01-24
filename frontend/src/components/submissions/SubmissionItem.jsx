import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiCpu, FiClock, FiExternalLink } from 'react-icons/fi';
import { BsCheckCircleFill, BsXCircleFill, BsClock, BsLightning } from 'react-icons/bs';
import { VscError } from 'react-icons/vsc';
import { formatBytes, formatDate } from '../../utils/helpers';

const SubmissionItem = ({ submission }) => {
  const getStatusConfig = (verdict) => {
    const normalizedStatus=verdict?.toLowerCase().replace(/-/g, '_');
    
    const configs = {
      accepted: {
        icon: <BsCheckCircleFill className="text-green-500 text-xl" />,
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10',
        border: 'border-green-200/50 dark:border-green-800/30',
        text: 'text-green-700 dark:text-green-300',
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        glow: 'shadow-lg shadow-green-500/10 dark:shadow-green-500/5'
      },
      wrong_answer: {
        icon: <BsXCircleFill className="text-red-500 text-xl" />,
        bg: 'bg-gradient-to-r from-red-50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/10',
        border: 'border-red-200/50 dark:border-red-800/30',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        glow: 'shadow-lg shadow-red-500/10 dark:shadow-red-500/5'
      },
      time_limit_exceeded: {
        icon: <FiClock className="text-yellow-500 text-xl" />,
        bg: 'bg-gradient-to-r from-yellow-50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/10',
        border: 'border-yellow-200/50 dark:border-yellow-800/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        glow: 'shadow-lg shadow-yellow-500/10 dark:shadow-yellow-500/5'
      },
      runtime_error: {
        icon: <VscError className="text-red-500 text-xl" />,
        bg: 'bg-gradient-to-r from-red-50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/10',
        border: 'border-red-200/50 dark:border-red-800/30',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        glow: 'shadow-lg shadow-red-500/10 dark:shadow-red-500/5'
      },
      compilation_error: {
        icon: <BsXCircleFill className="text-red-500 text-xl" />,
        bg: 'bg-gradient-to-r from-red-50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/10',
        border: 'border-red-200/50 dark:border-red-800/30',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        glow: 'shadow-lg shadow-red-500/10 dark:shadow-red-500/5'
      },
      pending: {
        icon: <BsClock className="text-blue-500 text-xl" />,
        bg: 'bg-gradient-to-r from-blue-50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/10',
        border: 'border-blue-200/50 dark:border-blue-800/30',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        glow: 'shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5'
      }
    };
    
    return configs[status] || {
      icon: null,
      bg: 'bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900',
      border: 'border-gray-200/50 dark:border-gray-700/30',
      text: 'text-gray-700 dark:text-gray-300',
      badge: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
      glow: ''
    };
  };

  const formatStatusText = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const statusConfig = getStatusConfig(submission.verdict || submission.status);

  return (
    <div className={`group ${statusConfig.bg} rounded-2xl border ${statusConfig.border} p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${statusConfig.glow}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            {statusConfig.icon}
          </div>
          <div>
            <div className={`font-bold text-lg ${statusConfig.text}`}>
              {formatStatusText(submission.verdict ||submission.status)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
              <BsClock className="mr-1.5" size={14} />
              {formatDate(submission.submittedAt, 'MMM dd, yyyy • hh:mm a')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {submission.executionTime > 0 && (
            <div className="flex items-center px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg">
              <BsLightning className="mr-2 text-yellow-500" />
              <span className="text-sm font-medium">{submission.executionTime}ms</span>
            </div>
          )}
          <Link
            to={`/submissions/${submission._id}`}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all group-hover:scale-105"
          >
            <span className="mr-2">View Details</span>
            <FiExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Problem Link */}
      <Link
        to={`/problem/${submission.problem?._id}`}
        className="block mb-6 group/problem"
      >
        <div className="text-xl font-bold text-gray-900 dark:text-white group-hover/problem:text-blue-600 dark:group-hover/problem:text-blue-400 transition-colors mb-2">
          {submission.problem?.title}
        </div>
        {submission.problem?.difficulty && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium">
            Difficulty: <span className={`ml-1.5 font-bold ${submission.problem.difficulty === 'easy' ? 'text-green-600' : submission.problem.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
              {submission.problem.difficulty}
            </span>
          </div>
        )}
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
              <FiCode className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Language</div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {submission.language}
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 mr-3">
              <BsLightning className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Runtime</div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {submission.executionTime} ms
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 mr-3">
              <FiCpu className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory</div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatBytes(submission.memoryUsed)}
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 mr-3">
              <FiClock className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Test Cases</div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {submission.passedTestCases || 0}/{submission.totalTestCases || 0}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-gray-200/50 dark:border-gray-700/30">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Submission ID: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
            {submission._id?.slice(-8).toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            to={`/submit/${submission.problem?._id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center hover:underline"
          >
            Solve Again
          </Link>
          <Link
            to={`/submissions/${submission._id}`}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-300 rounded-xl font-medium hover:shadow-md transition-all hover:scale-105"
          >
            <span>Full Report</span>
            <FiExternalLink className="ml-2" size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubmissionItem;