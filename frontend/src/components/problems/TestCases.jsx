import React, { useState } from 'react';
import { FiCheck, FiX, FiEye, FiEyeOff, FiCopy, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { BsLightning, BsMemory } from 'react-icons/bs';
import { toast } from 'react-hot-toast';

const TestCase = ({ 
  index, 
  input, 
  expectedOutput, 
  isHidden = false, 
  explanation = '', 
  result = null,
  isActive = false,
  onToggle = () => {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const passed = result?.passed || false;
  const status = passed ? 'passed' : (result ? 'failed' : 'pending');
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'passed': return {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10',
        border: 'border-green-200/50 dark:border-green-800/30',
        text: 'text-green-700 dark:text-green-300',
        icon: <FiCheck className="text-green-500" />,
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      };
      case 'failed': return {
        bg: 'bg-gradient-to-r from-red-50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/10',
        border: 'border-red-200/50 dark:border-red-800/30',
        text: 'text-red-700 dark:text-red-300',
        icon: <FiX className="text-red-500" />,
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      };
      default: return {
        bg: 'bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900',
        border: 'border-gray-200/50 dark:border-gray-700/30',
        text: 'text-gray-700 dark:text-gray-300',
        icon: null,
        badge: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
      };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className={`test-case rounded-2xl border ${statusColor.border} p-5 mb-4 transition-all duration-300 hover:shadow-lg ${statusColor.bg}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor.bg} border ${statusColor.border}`}>
            <span className="font-bold text-gray-900 dark:text-white">{index + 1}</span>
          </div>
          
          <div>
            <div className="flex items-center space-x-3">
              <h4 className="font-bold text-gray-900 dark:text-white">
                Test Case {index + 1}
              </h4>
              {isHidden && (
                <span className="flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-lg font-medium">
                  <FiEyeOff className="mr-1.5" size={12} />
                  Hidden
                </span>
              )}
              {!isHidden && explanation && (
                <span className="flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-medium">
                  <FiEye className="mr-1.5" size={12} />
                  With Explanation
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <BsLightning className="mr-1.5" />
                {result?.runtime || 0}ms
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <BsMemory className="mr-1.5" />
                {result?.memory || 0}MB
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {result && (
            <div className={`flex items-center px-4 py-2 rounded-xl font-bold ${statusColor.badge}`}>
              {statusColor.icon}
              <span className="ml-2">{passed ? 'PASSED' : 'FAILED'}</span>
            </div>
          )}
          
          {isExpanded ? (
            <FiChevronDown className="text-gray-400 text-xl" />
          ) : (
            <FiChevronRight className="text-gray-400 text-xl" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/30">
          {/* Input/Output Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <span className="mr-2">📥</span> Input
                </div>
                <button
                  onClick={() => copyToClipboard(input)}
                  className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <FiCheck className="mr-1.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className="mr-1.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono text-gray-100">
                  {input || "No input"}
                </pre>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <span className="mr-2">📤</span> Expected Output
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono text-gray-100">
                  {expectedOutput || "No output"}
                </pre>
              </div>
            </div>
          </div>
          
          {/* Your Output (if result exists) */}
          {result && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <span className="mr-2">🖥️</span> Your Output
              </div>
              <div className={`rounded-xl p-4 border ${passed ? 'border-green-200/50 dark:border-green-800/30 bg-green-50/30 dark:bg-green-900/10' : 'border-red-200/50 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/10'}`}>
                <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                  {result.actualOutput || "No output"}
                </pre>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {result?.error && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <span className="mr-2">⚠️</span> Error Message
              </div>
              <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/30">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono text-red-200">
                  {result.error}
                </pre>
              </div>
            </div>
          )}
          
          {/* Explanation */}
          {explanation && !isHidden && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <span className="mr-2">💡</span> Explanation
              </div>
              <div className="bg-gradient-to-r from-blue-50/30 to-cyan-50/20 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {explanation}
                </div>
              </div>
            </div>
          )}
          
          {/* Performance Stats */}
          {result && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                <div className={`font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passed ? 'Passed' : 'Failed'}
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Runtime</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {result.runtime || 0}ms
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {result.memory || 0}MB
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {result.score || (passed ? '100' : '0')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// TestCaseList Component
const TestCaseList = ({ testCases = [], results = [] }) => {
  const [expandedAll, setExpandedAll] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Cases ({testCases.length})
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {results.length > 0 
              ? `${results.filter(r => r.passed).length} of ${results.length} passed`
              : 'Run code to see results'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setExpandedAll(!expandedAll)}
            className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            {expandedAll ? 'Collapse All' : 'Expand All'}
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium">
            Run All Tests
          </button>
        </div>
      </div>

      {/* Test Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testCases.map((testCase, index) => (
          <TestCase
            key={index}
            index={index}
            {...testCase}
            result={results[index]}
            isExpanded={expandedAll}
          />
        ))}
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/30 p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Test Results Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                {results.filter(r => r.passed).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                {results.filter(r => !r.passed).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {Math.round(results.reduce((sum, r) => sum + (r.runtime || 0), 0) / results.length)}ms
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Runtime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {Math.round((results.filter(r => r.passed).length / results.length) * 100)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseList;
export { TestCase };