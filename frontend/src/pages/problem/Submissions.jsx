import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { FiFilter, FiChevronDown, FiChevronUp, FiCode, FiClock, FiCpu, FiX, FiCopy, FiEye } from 'react-icons/fi';
import { BsCheckCircleFill, BsXCircleFill, BsClock } from 'react-icons/bs';
import { TbAlertCircle } from 'react-icons/tb';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

// ── Code Viewer Modal ─────────────────────────────────────────────────────────
const CodeModal = ({ submission, onClose }) => {
  if (!submission) return null;
  const copyCode = () => {
    navigator.clipboard.writeText(submission.code || '');
    toast.success('Code copied!');
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-semibold text-lg">
              {submission.problem?.title || 'Submission Code'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">{submission.language}</span>
              <span className={`text-xs font-medium ${
                (submission.verdict || submission.status) === 'accepted' ? 'text-green-400' : 'text-red-400'
              }`}>
                {(submission.verdict || submission.status || '').replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(submission.submittedAt || submission.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
            >
              <FiCopy size={14} /> Copy
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
        {/* Code */}
        <div className="flex-1 overflow-auto p-5">
          {submission.code ? (
            <pre className="text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {submission.code}
            </pre>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FiCode size={40} className="mx-auto mb-3 opacity-40" />
              <p>Code not available for this submission</p>
            </div>
          )}
        </div>
        {/* Stats Footer */}
        <div className="flex items-center gap-6 px-5 py-3 bg-gray-800/60 border-t border-gray-700 text-xs text-gray-400">
          <span>Runtime: <span className="text-white">{submission.executionTime || submission.runtime || 0} ms</span></span>
          <span>Memory: <span className="text-white">{submission.memoryUsed || submission.memory || 0} KB</span></span>
          {submission.passedTestCases != null && (
            <span>Tests: <span className="text-white">{submission.passedTestCases}/{submission.totalTestCases}</span></span>
          )}
        </div>
      </div>
    </div>
  );
};

const Submissions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [problem, setProblem] = useState(searchParams.get('problem') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit] = useState(15);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const handleViewCode = useCallback(async (submission) => {
    // If code already loaded, just show it
    if (submission.code !== undefined) {
      setSelectedSubmission(submission);
      return;
    }
    try {
      setCodeLoading(true);
      const res = await api.get(`/submissions/${submission._id}`);
      // Axios interceptor unwraps response.data → res is ApiResponse:
      // { success, data: { submission: { code, ... } }, message }
      // So we need to unwrap one more level.
      const full = res?.data?.submission || res?.submission || res?.data || res;
      setSelectedSubmission({ ...submission, ...full });
    } catch {
      toast.error('Failed to load submission code');
    } finally {
      setCodeLoading(false);
    }
  }, []);

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

  // M5 fix — this used to be fetchSubmissions() called from a useEffect on
  // [page, status, language, problem, sortBy]. Replaced with useQuery: same
  // trigger (the query key includes every filter), but now results are
  // cached per filter combination, concurrent mounts/re-renders don't fire
  // duplicate requests, and navigating back to a previously-seen filter
  // combination is instant instead of a full re-fetch.
  const queryParams = {
    page,
    limit,
    status: status || undefined,
    language: language && language !== 'All' ? language : undefined,
    problem: problem || undefined,
    sort: sortBy,
  };

  const { data: queryData, isLoading: loading, isError } = useQuery({
    queryKey: ['submissions', queryParams],
    queryFn: async () => {
      const response = await api.get('/submissions', { params: queryParams });
      // FIXED: Handle different response structures
      const submissionsData = response.submissions ||
                             response.data?.submissions ||
                             response.data ||
                             [];
      const totalPagesData = response.totalPages ||
                            response.data?.totalPages ||
                            1;
      return { submissions: submissionsData, totalPages: totalPagesData };
    },
    // v5's replacement for keepPreviousData: true — keeps the previous
    // page's list on screen while the next page loads instead of flashing
    // an empty state, then swaps once the new data arrives.
    placeholderData: (previousData) => previousData,
  });

  const submissions = queryData?.submissions || [];
  const totalPages = queryData?.totalPages || 1;

  // useQuery (v5) no longer has an onError callback — surface fetch
  // failures as a toast the same way the old catch block did.
  useEffect(() => {
    if (isError) toast.error('Failed to fetch submissions');
  }, [isError]);

  // URL param syncing is a separate concern from the actual data fetch —
  // keeps the URL reflecting current filters without coupling it to the
  // query lifecycle.
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (status) newParams.set('status', status);
    if (language && language !== 'All') newParams.set('language', language);
    if (problem) newParams.set('problem', problem);
    if (sortBy) newParams.set('sort', sortBy);
    if (page > 1) newParams.set('page', page.toString());
    setSearchParams(newParams);
  }, [status, language, problem, sortBy, page, setSearchParams]);

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
const getVerdictInfo = (verdictValue) => {
  const normalizedVerdict = (verdictValue || '').toLowerCase().replace(/ /g, '_');
  const verdictConfig = statusOptions.find(v => v.value === normalizedVerdict);
  
  if (!verdictConfig) {
    return {
      label: verdictValue || 'Unknown',
      icon: TbAlertCircle,
      color: 'text-gray-500'
    };
  }
  
  return verdictConfig;
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
      {/* Code viewer modal */}
      {selectedSubmission && (
        <CodeModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
      )}
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
            {submissions.map((submission) => {
  // Get verdict info
  const verdict = submission.verdict || submission.status;
  const verdictInfo = getVerdictInfo(verdict);
  const Icon = verdictInfo.icon;
  
  return (
    <div
      key={submission._id}
      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer"
      onClick={() => handleViewCode(submission)}
      title="Click to view code"
    >
      <div className="col-span-2 flex items-center">
        <Icon className={`${verdictInfo.color} mr-2`} />
        <span className={`text-sm font-medium ${verdictInfo.color}`}>
          {verdictInfo.label}
        </span>
      </div>
      <div className="col-span-4">
        <Link
          to={`/problem/${submission.problem?._id || '#'}`}
          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          {submission.problem?.title || 'Unknown Problem'}
        </Link>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date(submission.submittedAt || submission.createdAt || Date.now()).toLocaleString()}
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center">
          <FiCode className="mr-2 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {submission.language || 'Unknown'}
          </span>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center">
          <FiCpu className="mr-2 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {submission.executionTime || submission.runtime || 0} ms
          </span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2">
            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          </div>
          <span className="text-gray-700 dark:text-gray-300">
            {formatBytes(submission.memoryUsed || submission.memory || 0)}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); handleViewCode(submission); }}
          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
          title="View Code"
        >
          <FiEye size={15} />
        </button>
      </div>
    </div>
  );
})}
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
                {submissions.filter(s => (s.verdict ||s.status) === 'accepted').length}
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
                {submissions.filter(s => (s.verdict ||s.status) === 'wrong_answer').length}
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
                {submissions.filter(s => (s.verdict ||s.status) === 'time_limit_exceeded').length}
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