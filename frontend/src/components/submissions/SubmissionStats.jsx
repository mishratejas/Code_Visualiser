import React from 'react';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import { FiClock, FiCode } from 'react-icons/fi';

const SubmissionStats = ({ submissions }) => {
  const stats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'accepted').length,
    wrongAnswer: submissions.filter(s => s.status === 'wrong_answer').length,
    timeLimitExceeded: submissions.filter(s => s.status === 'time_limit_exceeded').length,
    runtimeError: submissions.filter(s => s.status === 'runtime_error').length,
    compilationError: submissions.filter(s => s.status === 'compilation_error').length,
    pending: submissions.filter(s => s.status === 'pending').length,
  };

  const acceptanceRate = stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(1) : 0;

  const statCards = [
    {
      title: 'Total Submissions',
      value: stats.total,
      icon: <FiCode className="h-8 w-8 text-purple-500" />,
      color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Accepted',
      value: stats.accepted,
      icon: <BsCheckCircleFill className="h-8 w-8 text-green-500" />,
      color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Acceptance Rate',
      value: `${acceptanceRate}%`,
      icon: <FiClock className="h-8 w-8 text-blue-500" />,
      color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Wrong Answers',
      value: stats.wrongAnswer,
      icon: <BsXCircleFill className="h-8 w-8 text-red-500" />,
      color: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Submission Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.title}
                </div>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Time Limit Exceeded</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats.timeLimitExceeded}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Runtime Error</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats.runtimeError}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Compilation Error</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats.compilationError}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Pending</span>
            <span className="font-medium text-gray-900 dark:text-white">{stats.pending}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionStats;