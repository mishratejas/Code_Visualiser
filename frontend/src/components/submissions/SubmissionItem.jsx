import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiCpu, FiClock } from 'react-icons/fi';
import { BsCheckCircleFill, BsXCircleFill, BsClock } from 'react-icons/bs';

const SubmissionItem = ({ submission }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <BsCheckCircleFill className="text-green-500" />;
      case 'wrong_answer':
        return <BsXCircleFill className="text-red-500" />;
      case 'time_limit_exceeded':
        return <FiClock className="text-yellow-500" />;
      case 'runtime_error':
      case 'compilation_error':
        return <BsXCircleFill className="text-red-500" />;
      case 'pending':
        return <BsClock className="text-blue-500" />;
      default:
        return null;
    }
  };

  const formatStatusText = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon(submission.status)}
          <span className={`font-medium ${submission.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
            {formatStatusText(submission.status)}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(submission.submittedAt).toLocaleString()}
        </span>
      </div>

      <Link
        to={`/problem/${submission.problem?._id}`}
        className="block text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 mb-2"
      >
        {submission.problem?.title}
      </Link>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <FiCode className="text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">{submission.language}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FiCpu className="text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">{submission.executionTime} ms</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span className="text-gray-700 dark:text-gray-300">{formatBytes(submission.memoryUsed)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/submissions/${submission._id}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default SubmissionItem;