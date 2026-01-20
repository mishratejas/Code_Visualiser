import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProblemById, runCode, submitSolution } from '../services/api';
import { FiChevronRight, FiCode, FiClock, FiBarChart2, FiUsers, FiPlay, FiSend, FiCopy, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-hot-toast';

const Problem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    tags: [],
    inputFormat: '',
    outputFormat: '',
    sampleInput: [],
    sampleOutput: [],
    testCases: [],
    constraints: {},
    hints: [],
    metadata: {}
  });
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [activeTab, setActiveTab] = useState('description');
  const [testResults, setTestResults] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await getProblemById(id);
        
        if (response.success) {
          const problemData = response.data?.problem || response.data;
          
          console.log('Problem data:', problemData); // Debug log
          
          // Extract sampleInput and sampleOutput from testCases
          const sampleInput = [];
          const sampleOutput = [];
          const testCases = problemData.testCases || [];
          
          testCases.forEach(testCase => {
            if (!testCase.isHidden) {
              sampleInput.push(testCase.input);
              sampleOutput.push(testCase.expectedOutput);
            }
          });
          
          const safeProblemData = {
            ...problemData,
            testCases: testCases,
            sampleInput: sampleInput.length > 0 ? sampleInput : problemData.sampleInput || [],
            sampleOutput: sampleOutput.length > 0 ? sampleOutput : problemData.sampleOutput || [],
            tags: Array.isArray(problemData.tags) ? problemData.tags : [],
            hints: Array.isArray(problemData.hints) ? problemData.hints : [],
            constraints: problemData.constraints || {},
            metadata: problemData.metadata || {}
          };
          
          setProblem(safeProblemData);
          
          // Set default code
          const defaultCode = getDefaultCode(safeProblemData.title, 'python');
          setCode(defaultCode);
        }
      } catch (err) {
        console.error('Error fetching problem:', err);
        toast.error('Failed to load problem');
        setTimeout(() => navigate('/problems'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblem();
  }, [id, user, navigate]);
  
  const getDefaultCode = (title, lang) => {
    const functionName = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    
    const templates = {
      python: `class Solution:
    def ${functionName}(self, nums, target):
        # Write your solution here
        # Example: Two Sum problem
        # nums = list of integers
        # target = integer
        # Return indices of two numbers that sum to target
        pass

# Test your solution
if __name__ == "__main__":
    sol = Solution()
    # Add test cases here
    print(sol.${functionName}([2, 7, 11, 15], 9))`,
      
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
const ${functionName} = function(nums, target) {
    // Write your solution here
    // Example: Two Sum problem
    // Return indices of two numbers that sum to target
};

// Test cases
console.log(${functionName}([2, 7, 11, 15], 9));`,
      
      java: `public class Solution {
    public int[] ${functionName}(int[] nums, int target) {
        // Write your solution here
        // Example: Two Sum problem
        // Return indices of two numbers that sum to target
        return new int[0];
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Test your solution here
        System.out.println(java.util.Arrays.toString(sol.${functionName}(new int[]{2, 7, 11, 15}, 9)));
    }
}`
    };
    
    return templates[lang] || templates.python;
  };
  
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }
    
    try {
      setSubmitting(true);
      const payload = {
        problemId: id,
        code,
        language,
        input: userInput || problem.testCases?.[0]?.input || ''  // Use first test case if no custom input
      };
      
      console.log('Running code with payload:', payload);
      
      const response = await runCode(payload);
      
      console.log('Run code response:', response);
      
      if (response.success) {
        setTestResults([{
          passed: response.data?.passed || false,
          runtime: response.data?.executionTime || 0,
          memory: response.data?.memoryUsed || 0,
          output: response.data?.output || '',
          error: response.data?.error
        }]);
        setCustomOutput(response.data?.output || '');
        toast.success('Code executed successfully!');
      } else {
        toast.error(response.message || 'Failed to run code');
      }
    } catch (err) {
      console.error('Error running code:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to execute code. Make sure backend is running.');
      }
    } finally {
      setSubmitting(false);
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
    
    try {
      setSubmitting(true);
      const response = await submitSolution({
        problemId: id,
        code,
        language
      });
      
      console.log('Submit response:', response);
      
      if (response.success) {
        toast.success('Solution submitted successfully!');
        setTestResults(response.data?.results || []);
        
        // Show detailed results
        if (response.data?.results) {
          const passed = response.data.results.filter(r => r.passed).length;
          const total = response.data.results.length;
          toast.success(`${passed}/${total} test cases passed!`);
        }
      } else {
        toast.error(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Error submitting solution:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to submit solution. Check backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'hard': return 'text-red-400 bg-red-900/30 border-red-700';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const getAcceptanceColor = (rate) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1e1e1e] border-t-[#3b82f6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/problems')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Problems
            </button>
            <FiChevronRight className="text-gray-600" />
            <span className="text-white font-medium">{problem.title}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full border ${getDifficultyColor(problem.difficulty)} text-sm font-medium`}>
                {problem.difficulty?.toUpperCase()}
              </div>
              <div className={`px-3 py-1 rounded bg-[#2d2d2d] text-sm ${getAcceptanceColor(problem.metadata?.acceptanceRate || 0)}`}>
                {problem.metadata?.acceptanceRate?.toFixed(1) || 0}% Acceptance
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Problem Description */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#2d2d2d]">
            {['description', 'solutions', 'discussions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-[#3b82f6] bg-[#2d2d2d]'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-[#2d2d2d]/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {activeTab === 'description' && (
              <div className="space-y-6">
                {/* Title */}
                <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#2d2d2d] rounded p-3">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <FiBarChart2 />
                      <span>Acceptance</span>
                    </div>
                    <div className={`text-xl font-bold mt-1 ${getAcceptanceColor(problem.metadata?.acceptanceRate || 0)}`}>
                      {problem.metadata?.acceptanceRate?.toFixed(1) || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-[#2d2d2d] rounded p-3">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <FiUsers />
                      <span>Submissions</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {problem.metadata?.submissions || 0}
                    </div>
                  </div>
                  
                  <div className="bg-[#2d2d2d] rounded p-3">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <FiClock />
                      <span>Time Limit</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {problem.constraints?.timeLimit || 2000}ms
                    </div>
                  </div>
                  
                  <div className="bg-[#2d2d2d] rounded p-3">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <FiCode />
                      <span>Memory</span>
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {problem.constraints?.memoryLimit || 256}MB
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                  <div className="text-gray-300 space-y-3">
                    <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                    {!problem.description && (
                      <p className="text-gray-400 italic">No description provided.</p>
                    )}
                  </div>
                </div>

                {/* Input/Output Format */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#2d2d2d] rounded p-4">
                    <h3 className="font-semibold text-white mb-2">Input Format</h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-[#1a1a1a] p-3 rounded font-mono">
                      {problem.inputFormat || 'No input format specified'}
                    </pre>
                  </div>
                  
                  <div className="bg-[#2d2d2d] rounded p-4">
                    <h3 className="font-semibold text-white mb-2">Output Format</h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-[#1a1a1a] p-3 rounded font-mono">
                      {problem.outputFormat || 'No output format specified'}
                    </pre>
                  </div>
                </div>

                {/* Examples */}
                {problem.sampleInput?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Examples</h2>
                    {problem.sampleInput.map((input, index) => (
                      <div key={index} className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Example {index + 1}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#2d2d2d] rounded p-3">
                            <div className="text-sm text-gray-400 mb-2">Input</div>
                            <pre className="text-sm text-white bg-[#1a1a1a] p-3 rounded font-mono whitespace-pre-wrap">
                              {input}
                            </pre>
                          </div>
                          {problem.sampleOutput?.[index] && (
                            <div className="bg-[#2d2d2d] rounded p-3">
                              <div className="text-sm text-gray-400 mb-2">Output</div>
                              <pre className="text-sm text-white bg-[#1a1a1a] p-3 rounded font-mono whitespace-pre-wrap">
                                {problem.sampleOutput[index]}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Test Cases */}
                {problem.testCases?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Test Cases ({problem.testCases.length})</h2>
                    <div className="space-y-3">
                      {problem.testCases.map((testCase, index) => (
                        <div key={index} className="bg-[#2d2d2d] rounded p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="text-sm text-gray-400">Test Case {index + 1}</div>
                            {testCase.isHidden && (
                              <span className="px-2 py-1 bg-[#3d3d3d] text-gray-300 text-xs rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-2">Input</div>
                              <pre className="text-sm text-white bg-[#1a1a1a] p-3 rounded font-mono whitespace-pre-wrap">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-2">Expected Output</div>
                              <pre className="text-sm text-white bg-[#1a1a1a] p-3 rounded font-mono whitespace-pre-wrap">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Constraints</h2>
                  <div className="bg-[#2d2d2d] rounded p-4">
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                        <span><strong>Time Limit:</strong> {problem.constraints.timeLimit || 2000} ms</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                        <span><strong>Memory Limit:</strong> {problem.constraints.memoryLimit || 256} MB</span>
                      </li>
                      {problem.constraints.inputConstraints && (
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                          <span><strong>Input:</strong> {problem.constraints.inputConstraints}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Tags */}
                {problem.tags?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-[#2d2d2d] text-gray-300 rounded-full text-sm border border-[#3d3d3d] hover:border-[#3b82f6] transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs content would go here */}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="space-y-6">
          {/* Editor Container */}
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden">
            {/* Editor Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-[#2d2d2d]">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(getDefaultCode(problem.title, e.target.value));
                    }}
                    className="bg-[#2d2d2d] border border-[#3d3d3d] rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#3b82f6]"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>
                </div>
                
                <button
                  onClick={copyCode}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded text-sm transition-colors"
                >
                  <FiCopy size={14} />
                  <span>Copy</span>
                </button>
                
                <button
                  onClick={() => setCode(getDefaultCode(problem.title, language))}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded text-sm transition-colors"
                >
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="p-2">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-[#1e1e1e] text-gray-100 font-mono text-sm p-4 rounded border border-[#2d2d2d] focus:outline-none focus:border-[#3b82f6] resize-none"
                spellCheck="false"
                placeholder="Write your solution here..."
              />
            </div>

            {/* Editor Footer */}
            <div className="px-6 py-4 border-t border-[#2d2d2d] bg-[#1e1e1e]">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {code.length} characters • {code.split('\n').length} lines
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleRunCode}
                    disabled={submitting}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlay size={16} />
                    <span>{submitting ? 'Running...' : 'Run Code'}</span>
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !user}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend size={16} />
                    <span>{submitting ? 'Submitting...' : 'Submit Solution'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2d2d2d]">
                <h3 className="font-semibold text-white">Test Results</h3>
              </div>
              <div className="p-4 space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#2d2d2d] rounded">
                    <div className="flex items-center space-x-3">
                      {result.passed ? (
                        <BsCheckCircle className="text-green-400" size={20} />
                      ) : (
                        <BsXCircle className="text-red-400" size={20} />
                      )}
                      <div>
                        <div className="text-white font-medium">Test Case {index + 1}</div>
                        <div className="text-sm text-gray-400">
                          {result.passed ? 'Passed' : 'Failed'} • {result.runtime || 0}ms • {result.memory || 0}MB
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${result.passed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Input/Output */}
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] overflow-hidden">
            <div className="px-6 py-3 border-b border-[#2d2d2d]">
              <h3 className="font-semibold text-white">Custom Test</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Input</label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full h-32 bg-[#1e1e1e] text-gray-100 font-mono text-sm p-3 rounded border border-[#2d2d2d] focus:outline-none focus:border-[#3b82f6] resize-none"
                  placeholder="Enter custom input here... (or leave empty to use first test case)"
                />
              </div>
              
              {customOutput && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Output</label>
                  <pre className="w-full bg-[#1e1e1e] text-gray-100 font-mono text-sm p-3 rounded border border-[#2d2d2d] whitespace-pre-wrap">
                    {customOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;