// frontend/src/pages/Problem.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiPlay, FiSend, FiCode, FiArrowLeft,
  FiMaximize2, FiMinimize2, FiMessageSquare, FiList, FiCheckCircle, FiXCircle, FiClock
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import ProblemDetail from '../components/problems/ProblemDetail';
import TestCase from '../components/problems/TestCases';
import ThemeToggle from '../components/common/ThemeToggle';
import Loader from '../components/common/Loader';
import api from '../services/api';
import AnalysisPanel from './analysisPanel';

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, editorTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState([]);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [showCustomTest, setShowCustomTest] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('problem'); // 'problem' | 'submissions' | 'discuss'
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/problems/${id}`);
      
      const problemData = response.data?.problem || response.data?.data || response.data;
      setProblem(problemData);
      
      // Set default code based on language
      setCode(getDefaultCode(problemData.title, language));
    } catch (error) {
      console.error('Failed to fetch problem:', error);
      toast.error('Failed to load problem');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissionCode = async (submission) => {
    // If code already loaded in list, use it; otherwise fetch by ID
    if (submission.code) {
      setViewingCode({ code: submission.code, language: submission.language, verdict: submission.verdict });
      return;
    }
    try {
      const res = await api.get(`/submissions/${submission._id}`);
      const s = res?.data?.submission || res?.data || res;
      setViewingCode({ code: s.code || '// Code not available', language: s.language || submission.language, verdict: s.verdict || submission.verdict });
    } catch {
      toast.error('Failed to load code');
    }
  };

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    try {
      const res = await api.get('/submissions', { params: { problemId: id, limit: 20 } });
      const list = res?.submissions || res?.data?.submissions || res?.data || [];
      setMySubmissions(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch submissions:', e);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const getDefaultCode = (title, lang) => {
    // All templates use stdin/stdout — C++ and Java MUST have main()
    const templates = {
      javascript: `process.stdin.resume();
process.stdin.setEncoding('utf8');
let _input = '';
process.stdin.on('data', d => _input += d);
process.stdin.on('end', () => {
    const lines = _input.trim().split('\\n');
    let idx = 0;
    const rl = () => lines[idx++];

    // ---- your solution below ----

    function solve() {
        const n = parseInt(rl());
        console.log(n);
    }

    solve();
});`,

      python: `import sys
input = sys.stdin.readline

def solve():
    # ---- your solution below ----
    line = input().strip()
    print(line)

solve()`,

      java: `import java.util.*;
import java.io.*;

