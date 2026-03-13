import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiPlay, FiSend, FiCopy, FiChevronDown, FiChevronUp, 
  FiClock, FiBarChart2, FiCode, FiArrowLeft, FiTrendingUp,
  FiMaximize2, FiMinimize2, FiAward
} from 'react-icons/fi';
import { BsCheckCircle, BsXCircle, BsLightning, BsTrophy } from 'react-icons/bs';
import { MdOutlineLeaderboard } from 'react-icons/md';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import ContestTimer from '../components/contests/ContestTimer';
import socketService from '../services/socket';

const ContestProblem = () => {
  const { contestId, problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState(null);
  const [contest, setContest] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [activeTab, setActiveTab] = useState('statement');
  const [submitting, setSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [showCustomTest, setShowCustomTest] = useState(false);
  const [expandedTestCases, setExpandedTestCases] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [testResults, setTestResults] = useState([]);
  
  const editorRef = useRef(null);

  useEffect(() => {
    fetchContestAndProblem();
    
    // Join contest room for live updates
    if (contestId) {
      socketService.connect();
      socketService.joinContest(contestId, user?.id);
      
      // Listen for leaderboard updates
      socketService.onLeaderboardUpdate((newLeaderboard) => {
        setLeaderboard(newLeaderboard);
        updateUserRank(newLeaderboard);
      });
    }
    
    return () => {
      if (contestId) {
        socketService.leaveContest(contestId);
        socketService.cleanupContestListeners();
      }
    };
  }, [contestId, problemId]);

  const fetchContestAndProblem = async () => {
    try {
      setLoading(true);
      
      // Fetch contest details
      const contestRes = await api.get(`/contests/${contestId}`);
      const contestData = contestRes.data?.data || contestRes.data;
      
      if (!contestData.isRegistered) {
        toast.error('You must be registered for this contest');
        navigate(`/contests/${contestId}`);
        return;
      }
      
      setContest(contestData);
      setLeaderboard(contestData.leaderboard || []);
      // Also fetch live leaderboard separately
      try {
        const lbRes = await api.get(`/contests/${contestId}/leaderboard`);
        const lbData = lbRes.data?.data || lbRes.data || [];
        if (Array.isArray(lbData) && lbData.length > 0) setLeaderboard(lbData);
      } catch { /* leaderboard optional */ }
      updateUserRank(contestData.leaderboard || []);
      
      // Find the problem from contest problems
      const foundProblem = contestData.problems?.find(p => p._id === problemId || p.id === problemId);
      
      if (!foundProblem) {
        toast.error('Problem not found in this contest');
        navigate(`/contests/${contestId}/live`);
        return;
      }
      
      setProblem(foundProblem);
      
      // Load saved code or default
      const savedCode = localStorage.getItem(`contest_${contestId}_problem_${problemId}_${language}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
        setCode(getDefaultCode(foundProblem.title, language));
      }
      
      if (foundProblem.testCases?.length > 0) {
        setExpandedTestCases([0]);
      }
    } catch (error) {
      console.error('Error fetching contest/problem:', error);
      toast.error('Failed to load contest problem');
      navigate(`/contests/${contestId}/live`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRank = (leaderboardData) => {
    if (!user?.id || !leaderboardData) return;
    
    const myEntry = leaderboardData.find(entry => entry.userId === (user._id || user.id));
    if (myEntry) {
      setUserRank(myEntry.rank);
      setUserScore(myEntry.score || 0);
    }
  };

  const getDefaultCode = (title, lang) => {
    const templates = {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // ---- your solution below ----\n\n    return 0;\n}`,
      python: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # ---- your solution below ----\n    pass\n\nsolve()`,
      java: `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n    static PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));\n\n    public static void main(String[] args) throws IOException {\n        // ---- your solution below ----\n        out.flush();\n    }\n}`,
      javascript: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet _input = '';\nprocess.stdin.on('data', d => _input += d);\nprocess.stdin.on('end', () => {\n    const lines = _input.trim().split('\\n');\n    let idx = 0;\n    const rl = () => lines[idx++];\n    // ---- your solution below ----\n    function solve() {\n        const n = parseInt(rl());\n        console.log(n);\n    }\n    solve();\n});`,
      go: `package main\nimport "fmt"\n\nfunc main() {\n    // ---- your solution below ----\n    fmt.Println()\n}`,
      rust: `use std::io::{self, Read};\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // ---- your solution below ----\n}`
    };
    
    return templates[lang] || templates.cpp;
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    // Auto-save to localStorage
    localStorage.setItem(`contest_${contestId}_problem_${problemId}_${language}`, newCode);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const savedCode = localStorage.getItem(`contest_${contestId}_problem_${problemId}_${newLang}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(getDefaultCode(problem?.title, newLang));
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n');
  };

  const copyToClipboard = (text) => {
    const formatted = formatText(text);
    navigator.clipboard.writeText(formatted);
    toast.success('Copied to clipboard!');
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
      const response = await api.post('/submissions/run', {
        problemId,
        code,
        language,
        input: customInput || ''
      });
      
      if (response.data.success) {
        const result = response.data.data;
        setCustomOutput(result.output || result.error || 'No output');
        
        if (result.verdict === 'Accepted') {
          toast.success('Custom test passed!');
        } else if (result.error) {
          toast.error(`Error: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Run test error:', err);
      toast.error('Failed to run custom test');
      setCustomOutput(err.response?.data?.message || 'Error running test');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    // Check if contest is still running
    const now = new Date();
    const endTime = new Date(contest.endTime || contest.end_time);
    if (now > endTime) {
      toast.error('Contest has ended. Submissions are closed.');
      return;
    }

    const startTime = new Date(contest.startTime || contest.start_time);
    if (now < startTime) {
      toast.error('Contest has not started yet.');
      return;
    }

    setSubmitting(true);
    try {
      // ── Step 1: Execute code via normal submission endpoint to get verdict ──
      toast.loading('Judging your code...', { id: 'judge' });
      const subRes = await api.post('/submissions', {
        problemId,
        code,
        language,
      });

      const sub = subRes?.data?.submission || subRes?.submission || subRes?.data?.data?.submission;
      toast.dismiss('judge');

      if (!sub) throw new Error('Submission execution failed — no result returned');

      const submissionId = sub._id;
      const verdict      = sub.verdict;
      const runtime      = sub.runtime || 0;
      const passed       = sub.testCasesPassed || 0;
      const total        = sub.totalTestCases  || 0;

      // ── Step 2: Record in contest with the real verdict ──
      const contestRes = await api.post(`/contests/${contestId}/submit`, {
        problemId,
        code,
        language,
        submissionId,
      });

      const isAccepted = verdict === 'Accepted' || verdict === 'accepted';
      const pointsEarned = contestRes?.data?.data?.pointsEarned ?? 0;

      setTestResults([{
        verdict,
        runtime,
        testCasesPassed: passed,
        totalTestCases:  total,
        score: pointsEarned,
      }]);

      if (isAccepted) {
        toast.success(`✅ Accepted! +${pointsEarned} points`, { duration: 5000, icon: '🏆' });
      } else {
        toast.error(`${verdict} — ${passed}/${total} test cases passed`, { duration: 5000 });
      }

      // Refresh leaderboard
      setTimeout(() => fetchContestAndProblem(), 1500);

    } catch (err) {
      toast.dismiss('judge');
      console.error('Submit error:', err);
      const msg = err.response?.data?.message || err.message || 'Submission failed';
      toast.error(msg);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!problem || !contest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Problem not found</h2>
          <p className="text-gray-400">This problem is not available in this contest</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white py-6 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header with Contest Info */}
        <div className="mb-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/contests/${contestId}/live`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all"
            >
              <FiArrowLeft size={18} />
              <span className="font-medium">Back to Contest</span>
            </button>
            
            <div className="flex items-center gap-4">
              {/* User Stats */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-700/50 rounded-xl">
                <div className="text-center">
                  <div className="text-xs text-gray-400">Your Rank</div>
                  <div className="text-lg font-bold text-yellow-400">
                    #{userRank || '—'}
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Your Score</div>
                  <div className="text-lg font-bold text-green-400">
                    {userScore}
                  </div>
                </div>
              </div>
              
              {/* Timer */}
              <ContestTimer
                startTime={contest.startTime}
                endTime={contest.endTime}
                size="small"
                showLabels={false}
              />
            </div>
          </div>
          
          {/* Contest Name */}
          <div className="text-sm text-gray-400">
            Contest: <span className="text-white font-medium">{contest.title}</span>
          </div>
        </div>

        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* Left Panel - Problem Description */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Problem Header */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <h1 className="text-2xl font-bold mb-3 flex items-center gap-3">
                  <FiCode className="text-blue-400" />
                  {problem.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                  </span>
                  {problem.points && (
                    <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30 rounded-xl text-sm font-bold">
                      {problem.points} Points
                    </span>
                  )}
                  {problem.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700/50 text-gray-300 text-sm rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="flex border-b border-gray-700">
                  {['statement', 'examples', 'hints'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 font-semibold transition-all ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {activeTab === 'statement' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold mb-3">Problem Description</h3>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                          {problem.description || 'No description available.'}
                        </div>
                      </div>

                      {problem.inputFormat && (
                        <div>
                          <h3 className="text-xl font-bold mb-3">Input Format</h3>
                          <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                            {problem.inputFormat}
                          </div>
                        </div>
                      )}

                      {problem.outputFormat && (
                        <div>
                          <h3 className="text-xl font-bold mb-3">Output Format</h3>
                          <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                            {problem.outputFormat}
                          </div>
                        </div>
                      )}

                      {(problem.constraints?.timeLimit || problem.timeLimit || problem.constraints?.memoryLimit || problem.memoryLimit) && (
                        <div>
                          <h3 className="text-xl font-bold mb-3">Constraints</h3>
                          <div className="space-y-2 text-gray-300">
                            <div className="flex items-center gap-2">
                              <FiClock className="text-blue-400" />
                              <span>Time Limit: {problem.constraints?.timeLimit || problem.timeLimit || 2000}ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiBarChart2 className="text-purple-400" />
                              <span>Memory Limit: {problem.constraints?.memoryLimit || problem.memoryLimit || 256}MB</span>
                            </div>
                            {problem.constraints?.inputConstraints && (
                              <div className="mt-2 text-gray-400 whitespace-pre-line">
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
                      <h3 className="text-xl font-bold mb-4">Test Cases</h3>
                      {problem.testCases?.filter(tc => !tc.isHidden).map((testCase, index) => (
                        <div key={index} className="border border-gray-700 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleTestCase(index)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                          >
                            <span className="font-semibold">Example {index + 1}</span>
                            {expandedTestCases.includes(index) ? 
                              <FiChevronUp className="text-gray-400" /> : 
                              <FiChevronDown className="text-gray-400" />
                            }
                          </button>
                          {expandedTestCases.includes(index) && (
                            <div className="p-6 space-y-4 bg-gray-800/30">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-semibold text-gray-300">Input</label>
                                  <button
                                    onClick={() => copyToClipboard(testCase.input)}
                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    <FiCopy size={14} />
                                    Copy
                                  </button>
                                </div>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                  {formatText(testCase.input)}
                                </pre>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-semibold text-gray-300">Expected Output</label>
                                  <button
                                    onClick={() => copyToClipboard(testCase.expectedOutput)}
                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  >
                                    <FiCopy size={14} />
                                    Copy
                                  </button>
                                </div>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                  {formatText(testCase.expectedOutput)}
                                </pre>
                              </div>
                              {testCase.explanation && (
                                <div>
                                  <label className="text-sm font-semibold text-gray-300 mb-2 block">
                                    Explanation
                                  </label>
                                  <div className="text-gray-300 text-sm">
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
                      <h3 className="text-xl font-bold mb-4">Hints</h3>
                      {problem.hints && problem.hints.length > 0 ? (
                        problem.hints.map((hint, index) => (
                          <div key={index} className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="text-gray-300">
                              {hint}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No hints available for this problem
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini Leaderboard */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MdOutlineLeaderboard className="text-yellow-400" />
                  Top 5 Contestants
                </h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.userId === user?.id 
                          ? 'bg-blue-500/20 border border-blue-500/30' 
                          : 'bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {entry.username || `User ${entry.userId.slice(0, 8)}`}
                            {entry.userId === user?.id && (
                              <span className="ml-2 text-xs text-blue-400">(You)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {entry.solved || 0} solved
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">{entry.score || 0}</div>
                        <div className="text-xs text-gray-400">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Code Editor */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
              {/* Editor Header */}
              <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="cpp">C++ 17</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                    
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-xl transition-all"
                    >
                      <FiCopy size={16} />
                      <span className="font-medium">Copy</span>
                    </button>
                    
                    <button
                      onClick={() => handleCodeChange(getDefaultCode(problem.title, language))}
                      className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-xl transition-all font-medium"
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
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Custom Test
                    </button>

                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 text-gray-300 hover:bg-gray-700 rounded-xl transition-all"
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
                  theme="vs-dark"
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                    fontLigatures: true,
                  }}
                />
              </div>

              {/* Custom Test Panel */}
              {showCustomTest && (
                <div className="border-t border-gray-700 p-6 bg-gray-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Input
                      </label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="w-full h-40 bg-gray-900 text-gray-100 font-mono text-sm p-4 rounded-xl border-2 border-gray-700 focus:border-blue-500 focus:outline-none transition-all resize-none"
                        placeholder="Enter custom input..."
                        spellCheck="false"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
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
              <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400 font-medium">
                    {code.length} chars • {code.split('\n').length} lines
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={runCustomTest}
                      disabled={isRunning}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        isRunning
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
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
                      disabled={submitting}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        submitting
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
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
                          <span>Submit to Contest</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Results */}
            {testResults.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                  <h3 className="font-bold flex items-center gap-2">
                    <BsLightning className="text-blue-400" />
                    Contest Submission Result
                  </h3>
                </div>
                <div className="p-6">
                  {testResults.map((result, index) => (
                    <div key={index} className="space-y-4">
                      <div className={`px-6 py-4 rounded-2xl ${
                        result.verdict === 'Accepted'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {result.verdict === 'Accepted' ? (
                              <BsCheckCircle size={24} />
                            ) : (
                              <BsXCircle size={24} />
                            )}
                            <span className="font-bold text-lg">{result.verdict}</span>
                          </div>
                          <div className="text-sm font-semibold">
                            {result.testCasesPassed}/{result.totalTestCases} tests passed
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <FiClock />
                            <span>Runtime: {result.runtime || 0} ms</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiAward />
                            <span>Score: +{result.score || 0} points</span>
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

export default ContestProblem;