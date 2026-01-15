import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCode, FiPlay, FiSave, FiCopy, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { BsLightning } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import CodeEditor from '../components/editor/CodeEditor';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatExecutionTime, formatMemory } from '../utils/formatters';

const Submit = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [runningCustomTest, setRunningCustomTest] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);

  useEffect(() => {
    fetchProblemDetails();
    fetchSubmissionHistory();
  }, [problemId]);

  const fetchProblemDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/problems/${problemId}`);
      setProblem(response.data);
      
      // Load saved code
      const savedCode = localStorage.getItem(`code_${problemId}_${language}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
        // Load default code based on language
        setCode(getDefaultCode(language));
      }
    } catch (error) {
      toast.error('Failed to load problem');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const response = await api.get(`/submissions?problem=${problemId}&limit=5`);
      setSubmissionHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch submission history');
    }
  };

  const getDefaultCode = (lang) => {
    const defaults = {
      javascript: `function solve(input) {
    // Write your solution here
    return input;
}`,
      python: `def solve(input):
    # Write your solution here
    return input`,
      java: `public class Solution {
    public Object solve(Object input) {
        // Write your solution here
        return input;
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& input) {
        // Write your solution here
        return input;
    }
};`,
      c: `#include <stdio.h>
#include <stdlib.h>

int* solve(int* input, int inputSize, int* returnSize) {
    // Write your solution here
    *returnSize = inputSize;
    return input;
}`,
    };
    return defaults[lang] || defaults.javascript;
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // Auto-save
    localStorage.setItem(`code_${problemId}_${language}`, newCode);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Load saved code for new language or default
    const savedCode = localStorage.getItem(`code_${problemId}_${newLanguage}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(getDefaultCode(newLanguage));
    }
  };

  const handleRunCustomTest = async () => {
    if (!customInput.trim()) {
      toast.error('Please provide input');
      return;
    }

    setRunningCustomTest(true);
    try {
      const response = await api.post('/problems/run', {
        code,
        language,
        input: customInput,
        problemId,
      });
      
      setCustomOutput(response.output || 'No output');
      toast.success('Test executed successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to run test';
      setCustomOutput(`Error: ${message}`);
      toast.error('Test execution failed');
    } finally {
      setRunningCustomTest(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/problems/run-tests', {
        code,
        language,
        problemId,
      });
      
      setTestResults(response);
      setShowTestModal(true);
      toast.success('Tests completed!');
    } catch (error) {
      toast.error('Failed to run tests');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setSubmitting(true);
    try {
      const submission = {
        problemId,
        code,
        language,
      };

      const response = await api.post('/submissions', submission);
      
      toast.success('Solution submitted successfully!');
      navigate(`/submissions/${response._id}`);
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const saveCode = () => {
    localStorage.setItem(`code_${problemId}_${language}`, code);
    toast.success('Code saved locally');
  };

  const resetCode = () => {
    setCode(getDefaultCode(language));
    localStorage.removeItem(`code_${problemId}_${language}`);
    toast.success('Code reset to default');
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to={`/problem/${problemId}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              &larr; Back to Problem
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400">Submit Solution</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {problem.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Write your solution and submit for evaluation
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowTestModal(true)}
            startIcon={<FiPlay />}
          >
            Test Results
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            startIcon={<BsLightning />}
          >
            Submit Solution
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Limit
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {problem.timeLimit} ms
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Memory Limit
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {problem.memoryLimit} MB
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={copyCode}
                  startIcon={<FiCopy />}
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={saveCode}
                  startIcon={<FiSave />}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={resetCode}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="h-[500px] mb-6">
              <CodeEditor
                problemId={problemId}
                initialCode={code}
                onCodeChange={handleCodeChange}
                onSubmit={handleSubmit}
                language={language}
                onLanguageChange={setLanguage}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleRunAllTests}
                loading={submitting}
                variant="secondary"
                startIcon={<FiPlay />}
              >
                Run All Tests
              </Button>
              <Button
                onClick={() => setShowTestModal(true)}
                variant="outline"
                startIcon={<FiAlertCircle />}
              >
                Custom Test
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                className="ml-auto"
                startIcon={<BsLightning />}
              >
                Submit Solution
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Problem Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Problem Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulty</span>
                <span className={`font-medium ${problem.difficulty === 'easy'
                    ? 'text-green-600 dark:text-green-400'
                    : problem.difficulty === 'medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Acceptance Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {problem.acceptanceRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {problem.totalSubmissions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Accepted</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {problem.acceptedSubmissions}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Tags
              </h4>
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
          </Card>

          {/* Recent Submissions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Submissions
            </h3>
            {submissionHistory.length > 0 ? (
              <div className="space-y-3">
                {submissionHistory.map((submission) => (
                  <div
                    key={submission._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${submission.status === 'accepted'
                          ? 'text-green-600 dark:text-green-400'
                          : submission.status === 'pending'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {submission.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatExecutionTime(submission.executionTime)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Language: {submission.language}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No submissions yet
              </p>
            )}
          </Card>

          {/* Quick Tips */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tips for Success
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <FiCheck className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Test your solution with sample cases first</span>
              </li>
              <li className="flex items-start">
                <FiCheck className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Consider edge cases and boundary conditions</span>
              </li>
              <li className="flex items-start">
                <FiCheck className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Optimize for time and memory complexity</span>
              </li>
              <li className="flex items-start">
                <FiCheck className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Check for off-by-one errors</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Test Results Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Test Results"
        size="xlarge"
      >
        <div className="space-y-6">
          {/* Test Cases Navigation */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {testResults?.map((test, index) => (
              <button
                key={index}
                onClick={() => setSelectedTestCase(index)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedTestCase === index
                    ? test.passed
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                Test {index + 1}
                {test.passed ? (
                  <FiCheck className="inline ml-2" />
                ) : (
                  <FiAlertCircle className="inline ml-2" />
                )}
              </button>
            ))}
          </div>

          {/* Selected Test Case Details */}
          {testResults && testResults[selectedTestCase] && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Input</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {testResults[selectedTestCase].input}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Expected Output</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {testResults[selectedTestCase].expectedOutput}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Output</h4>
                <pre className={`p-4 rounded-lg overflow-x-auto text-sm ${testResults[selectedTestCase].passed
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                  {testResults[selectedTestCase].actualOutput || 'No output'}
                </pre>
              </div>

              {testResults[selectedTestCase].error && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Error</h4>
                  <pre className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg overflow-x-auto text-sm">
                    {testResults[selectedTestCase].error}
                  </pre>
                </div>
              )}

              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className={`font-medium ${testResults[selectedTestCase].passed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                    {testResults[selectedTestCase].passed ? 'Passed' : 'Failed'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatExecutionTime(testResults[selectedTestCase].executionTime)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatMemory(testResults[selectedTestCase].memoryUsed)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {testResults[selectedTestCase].score || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Test Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Custom Test</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input
                </label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  placeholder="Enter custom input..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output
                </label>
                <div className="bg-gray-800 text-gray-100 p-4 rounded-lg min-h-[100px]">
                  <pre className="whitespace-pre-wrap">{customOutput || 'Run test to see output...'}</pre>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleRunCustomTest}
                  loading={runningCustomTest}
                  variant="secondary"
                  startIcon={<FiPlay />}
                >
                  Run Custom Test
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowTestModal(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
          >
            Submit Solution
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Submit;