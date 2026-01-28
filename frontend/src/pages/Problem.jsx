import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProblemById, runCode, submitSolution } from '../services/api';
import { 
  FiPlay, FiSend, FiCopy, FiCheck, FiX, FiAlertCircle, 
  FiChevronRight, FiClock, FiBarChart2, FiUsers, FiCode,
  FiEye, FiEyeOff, FiChevronDown, FiChevronUp, FiDownload,
  FiMaximize2, FiMinimize2, FiSettings
} from 'react-icons/fi';
import { BsCheckCircle, BsXCircle, BsClock, BsLightning, BsArrowLeft } from 'react-icons/bs';
import { IoMdTime } from 'react-icons/io';
import { VscDebugStart, VscDebugStop } from 'react-icons/vsc';
import { HiSparkles } from 'react-icons/hi';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await getProblemById(id);
      
      if (response.success) {
        const problemData = response.data?.problem || response.data;
        setProblem(problemData);
        
        const defaultCode = getDefaultCode(problemData.title, language);
        setCode(defaultCode);
        
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
      case 'easy': return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'medium': return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getVerdictColor = (verdict) => {
    switch(verdict) {
      case VERDICT.ACCEPTED:
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800';
      case VERDICT.WRONG_ANSWER:
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
      case VERDICT.TIME_LIMIT_EXCEEDED:
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
      case VERDICT.RUNTIME_ERROR:
      case VERDICT.COMPILATION_ERROR:
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Problem not found</h2>
          <p className="text-gray-600 dark:text-gray-400">The problem you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-6 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/problems')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all"
        >
          <BsArrowLeft size={18} />
          <span className="font-medium">Back to Problems</span>
        </button>

        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* Left Panel - Problem Description */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Problem Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-10"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
                        <FiCode className="text-blue-600 dark:text-blue-400" />
                        {problem.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                        </span>
                        {problem.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {problem.metadata?.acceptanceRate?.toFixed(1) || 
                          ((problem.acceptedSubmissions / (problem.totalSubmissions || 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Acceptance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {problem.metadata?.submissions || problem.totalSubmissions || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {problem.constraints?.timeLimit || 2000}ms
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Time Limit</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-5"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                  <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    {['statement', 'examples', 'hints'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-6 py-4 font-semibold transition-all ${
                          activeTab === tab
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="p-8">
                    {activeTab === 'statement' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Problem Description</h3>
                          <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {problem.description}
                          </div>
                        </div>

                        {problem.inputFormat && (
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Input Format</h3>
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {problem.inputFormat}
                            </div>
                          </div>
                        )}

                        {problem.outputFormat && (
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Output Format</h3>
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {problem.outputFormat}
                            </div>
                          </div>
                        )}

                        {problem.constraints && (
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Constraints</h3>
                            <div className="space-y-2 text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-2">
                                <FiClock className="text-blue-600 dark:text-blue-400" />
                                <span>Time Limit: {problem.constraints.timeLimit}ms</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiBarChart2 className="text-purple-600 dark:text-purple-400" />
                                <span>Memory Limit: {problem.constraints.memoryLimit}MB</span>
                              </div>
                              {problem.constraints.inputConstraints && (
                                <div className="mt-2 text-gray-600 dark:text-gray-400">
                                  {problem.constraints.inputConstraints}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'examples' && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Test Cases</h3>
                        {problem.testCases?.filter(tc => !tc.isHidden).map((testCase, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleTestCase(index)}
                              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Example {index + 1}
                              </span>
                              {expandedTestCases.includes(index) ? 
                                <FiChevronUp className="text-gray-600 dark:text-gray-400" /> : 
                                <FiChevronDown className="text-gray-600 dark:text-gray-400" />
                              }
                            </button>
                            {expandedTestCases.includes(index) && (
                              <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Input</label>
                                    <button
                                      onClick={() => copyToClipboard(testCase.input)}
                                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <FiCopy size={14} />
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                    {testCase.input}
                                  </pre>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Output</label>
                                    <button
                                      onClick={() => copyToClipboard(testCase.expectedOutput)}
                                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <FiCopy size={14} />
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                    {testCase.expectedOutput}
                                  </pre>
                                </div>
                                {testCase.explanation && (
                                  <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                      Explanation
                                    </label>
                                    <div className="text-gray-700 dark:text-gray-300 text-sm">
                                      {testCase.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'hints' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hints</h3>
                        {problem.hints && problem.hints.length > 0 ? (
                          problem.hints.map((hint, index) => (
                            <div key={index} className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {hint}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                            No hints available for this problem
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Code Editor */}
          <div className="space-y-6">
            {/* Editor Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                {/* Editor Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          setCode(getDefaultCode(problem.title, e.target.value));
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="cpp">C++ 17</option>
                        <option value="python">Python 3</option>
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                      </select>
                      
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                      >
                        <FiCopy size={16} />
                        <span className="font-medium">Copy</span>
                      </button>
                      
                      <button
                        onClick={() => setCode(getDefaultCode(problem.title, language))}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all font-medium"
                      >
                        Reset
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCustomTest(!showCustomTest)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
                          showCustomTest
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {showCustomTest ? <VscDebugStop size={16} /> : <VscDebugStart size={16} />}
                        <span>Custom Test</span>
                      </button>

                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code Editor */}
                <div className={isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[500px]'}>
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
                      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                      fontLigatures: true,
                      lineNumbers: 'on',
                      roundedSelection: true,
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                    }}
                  />
                </div>

                {/* Custom Test Panel */}
                {showCustomTest && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Input
                        </label>
                        <textarea
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="w-full h-40 bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded-xl border-2 border-gray-700 focus:border-blue-500 focus:outline-none transition-all resize-none"
                          placeholder="Enter custom input..."
                          spellCheck="false"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Output
                        </label>
                        <pre className="w-full h-40 bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded-xl border-2 border-gray-700 overflow-auto whitespace-pre-wrap">
                          {customOutput || 'Run to see output...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {code.length} chars • {code.split('\n').length} lines
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={runCustomTest}
                        disabled={isRunning}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                          isRunning
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <FiPlay size={18} />
                            <span>Run Code</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !user}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                          submitting || !user
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
                        }`}
                      >
                        {submitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <FiSend size={18} />
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Results */}
            {testResults.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl blur-2xl opacity-10"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <HiSparkles className="text-blue-600 dark:text-blue-400" />
                      Submission Result
                    </h3>
                  </div>
                  <div className="p-6">
                    {testResults.map((result, index) => (
                      <div key={index} className="space-y-4">
                        <div className={`px-6 py-4 rounded-2xl ${getVerdictColor(result.verdict)}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {result.verdict === VERDICT.ACCEPTED ? (
                                <BsCheckCircle size={24} className="text-green-600 dark:text-green-400" />
                              ) : (
                                <BsXCircle size={24} className="text-red-600 dark:text-red-400" />
                              )}
                              <span className="font-bold text-lg">{result.verdict}</span>
                            </div>
                            <div className="text-sm font-semibold">
                              {result.testCasesPassed}/{result.totalTestCases} tests passed
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <FiClock className="text-blue-600 dark:text-blue-400" />
                              <span>Runtime: {result.runtime || 0} ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiBarChart2 className="text-purple-600 dark:text-purple-400" />
                              <span>Memory: {result.memory || 0} MB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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