public class Solution {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));

    public static void main(String[] args) throws IOException {
        // ---- your solution below ----
        String line = br.readLine();
        out.println(line);
        out.flush();
    }
}`,

      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // ---- your solution below ----
    string line;
    getline(cin, line);
    cout << line << endl;

    return 0;
}`
    };
    return templates[lang] || templates.javascript;
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

      const response = await api.post('/submissions/run', payload);
      
      // response is already the API result: { success, data: { output, error, verdict, ... }, ... }
      const result = response.data || response;
      setCustomOutput(result.output || result.error || 'No output');
      
      if (result.verdict === 'accepted') {
        toast.success('Custom test passed!');
      } else if (result.error) {
        toast.error(`Error: ${result.error}`);
      } else {
        toast.success('Code executed!');
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
      toast.error('Please login to submit');
      navigate('/login', { state: { from: `/problem/${id}` } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/submissions', {
        problemId: id,
        code,
        language
      });

      // API returns: { success, data: { submission: {...}, executionResults: [...] }, ... }
      // Axios interceptor already returns response.data, so 'response' here is the full API response object
      const responseData = response; // 'response' is already the data part of the axios response
      const submission = responseData?.data?.submission || responseData?.submission || responseData;
      const executionResults = responseData?.data?.executionResults || responseData?.executionResults || [];

      setSubmissionResult(submission);

      if (submission.isAccepted || submission.verdict === 'accepted') {
        toast.success('🎉 Solution accepted! All test cases passed!');
        fetchMySubmissions();
        // Refresh problem stats with a slight delay because backend updates it asynchronously
        setTimeout(() => fetchProblem(), 1000);
      } else {
        const verdictDisplay = {
          'wrong_answer': 'Wrong Answer',
          'time_limit_exceeded': 'Time Limit Exceeded',
          'runtime_error': 'Runtime Error',
          'compilation_error': 'Compilation Error',
          'memory_limit_exceeded': 'Memory Limit Exceeded',
          'pending': 'Pending',
        };
        toast.error(verdictDisplay[submission.verdict] || submission.verdict || 'Submission failed');
        // Still refresh stats to update submission counts even if failed (optional, but good for total submissions count)
        setTimeout(() => fetchProblem(), 1000);
      }

      // Show test case results if available (returned in dev mode)
      if (executionResults.length > 0) {
        setTestResults(executionResults);
      }

      // Show summary info
      if (submission.testCasesPassed !== undefined) {
        const passed = submission.testCasesPassed;
        const total = submission.totalTestCases;
        if (!submission.isAccepted && passed !== undefined) {
          toast(`${passed}/${total} test cases passed`, { icon: '📊' });
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark 
    ? 'bg-gray-900 border-gray-800' 
    : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${textClass}`}>Problem not found</h2>
          <button
            onClick={() => navigate('/problems')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg"
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/problems')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          >
            <FiArrowLeft className={subTextClass} />
            <span className={`text-sm ${textClass}`}>Back to Problems</span>
          </button>
          <ThemeToggle />
        </div>

        {/* Main Grid */}
        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* Left Panel - Problem Description */}
          {!isFullscreen && (
            <div className="space-y-4">
              <ProblemDetail problem={problem} />
            </div>
          )}

          {/* Right Panel - Code Editor */}
          <div className="space-y-4">
            {/* Editor Container */}
            <div className={`${cardClass} rounded-xl border overflow-hidden`}>
              {/* Editor Header */}
              <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(getDefaultCode(problem.title, e.target.value));
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                  <button
                    onClick={() => setShowCustomTest(!showCustomTest)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      showCustomTest
                        ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                        : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom Test
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <FiMinimize2 className={subTextClass} />
                    ) : (
                      <FiMaximize2 className={subTextClass} />
                    )}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className={isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[400px]'}>
                <Editor
                  language={language}
                  value={code}
                  theme={editorTheme}
                  onChange={setCode}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    folding: true,
                    renderLineHighlight: 'all',
                    fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                    fontLigatures: true,
                  }}
                />
              </div>

              {/* Custom Test Panel */}
              {showCustomTest && (
                <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textClass}`}>Input</label>
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className={`w-full h-24 p-3 text-sm font-mono rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="Enter test input..."
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textClass}`}>Output</label>
                      <pre className={`w-full h-24 p-3 text-sm font-mono rounded-lg border overflow-auto ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        {customOutput || 'Run to see output...'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`flex items-center justify-end gap-3 p-3 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  onClick={runCustomTest}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isRunning
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <FiPlay size={14} />
                      Run Code
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !user}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    submitting || !user
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:opacity-90'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend size={14} />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Submission Result Banner */}
            {submissionResult && (
              <div className={`rounded-xl p-4 border ${
                submissionResult.isAccepted || submissionResult.verdict === 'accepted'
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-red-900/20 border-red-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-lg font-bold ${
                      submissionResult.isAccepted || submissionResult.verdict === 'accepted'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {submissionResult.isAccepted || submissionResult.verdict === 'accepted' ? '✅ Accepted' :
                        submissionResult.verdict === 'wrong_answer' ? '❌ Wrong Answer' :
                        submissionResult.verdict === 'time_limit_exceeded' ? '⏱️ Time Limit Exceeded' :
                        submissionResult.verdict === 'runtime_error' ? '💥 Runtime Error' :
                        submissionResult.verdict === 'compilation_error' ? '🔧 Compilation Error' :
                        submissionResult.verdict || 'Submission Failed'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {submissionResult.testCasesPassed}/{submissionResult.totalTestCases} test cases passed
                      {submissionResult.runtime > 0 && ` · ${submissionResult.runtime}ms`}
                    </div>
                  </div>
                  <button onClick={() => setSubmissionResult(null)} className="text-gray-500 hover:text-gray-300">✕</button>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className={`${cardClass} rounded-xl p-4 border`}>
                <h3 className={`text-lg font-bold mb-3 ${textClass}`}>Test Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="text-xs text-gray-500">Test Cases</div>
                    <div className={`text-xl font-bold ${
                      testResults.every(r => r.passed) ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {testResults.filter(r => r.passed).length}/{testResults.length}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="text-xs text-gray-500">Avg Runtime</div>
                    <div className={`text-xl font-bold ${textClass}`}>
                      {Math.round(testResults.reduce((sum, r) => sum + (r.runtime || 0), 0) / testResults.length)}ms
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className={`text-xl font-bold ${
                      testResults.every(r => r.passed) ? 'text-green-500' : 'text-red-400'
                    }`}>
                      {testResults.every(r => r.passed) ? 'All Passed' : 'Some Failed'}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.passed
                        ? isDark ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                        : isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          result.passed ? 'text-green-500' : 'text-red-400'
                        }`}>
                          {result.passed ? '✅' : '❌'} Test Case {index + 1}
                        </span>
                        <span className="text-xs text-gray-500">{result.runtime}ms</span>
                      </div>
                      {!result.passed && (
                        <div className="space-y-1 text-xs">
                          <div><span className="text-gray-400">Expected: </span><code className={isDark ? 'text-gray-200' : 'text-gray-800'}>{result.expectedOutput}</code></div>
                          <div><span className="text-gray-400">Got: </span><code className="text-red-400">{result.actualOutput || result.error || 'No output'}</code></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Panel — shown after any submission */}
            {(submissionResult || testResults.length > 0) && code && (
              <div className={`rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
                <AnalysisPanel
                  code={code}
                  language={language}
                  submissionId={submissionResult?._id || submissionResult?.submission?._id || ''}
                  runtimeMs={submissionResult?.runtime || 0}
                  testCasesPassed={submissionResult?.testCasesPassed || testResults.filter(r => r.passed).length}
                  totalTestCases={submissionResult?.totalTestCases || testResults.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;