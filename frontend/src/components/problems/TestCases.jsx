import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiCheck, FiX, FiCopy, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { BsLightning, BsMemory } from 'react-icons/bs';
import { toast } from 'react-hot-toast';

const TestCase = ({ 
  index, 
  input, 
  expectedOutput, 
  isHidden = false, 
  explanation = '', 
  result = null,
  isExpanded = false
}) => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  const passed = result?.passed || false;
  const status = passed ? 'passed' : (result ? 'failed' : 'pending');

  // Theme-specific classes
  const cardClass = isDark 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const codeBgClass = isDark ? 'bg-gray-900' : 'bg-gray-100';

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(formatText(text));
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'passed':
        return {
          bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
          border: isDark ? 'border-green-800' : 'border-green-200',
          text: 'text-green-500',
          icon: <FiCheck className="text-green-500" />
        };
      case 'failed':
        return {
          bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
          border: isDark ? 'border-red-800' : 'border-red-200',
          text: 'text-red-500',
          icon: <FiX className="text-red-500" />
        };
      default:
        return {
          bg: isDark ? 'bg-gray-800' : 'bg-gray-50',
          border: isDark ? 'border-gray-700' : 'border-gray-200',
          text: subTextClass,
          icon: null
        };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className={`${cardClass} border rounded-xl p-4 mb-3 transition-all`}>
      {/* Header */}
      <button
        onClick={() => setLocalExpanded(!localExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColor.bg}`}>
            <span className={`text-sm font-medium ${textClass}`}>{index + 1}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${textClass}`}>
              Test Case {index + 1}
            </span>
            {isHidden && (
              <span className={`px-2 py-0.5 text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full ${subTextClass}`}>
                Hidden
              </span>
            )}
            {result && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusColor.bg}`}>
                {statusColor.icon}
                <span className={`text-xs font-medium ${statusColor.text}`}>
                  {passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            )}
          </div>
        </div>
        {localExpanded ? (
          <FiChevronDown className={subTextClass} />
        ) : (
          <FiChevronRight className={subTextClass} />
        )}
      </button>

      {/* Expanded Content */}
      {localExpanded && (
        <div className="mt-4 space-y-4">
          {/* Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${textClass}`}>Input:</span>
              <button
                onClick={() => copyToClipboard(input)}
                className={`flex items-center gap-1 text-xs ${subTextClass} hover:${isDark ? 'text-rose-400' : 'text-rose-600'}`}
              >
                {copied ? (
                  <><FiCheck className="h-3 w-3" /> Copied!</>
                ) : (
                  <><FiCopy className="h-3 w-3" /> Copy</>
                )}
              </button>
            </div>
            <pre className={`${codeBgClass} p-3 rounded-lg text-sm font-mono overflow-x-auto ${textClass}`}>
              {formatText(input) || '(empty)'}
            </pre>
          </div>

          {/* Expected Output */}
          <div>
            <span className={`text-sm font-medium ${textClass}`}>Expected Output:</span>
            <pre className={`${codeBgClass} p-3 rounded-lg text-sm font-mono mt-2 ${textClass}`}>
              {formatText(expectedOutput) || '(empty)'}
            </pre>
          </div>

          {/* Actual Output (if result exists) */}
          {result?.actualOutput && (
            <div>
              <span className={`text-sm font-medium ${textClass}`}>Your Output:</span>
              <pre className={`${codeBgClass} p-3 rounded-lg text-sm font-mono mt-2 ${textClass}`}>
                {formatText(result.actualOutput) || '(empty)'}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {result?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className={`text-sm font-medium text-red-500`}>Error:</span>
              <pre className={`text-sm font-mono mt-1 text-red-400`}>
                {result.error}
              </pre>
            </div>
          )}

          {/* Explanation */}
          {explanation && !isHidden && (
            <div>
              <span className={`text-sm font-medium ${textClass}`}>Explanation:</span>
              <p className={`text-sm ${subTextClass} mt-1`}>{explanation}</p>
            </div>
          )}

          {/* Performance Stats */}
          {result && (
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-1">
                <BsLightning className={subTextClass} />
                <span className={`text-xs ${textClass}`}>{result.runtime || 0}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <BsMemory className={subTextClass} />
                <span className={`text-xs ${textClass}`}>{result.memory || 0}MB</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCase;