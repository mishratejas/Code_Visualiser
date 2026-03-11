// frontend/src/components/problems/ProblemDetail.jsx
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FiChevronDown, FiChevronUp, FiCopy, FiCheck, FiShare2, FiBookmark, FiClock, FiBarChart2, FiCpu } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';
import { toast } from 'react-hot-toast';

const ProblemDetail = ({ problem }) => {
  const { isDark } = useTheme();
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    examples: true,
    constraints: true,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeExample, setActiveExample] = useState(0);

  // Theme-specific classes
  const cardClass = isDark 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentClass = isDark ? 'text-rose-400' : 'text-rose-600';
  const codeBgClass = isDark ? 'bg-gray-900' : 'bg-gray-100';

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
    toast.success('Copied to clipboard!');
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n');
  };

  if (!problem) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${cardClass} rounded-xl p-6 border`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty?.toUpperCase()}
              </span>
              <span className={`text-xs ${subTextClass}`}>ID: {problem._id?.slice(-6)}</span>
            </div>
            <h1 className={`text-2xl font-bold ${textClass} mb-2`}>{problem.title}</h1>
            <p className={`text-sm ${subTextClass}`}>{problem.description}</p>
          </div>
          
          <div className="flex items-start gap-2">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <FiBookmark className={`h-5 w-5 ${isBookmarked ? accentClass : subTextClass}`} />
            </button>
            <button
              onClick={() => copyToClipboard(window.location.href, -1)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <FiShare2 className={`h-5 w-5 ${subTextClass}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className={`text-xl font-bold ${textClass}`}>
              {problem.metadata?.acceptanceRate?.toFixed(1) || 0}%
            </div>
            <div className={`text-xs ${subTextClass}`}>Acceptance</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${textClass}`}>
              {problem.constraints?.timeLimit || 2000}ms
            </div>
            <div className={`text-xs ${subTextClass}`}>Time Limit</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${textClass}`}>
              {problem.constraints?.memoryLimit || 256}MB
            </div>
            <div className={`text-xs ${subTextClass}`}>Memory</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${textClass}`}>
              {problem.metadata?.submissions || 0}
            </div>
            <div className={`text-xs ${subTextClass}`}>Submissions</div>
          </div>
        </div>

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {problem.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-3 py-1 text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full ${subTextClass}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className={`${cardClass} rounded-xl border overflow-hidden`}>
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, description: !prev.description }))}
          className="w-full px-6 py-4 flex justify-between items-center"
        >
          <h2 className={`font-bold ${textClass}`}>Description</h2>
          {expandedSections.description ? 
            <FiChevronUp className={subTextClass} /> : 
            <FiChevronDown className={subTextClass} />
          }
        </button>
        {expandedSections.description && (
          <div className="px-6 pb-6">
            <div className={`text-sm ${subTextClass} whitespace-pre-line`}>
              {problem.description}
            </div>
          </div>
        )}
      </div>

      {/* Input/Output Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problem.inputFormat && (
          <div className={`${cardClass} rounded-xl p-6 border`}>
            <h3 className={`font-bold mb-3 ${textClass}`}>Input Format</h3>
            <div className={`text-sm ${subTextClass} whitespace-pre-line`}>
              {problem.inputFormat}
            </div>
          </div>
        )}
        {problem.outputFormat && (
          <div className={`${cardClass} rounded-xl p-6 border`}>
            <h3 className={`font-bold mb-3 ${textClass}`}>Output Format</h3>
            <div className={`text-sm ${subTextClass} whitespace-pre-line`}>
              {problem.outputFormat}
            </div>
          </div>
        )}
      </div>

      {/* Examples */}
      {problem.sampleInput && problem.sampleInput.length > 0 && (
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>
          <button
            onClick={() => setExpandedSections(prev => ({ ...prev, examples: !prev.examples }))}
            className="w-full px-6 py-4 flex justify-between items-center"
          >
            <h2 className={`font-bold ${textClass}`}>Examples</h2>
            {expandedSections.examples ? 
              <FiChevronUp className={subTextClass} /> : 
              <FiChevronDown className={subTextClass} />
            }
          </button>
          {expandedSections.examples && (
            <div className="px-6 pb-6">
              {/* Example Navigation */}
              {problem.sampleInput.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {problem.sampleInput.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveExample(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeExample === index
                          ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                          : isDark
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Example {index + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Example */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${textClass}`}>Input:</span>
                    <button
                      onClick={() => copyToClipboard(problem.sampleInput[activeExample], activeExample)}
                      className={`flex items-center gap-1 text-xs ${subTextClass} hover:${accentClass}`}
                    >
                      {copiedIndex === activeExample ? (
                        <><FiCheck className="h-3 w-3" /> Copied!</>
                      ) : (
                        <><FiCopy className="h-3 w-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <pre className={`${codeBgClass} p-3 rounded-lg text-sm font-mono overflow-x-auto ${textClass}`}>
                    {formatText(problem.sampleInput[activeExample])}
                  </pre>
                </div>
                
                {problem.sampleOutput && problem.sampleOutput[activeExample] && (
                  <div>
                    <span className={`text-sm font-medium ${textClass}`}>Output:</span>
                    <pre className={`${codeBgClass} p-3 rounded-lg text-sm font-mono mt-2 ${textClass}`}>
                      {formatText(problem.sampleOutput[activeExample])}
                    </pre>
                  </div>
                )}
                
                {problem.sampleExplanation && problem.sampleExplanation[activeExample] && (
                  <div>
                    <span className={`text-sm font-medium ${textClass}`}>Explanation:</span>
                    <p className={`text-sm ${subTextClass} mt-2`}>
                      {problem.sampleExplanation[activeExample]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && (
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>
          <button
            onClick={() => setExpandedSections(prev => ({ ...prev, constraints: !prev.constraints }))}
            className="w-full px-6 py-4 flex justify-between items-center"
          >
            <h2 className={`font-bold ${textClass}`}>Constraints</h2>
            {expandedSections.constraints ? 
              <FiChevronUp className={subTextClass} /> : 
              <FiChevronDown className={subTextClass} />
            }
          </button>
          {expandedSections.constraints && (
            <div className="px-6 pb-6">
              <div className="space-y-2">
                {problem.constraints.inputConstraints && (
                  <div className={`text-sm ${subTextClass}`}>
                    <span className="font-medium">Input:</span> {problem.constraints.inputConstraints}
                  </div>
                )}
                {problem.constraints.outputConstraints && (
                  <div className={`text-sm ${subTextClass}`}>
                    <span className="font-medium">Output:</span> {problem.constraints.outputConstraints}
                  </div>
                )}
                <div className={`text-sm ${subTextClass}`}>
                  <span className="font-medium">Time Limit:</span> {problem.constraints.timeLimit}ms
                </div>
                <div className={`text-sm ${subTextClass}`}>
                  <span className="font-medium">Memory Limit:</span> {problem.constraints.memoryLimit}MB
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hints */}
      {problem.hints && problem.hints.length > 0 && (
        <div className={`${cardClass} rounded-xl p-6 border`}>
          <h3 className={`font-bold mb-3 ${textClass}`}>Hints</h3>
          <div className="space-y-3">
            {problem.hints.map((hint, index) => (
              <div key={index} className="flex gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 text-xs font-bold`}>
                  {index + 1}
                </div>
                <p className={`text-sm ${subTextClass}`}>
                  {typeof hint === 'string' ? hint : hint.content || hint.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemDetail;