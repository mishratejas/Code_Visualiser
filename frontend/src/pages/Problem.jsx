import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiBarChart2, FiTag, FiCode } from 'react-icons/fi';
import { BiLike, BiDislike } from 'react-icons/bi';
import { MdOutlineDescription, MdOutlineSubtitles } from 'react-icons/md';
import { TbCodeDots } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import CodeEditor from '../components/editor/CodeEditor';
import Loader from '../components/common/Loader';
import api from '../services/api';

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [userSolution, setUserSolution] = useState('');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchProblem();
    fetchSubmissions();
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/problems/${id}`);
      setProblem(response.data);
    } catch (error) {
      toast.error('Failed to load problem');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get(`/submissions?problem=${id}&limit=5`);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch submissions');
    }
  };

  const handleCodeChange = (code) => {
    setUserSolution(code);
  };

  const handleSubmit = async (submissionData) => {
    try {
      const response = await api.post('/submissions', submissionData);
      toast.success('Solution submitted successfully!');
      navigate(`/submissions/${response.data._id}`);
    } catch (error) {
      toast.error('Failed to submit solution');
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Problem not found</h2>
        <Link to="/problems" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
          Go back to problems
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Problem Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/problems"
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <FiArrowLeft className="mr-2" /> Back to Problems
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {problem.title}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${problem.difficulty === 'easy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : problem.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to={`/submit/${id}`}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            Submit Solution
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'description', label: 'Description', icon: MdOutlineDescription },
                { id: 'editorial', label: 'Editorial', icon: TbCodeDots },
                { id: 'solutions', label: 'Solutions', icon: FiCode },
                { id: 'submissions', label: 'Submissions', icon: MdOutlineSubtitles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                  <tab.icon className="mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="prose dark:prose-invert max-w-none">
            {activeTab === 'description' && (
              <div>
                <ReactMarkdown>{problem.description}</ReactMarkdown>
                
                {/* Example Test Cases */}
                {problem.testCases && problem.testCases.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Example Test Cases</h3>
                    {problem.testCases.slice(0, 2).map((testCase, index) => (
                      <div key={index} className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Input</h4>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded">
                              {testCase.input}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Output</h4>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded">
                              {testCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                        {testCase.explanation && (
                          <p className="mt-3 text-gray-600 dark:text-gray-400">
                            <strong>Explanation:</strong> {testCase.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Constraints</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'editorial' && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Editorial</h3>
                <ReactMarkdown>{problem.editorial || 'Editorial coming soon...'}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'solutions' && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Solutions</h3>
                <p className="text-gray-600 dark:text-gray-400">Solutions will be available after contest ends.</p>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Recent Submissions</h3>
                {submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${submission.status === 'accepted'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : submission.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                {submission.status}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Language: {submission.language}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Submitted {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {submission.executionTime} ms
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Execution Time</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No submissions yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Problem Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiClock className="mr-2" />
                  <span>Time Limit</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{problem.timeLimit} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiBarChart2 className="mr-2" />
                  <span>Memory Limit</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{problem.memoryLimit} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiTag className="mr-2" />
                  <span>Acceptance Rate</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{problem.acceptanceRate}%</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                <span className="font-bold text-gray-900 dark:text-white">{problem.totalSubmissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Accepted</span>
                <span className="font-bold text-green-600 dark:text-green-400">{problem.acceptedSubmissions}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('editorial')}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-left"
              >
                View Editorial
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-left"
              >
                View Solutions
              </button>
              <Link
                to={`/submit/${id}`}
                className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:opacity-90 transition text-center"
              >
                Submit Solution
              </Link>
            </div>
          </div>

          {/* Like/Dislike */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                <BiLike size={24} />
                <span>{problem.likes || 0}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                <BiDislike size={24} />
                <span>{problem.dislikes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Editor (Optional) */}
      {window.innerWidth > 1024 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Try It Out</h3>
          <div className="h-64">
            <CodeEditor
              problemId={id}
              onCodeChange={handleCodeChange}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Problem;