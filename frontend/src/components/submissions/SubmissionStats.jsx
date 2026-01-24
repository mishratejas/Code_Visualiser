import React from 'react';
import { BsCheckCircleFill, BsXCircleFill, BsLightning, BsClock, BsCodeSquare } from 'react-icons/bs';
import { FiTrendingUp, FiPieChart, FiBarChart2, FiActivity } from 'react-icons/fi';
import { RiProgress5Line } from 'react-icons/ri';

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
  const averageRuntime = stats.total > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (s.executionTime || 0), 0) / stats.total)
    : 0;

  const statCards = [
    {
      title: 'Total Submissions',
      value: stats.total,
      icon: <BsCodeSquare className="h-8 w-8 text-purple-500" />,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10',
      trend: '+12%',
      description: 'All-time submissions'
    },
    {
      title: 'Accepted',
      value: stats.accepted,
      icon: <BsCheckCircleFill className="h-8 w-8 text-green-500" />,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/10',
      trend: '+8%',
      description: 'Successfully solved'
    },
    {
      title: 'Acceptance Rate',
      value: `${acceptanceRate}%`,
      icon: <FiTrendingUp className="h-8 w-8 text-blue-500" />,
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-900/10',
      trend: acceptanceRate >= 70 ? 'Excellent' : acceptanceRate >= 40 ? 'Good' : 'Needs Work',
      description: 'Overall success rate'
    },
    {
      title: 'Avg Runtime',
      value: `${averageRuntime}ms`,
      icon: <BsLightning className="h-8 w-8 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-600',
      bg: 'bg-gradient-to-br from-yellow-50 to-orange-100/50 dark:from-yellow-900/20 dark:to-orange-900/10',
      trend: 'Fast',
      description: 'Average execution time'
    },
  ];

  const errorStats = [
    { label: 'Wrong Answers', value: stats.wrongAnswer, color: 'bg-red-500', percentage: stats.total > 0 ? (stats.wrongAnswer / stats.total * 100).toFixed(1) : 0 },
    { label: 'Time Limit', value: stats.timeLimitExceeded, color: 'bg-yellow-500', percentage: stats.total > 0 ? (stats.timeLimitExceeded / stats.total * 100).toFixed(1) : 0 },
    { label: 'Runtime Error', value: stats.runtimeError, color: 'bg-orange-500', percentage: stats.total > 0 ? (stats.runtimeError / stats.total * 100).toFixed(1) : 0 },
    { label: 'Compilation', value: stats.compilationError, color: 'bg-red-400', percentage: stats.total > 0 ? (stats.compilationError / stats.total * 100).toFixed(1) : 0 },
    { label: 'Pending', value: stats.pending, color: 'bg-blue-500', percentage: stats.total > 0 ? (stats.pending / stats.total * 100).toFixed(1) : 0 },
  ];

  const languageStats = {
    javascript: Math.floor(Math.random() * 40) + 30,
    python: Math.floor(Math.random() * 40) + 25,
    java: Math.floor(Math.random() * 30) + 15,
    cpp: Math.floor(Math.random() * 20) + 10,
    c: Math.floor(Math.random() * 10) + 5,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Analytics</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your coding journey with detailed statistics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">
            Last 30 days
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium">
            Export Data
          </button>
        </div>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                {stat.icon}
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                stat.trend.includes('+') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                stat.trend.includes('-') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {stat.trend}
              </span>
            </div>
            
            <div className="mb-2">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </div>
            
            <div className="mt-4 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.color}`}
                style={{ width: `${Math.min(100, (parseFloat(stat.value) / (index === 0 ? 100 : statCards[0].value)) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Breakdown */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <FiPieChart className="mr-3 text-purple-500" />
              Error Breakdown
            </h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.total} total submissions
            </span>
          </div>
          
          <div className="space-y-5">
            {errorStats.map((error, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${error.color} mr-3`}></div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {error.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {error.value}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {error.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${error.color}`}
                    style={{ width: `${error.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
            <FiBarChart2 className="mr-3 text-blue-500" />
            Language Usage
          </h4>
          
          <div className="space-y-4">
            {Object.entries(languageStats).map(([lang, percentage]) => (
              <div key={lang} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {lang}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Most Used</div>
                <div className="font-bold text-gray-900 dark:text-white">JavaScript</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
                <div className="font-bold text-green-600 dark:text-green-400">72%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 p-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
          <FiActivity className="mr-3 text-green-500" />
          Performance Metrics
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              {acceptanceRate}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            <div className="mt-2">
              <RiProgress5Line className="h-8 w-8 mx-auto text-green-500" />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              {averageRuntime}ms
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Runtime</div>
            <div className="mt-2">
              <BsLightning className="h-8 w-8 mx-auto text-yellow-500" />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              {stats.accepted}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Problems Solved</div>
            <div className="mt-2">
              <BsCheckCircleFill className="h-8 w-8 mx-auto text-green-500" />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              {Math.floor(Math.random() * 30) + 1}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
            <div className="mt-2">
              <BsClock className="h-8 w-8 mx-auto text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionStats;