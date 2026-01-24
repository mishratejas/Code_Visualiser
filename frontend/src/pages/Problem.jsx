import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProblemById, runCode, submitSolution } from '../services/api';
import { 
  FiPlay, FiSend, FiCopy, FiCheck, FiX, FiAlertCircle, 
  FiChevronRight, FiClock, FiBarChart2, FiUsers, FiCode,
  FiEye, FiEyeOff, FiChevronDown, FiChevronUp, FiDownload
} from 'react-icons/fi';
import { BsCheckCircle, BsXCircle, BsClock, BsLightning } from 'react-icons/bs';
import { IoMdTime } from 'react-icons/io';
import { VscDebugStart, VscDebugStop } from 'react-icons/vsc';
import { toast } from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const VERDICT = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error'
};

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [activeTab, setActiveTab] = useState('statement');
  const [testResults, setTestResults] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [expandedTestCases, setExpandedTestCases] = useState([]);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [showCustomTest, setShowCustomTest] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef(null);
  const testCasesRef = useRef(null);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await getProblemById(id);
      
      if (response.success) {
        const problemData = response.data?.problem || response.data;
        console.log('Problem loaded:', problemData);
        
        setProblem(problemData);
        
        // Set default code based on language
        const defaultCode = getDefaultCode(problemData.title, language);
        setCode(defaultCode);
        
        // Expand first test case by default
        if (problemData.testCases && problemData.testCases.length > 0) {
          setExpandedTestCases([0]);
        }
      }
    } catch (err) {
      console.error('Error fetching problem:', err);
      toast.error('Failed to load problem');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCode = (title, lang) => {
    const templates = {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    \n    return 0;\n}`,
      
      python: `def solve():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
      
      java: `import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n\nclass Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
      
      javascript: `function solve() {\n    // Your code here\n}\n\nsolve();`
    };
    
    return templates[lang] || templates.cpp;
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleTestCase = (index) => {
    setExpandedTestCases(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const runCustomTest = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    try {
      const payload = {
        problemId: id,
        code,
        language,
        input: userInput || ''
      };

      const response = await runCode(payload);
      
      if (response.success) {
        const result = response.data;
        setCustomOutput(result.output || result.error || 'No output');
        
        if (result.verdict === VERDICT.ACCEPTED) {
          toast.success('Custom test passed!');
        } else if (result.error) {
          toast.error(`Error: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Run test error:', err);
      toast.error('Failed to run custom test');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    if (!user) {
      toast.error('Please login to submit your solution');
      navigate('/login', { state: { from: `/problem/${id}` } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitSolution({
        problemId: id,
        code,
        language
      });
      
      if (response.success) {
        toast.success('Solution submitted!');
        
        // Show submission results
        if (response.data?.submission) {
          const sub = response.data.submission;
          setTestResults([{
            verdict: sub.verdict,
            runtime: sub.runtime,
            testCasesPassed: sub.testCasesPassed,
            totalTestCases: sub.totalTestCases
          }]);
          
          if (sub.verdict === VERDICT.ACCEPTED) {
            toast.success(`🎉 Accepted! ${sub.testCasesPassed}/${sub.totalTestCases} tests passed`);
          } else {
            toast.error(`${sub.verdict}`);
          }
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getVerdictColor = (verdict) => {
    switch(verdict) {
      case VERDICT.ACCEPTED: return 'text-green-500 bg-green-500/10';
      case VERDICT.WRONG_ANSWER: return 'text-red-500 bg-red-500/10';
      case VERDICT.TIME_LIMIT_EXCEEDED: return 'text-yellow-500 bg-yellow-500/10';
      case VERDICT.RUNTIME_ERROR: return 'text-orange-500 bg-orange-500/10';
      case VERDICT.COMPILATION_ERROR: return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading || !problem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header - Codeforces Style */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/problems')}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Problems
              </button>
              <FiChevronRight className="text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {problem.title}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <IoMdTime className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {problem.constraints?.timeLimit || 2000}ms
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <BsLightning className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {problem.constraints?.memoryLimit || 256}MB
                  </span>
                </div>
                {problem.metadata?.acceptanceRate && (
                  <div className="flex items-center space-x-1">
                    <FiBarChart2 className="text-gray-500" />
                    <span className={`font-medium ${
                      problem.metadata.acceptanceRate >= 70 ? 'text-green-600' :
                      problem.metadata.acceptanceRate >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {problem.metadata.acceptanceRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Problem Statement */}
          <div className="space-y-6">
            {/* Problem Statement Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-gray-800 overflow-hidden">
              {/* Statement Tabs */}
              <div className="flex border-b dark:border-gray-800">
                {['statement', 'editorial', 'solutions', 'discuss'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Problem Content */}
              <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {activeTab === 'statement' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {problem.title}
                      </h2>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed"
                             dangerouslySetInnerHTML={{ __html: problem.description || 'No description available' }} />
                      </div>
                    </div>

                    {/* Input Specification */}
                    {problem.inputFormat && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Input
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">
                            {problem.inputFormat}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Output Specification */}
                    {problem.outputFormat && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Output
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">
                            {problem.outputFormat}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {(problem.sampleInput?.length > 0 || problem.testCases?.length > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Examples
                        </h3>
                        <div className="space-y-4">
                          {(problem.sampleInput || problem.testCases?.filter(tc => !tc.isHidden) || []).map((tc, index) => (
                            <div key={index} className="border dark:border-gray-800 rounded-lg overflow-hidden">
                              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  Example {index + 1}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Input</div>
                                  <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                                      {tc.input || 'No input'}
                                    </pre>
                                    <button
                                      onClick={() => copyToClipboard(tc.input || '')}
                                      className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <FiCopy size={14} />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Output</div>
                                  <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                                      {tc.expectedOutput || tc.output || 'No output'}
                                    </pre>
                                    <button
                                      onClick={() => copyToClipboard(tc.expectedOutput || tc.output || '')}
                                      className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <FiCopy size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Cases (Hidden & Visible) */}
                    {problem.testCases?.length > 0 && (
                      <div ref={testCasesRef}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Test Cases ({problem.testCases.length})
                          </h3>
                          <button
                            onClick={() => setExpandedTestCases(
                              expandedTestCases.length === problem.testCases.length 
                                ? [] 
                                : problem.testCases.map((_, i) => i)
                            )}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {expandedTestCases.length === problem.testCases.length 
                              ? 'Collapse all' 
                              : 'Expand all'
                            }
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {problem.testCases.map((testCase, index) => (
                            <div 
                              key={index} 
                              className={`border dark:border-gray-800 rounded-lg overflow-hidden transition-all ${
                                expandedTestCases.includes(index) ? 'ring-2 ring-blue-500/20' : ''
                              }`}
                            >
                              <div 
                                className="px-4 py-3 bg-gray-50 dark:bg-gray-900 cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => toggleTestCase(index)}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Test Case {index + 1}
                                  </span>
                                  {testCase.isHidden && (
                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded flex items-center">
                                      <FiEyeOff size={10} className="mr-1" />
                                      Hidden
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">
                                    {!testCase.isHidden ? 'Visible' : 'Hidden'}
                                  </span>
                                  {expandedTestCases.includes(index) ? (
                                    <FiChevronUp className="text-gray-500" />
                                  ) : (
                                    <FiChevronDown className="text-gray-500" />
                                  )}
                                </div>
                              </div>
                              
                              {expandedTestCases.includes(index) && (
                                <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Input</div>
                                      <div className="relative group">
                                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                                          {testCase.input}
                                        </pre>
                                        <button
                                          onClick={() => copyToClipboard(testCase.input)}
                                          className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <FiCopy size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Expected Output</div>
                                      <div className="relative group">
                                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                                          {testCase.expectedOutput}
                                        </pre>
                                        <button
                                          onClick={() => copyToClipboard(testCase.expectedOutput)}
                                          className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <FiCopy size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Constraints
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            {problem.constraints.timeLimit && (
                              <li className="flex items-center">
                                <BsClock className="mr-2 text-gray-500" />
                                <span>Time limit: <strong>{problem.constraints.timeLimit} ms</strong></span>
                              </li>
                            )}
                            {problem.constraints.memoryLimit && (
                              <li className="flex items-center">
                                <BsLightning className="mr-2 text-gray-500" />
                                <span>Memory limit: <strong>{problem.constraints.memoryLimit} MB</strong></span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {problem.tags?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {problem.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Code Editor & Submission */}
          <div className="space-y-6">
            {/* Code Editor Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-gray-800 overflow-hidden">
              {/* Editor Header */}
              <div className="px-4 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        setCode(getDefaultCode(problem.title, e.target.value));
                      }}
                      className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cpp">C++ 17</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                    
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <FiCopy size={14} />
                      <span>Copy</span>
                    </button>
                    
                    <button
                      onClick={() => setCode(getDefaultCode(problem.title, language))}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <span>Reset</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCustomTest(!showCustomTest)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      {showCustomTest ? <VscDebugStop size={14} /> : <VscDebugStart size={14} />}
                      <span>Custom Test</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="h-[400px]">
                <Editor
                  language={language}
                  value={code}
                  theme={editorTheme}
                  onChange={setCode}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>

              {/* Custom Test Panel */}
              {showCustomTest && (
                <div className="border-t dark:border-gray-800 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Input
                      </label>
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="w-full h-32 bg-gray-900 text-gray-100 font-mono text-sm p-3 rounded border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter custom input..."
                        spellCheck="false"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Output
                      </label>
                      <pre className="w-full h-32 bg-gray-900 text-gray-100 font-mono text-sm p-3 rounded border border-gray-700 overflow-auto whitespace-pre-wrap">
                        {customOutput || 'Run to see output...'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Footer */}
              <div className="px-4 py-3 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {code.length} chars • {code.split('\n').length} lines
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={runCustomTest}
                      disabled={isRunning}
                      className={`flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors ${
                        isRunning
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <FiPlay size={16} />
                          <span>Run</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !user}
                      className={`flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors ${
                        submitting || !user
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <FiSend size={16} />
                          <span>Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Results */}
            {testResults.length > 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <h3 className="font-medium text-gray-900 dark:text-white">Submission Result</h3>
                </div>
                <div className="p-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="space-y-3">
                      <div className={`px-4 py-3 rounded-lg ${getVerdictColor(result.verdict)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {result.verdict === VERDICT.ACCEPTED ? (
                              <BsCheckCircle size={20} />
                            ) : (
                              <BsXCircle size={20} />
                            )}
                            <span className="font-medium">{result.verdict}</span>
                          </div>
                          <div className="text-sm">
                            {result.testCasesPassed}/{result.totalTestCases} tests passed
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="flex items-center space-x-4">
                            <span>Time: {result.runtime || 0} ms</span>
                            <span>Memory: {result.memory || 0} MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;