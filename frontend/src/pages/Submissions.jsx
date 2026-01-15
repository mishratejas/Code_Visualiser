import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiFilter, FiChevronDown, FiChevronUp, FiCode, FiClock, FiCpu } from 'react-icons/fi';
import { BsCheckCircleFill, BsXCircleFill, BsClock } from 'react-icons/bs';
import { TbAlertCircle } from 'react-icons/tb';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const Submissions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [problem, setProblem] = useState(searchParams.get('problem') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(15);

  const statusOptions = [
    { value: 'accepted', label: 'Accepted', icon: BsCheckCircleFill, color: 'text-green-500' },
    { value: 'wrong_answer', label: 'Wrong Answer', icon: BsXCircleFill, color: 'text-red-500' },
    { value: 'time_limit_exceeded', label: 'Time Limit Exceeded', icon: FiClock, color: 'text-yellow-500' },
    { value: 'runtime_error', label: 'Runtime Error', icon: TbAlertCircle, color: 'text-red-500' },
    { value: 'compilation_error', label: 'Compilation Error', icon: FiCode, color: 'text-gray-500' },
    { value: 'pending', label: 'Pending', icon: BsClock, color: 'text-blue-500' },
  ];

  const languageOptions = ['All', 'JavaScript', 'Python', 'Java', 'C++', 'C'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'execution_time', label: 'Fastest' },
    { value: 'memory', label: 'Low Memory' },
  ];

  useEffect(() => {
    fetchSubmissions();
  }, [page, status, language, problem, sortBy]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        status: status || undefined,
        language: language && language !== 'All' ? language : undefined,
        problem: problem || undefined,
        sort: sortBy,
      };

      const response = await api.get('/submissions', { params });
      setSubmissions(response.data.submissions);
      setTotalPages(response.data.totalPages);

      // Update URL params
      const newParams = new URLSearchParams();
      if (status) newParams.set('status', status);
      if (language && language !== 'All') newParams.set('language', language);
      if (problem) newParams.set('problem', problem);
      if (sortBy) newParams.set('sort', sortBy);
      if (page > 1) newParams.set('page', page.toString());

      setSearchParams(newParams);
    } catch (error) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatus('');
    setLanguage('');
    setProblem('');
    setSortBy('newest');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusIcon = (submission) => {
    const statusConfig = statusOptions.find(s => s.value === submission.status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return <Icon className={`${statusConfig.color} mr-2`} />;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && submissions.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Submissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your solution submissions and progress
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 self-start"
        >
          <FiFilter className="mr-2" />
          Filters
          {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                <option value="">All Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem
              </label>
              <input
                type="text"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Problem title or ID"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Reset all filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Status
          </div>
          <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            Problem
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Language
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Runtime
          </div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Memory
          </div>
        </div>

        {/* Submissions */}
        {submissions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                <div className="col-span-2 flex items-center">
                  {getStatusIcon(submission)}
                  <span className={`text-sm font-medium capitalize ${submission.status === 'accepted'
                      ? 'text-green-600 dark:text-green-400'
                      : submission.status === 'pending'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                    {submission.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="col-span-4">
                  <Link
                    to={`/problem/${submission.problem?._id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    {submission.problem?.title}
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <FiCode className="mr-2 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {submission.language}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <FiCpu className="mr-2 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {submission.executionTime} ms
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatBytes(submission.memoryUsed)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No submissions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start solving problems to see your submissions here
            </p>
            <Link
              to="/problems"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
            >
              Browse Problems
            </Link>
          </div>
        )}

        {/* Pagination */}
        {submissions.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded ${page === pageNum
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'accepted').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Accepted
              </div>
            </div>
            <BsCheckCircleFill className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'wrong_answer').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Wrong Answer
              </div>
            </div>
            <BsXCircleFill className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'time_limit_exceeded').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time Limit
              </div>
            </div>
            <FiClock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Submissions
              </div>
            </div>
            <FiCode className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submissions;