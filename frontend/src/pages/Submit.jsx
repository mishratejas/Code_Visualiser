import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCode, FiPlay, FiSave, FiCopy, FiAlertCircle, FiCheck, FiClock } from 'react-icons/fi';
import { BsLightning, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { problemService } from '../services/problems';
import submissionService from '../services/submissions';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CodeEditor from '../components/editor/CodeEditor';
import { formatExecutionTime, formatMemory } from '../utils/formatters';
import { LANGUAGE_CONFIG } from '../utils/constants';

const Submit = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [runningCustomTest, setRunningCustomTest] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [codeStatus, setCodeStatus] = useState('idle');

  useEffect(() => {
    fetchProblemDetails();
    fetchSubmissionHistory();
  }, [problemId]);

  const fetchProblemDetails = async () => {
    try {
      setLoading(true);
      const response = await problemService.getProblemById(problemId);
      setProblem(response.data || response);
      
      // Load saved code or default template
      const savedCode = localStorage.getItem(`code_${problemId}_${language}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
        const defaultCode = submissionService.getDefaultCodeTemplate(
          response.data?.title || 'Solution',
          language
        );
        setCode(defaultCode);
      }
    } catch (error) {
      toast.error('Failed to load problem details');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const response = await submissionService.getProblemSubmissions(problemId, { limit: 5 });
      setSubmissionHistory(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch submission history:', error);
      setSubmissionHistory([]);
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // Auto-save to localStorage
    localStorage.setItem(`code_${problemId}_${language}`, newCode);
    setCodeStatus('modified');
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Load saved code for new language or default
    const savedCode = localStorage.getItem(`code_${problemId}_${newLanguage}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      const defaultCode = submissionService.getDefaultCodeTemplate(
        problem?.title || 'Solution',
        newLanguage
      );
      setCode(defaultCode);
    }
  };

  const handleRunCustomTest = async () => {
    if (!customInput.trim()) {
      toast.error('Please provide input');
      return;
    }

    setRunningCustomTest(true);
    setCodeStatus('running');
    try {
      const response = await submissionService.runCode({
        code,
        language,
        input: customInput,
        problemId,
      });
      
      if (response.success) {
        setCustomOutput(response.data?.output || 'No output');
        setCodeStatus('success');
        toast.success('Test executed successfully!');
      } else {
        setCustomOutput(`Error: ${response.message}`);
        setCodeStatus('error');
        toast.error('Test execution failed');
      }
    } catch (error) {
      setCustomOutput(`Error: ${error.message}`);
      setCodeStatus('error');
      toast.error('Test execution failed');
    } finally {
      setRunningCustomTest(false);
    }
  };

  const handleRunAllTests = async () => {
    // Validate code first
    const validation = submissionService.validateCode(code, language);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setRunningTests(true);
    setCodeStatus('running');
    try {
      const response = await submissionService.runTestCases(problemId, code, language);
      
      if (response.success) {
        setTestResults(response.data || []);
        setShowTestModal(true);
        setCodeStatus('success');
        
        // Show summary
        const passed = (response.data || []).filter(r => r.passed).length;
        const total = (response.data || []).length;
        toast.success(`${passed}/${total} test cases passed!`);
      } else {
        toast.error(response.message || 'Failed to run tests');
        setCodeStatus('error');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to run tests');
      setCodeStatus('error');
    } finally {
      setRunningTests(false);
    }
  };

  const handleSubmit = async () => {
    // Validate code first
    const validation = submissionService.validateCode(code, language);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSubmitting(true);
    setCodeStatus('running');
    try {
      const submission = {
        problemId,
        code,
        language,
      };

      const response = await submissionService.submitSolution(submission);
      
      if (response.success) {
        toast.success('Solution submitted successfully!');
        
        // Navigate to submission details
        if (response.data?._id) {
          navigate(`/submissions/${response.data._id}`);
        } else {
          navigate('/submissions');
        }
      } else {
        toast.error(response.message || 'Submission failed');
        setCodeStatus('error');
      }
    } catch (error) {
      toast.error(error.message || 'Submission failed');
      setCodeStatus('error');
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
    setCodeStatus('saved');
    toast.success('Code saved locally');
  };

  const resetCode = () => {
    const defaultCode = submissionService.getDefaultCodeTemplate(
      problem?.title || 'Solution',
      language
    );
    setCode(defaultCode);
    localStorage.removeItem(`code_${problemId}_${language}`);
    setCodeStatus('reset');
    toast.success('Code reset to default');
  };

  const languages = Object.entries(LANGUAGE_CONFIG).map(([value, config]) => ({
    value,
    label: config.name,
  }));

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
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              ← Back to Problem
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400">Submit Solution</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {problem?.title || 'Submit Solution'}
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
                
                {problem?.constraints && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time Limit
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {problem.constraints.timeLimit || 2000} ms
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Memory Limit
                      </label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {problem.constraints.memoryLimit || 256} MB
                        </span>
                      </div>
                    </div>
                  </>
                )}
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
                onLanguageChange={handleLanguageChange}
              />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    codeStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                    codeStatus === 'success' ? 'bg-green-500' :
                    codeStatus === 'error' ? 'bg-red-500' :
                    codeStatus === 'saved' ? 'bg-green-500' :
                    codeStatus === 'reset' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {codeStatus === 'idle' ? 'Ready' : codeStatus}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {code.length} chars • {code.split('\n').length} lines
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={handleRunAllTests}
                loading={runningTests}
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
                <span className={`font-medium ${
                  problem?.difficulty === 'easy' ? 'text-green-600 dark:text-green-400' :
                  problem?.difficulty === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {problem?.difficulty || 'Medium'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Acceptance Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {problem?.acceptanceRate?.toFixed(1) || problem?.metadata?.acceptanceRate?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Submissions</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {problem?.totalSubmissions || problem?.metadata?.submissions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Accepted</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {problem?.acceptedSubmissions || 0}
                </span>
              </div>
            </div>
            
            {problem?.tags && problem.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Recent Submissions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Submissions
            </h3>
            {submissionHistory.length > 0 ? (
              <div className="space-y-3">
                {submissionHistory.slice(0, 5).map((submission) => (
                  <div
                    key={submission._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${
                        submission.status === 'accepted' ? 'text-green-600 dark:text-green-400' :
                        submission.status === 'pending' ? 'text-blue-600 dark:text-blue-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {submission.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatExecutionTime(submission.executionTime)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Language: {submission.language}</span>
                      <span>{formatMemory(submission.memoryUsed)}</span>
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
          {testResults.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {testResults.map((test, index) => (
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
                    <BsCheckCircle className="inline ml-2" />
                  ) : (
                    <BsXCircle className="inline ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected Test Case Details */}
          {testResults.length > 0 && testResults[selectedTestCase] && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Input</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {testResults[selectedTestCase].input || 'No input'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Expected Output</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {testResults[selectedTestCase].expectedOutput || 'No expected output'}
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
                    {formatExecutionTime(testResults[selectedTestCase].executionTime || 0)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatMemory(testResults[selectedTestCase].memoryUsed || 0)}
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