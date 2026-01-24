import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiCopy, FiCheck, FiShare2, FiBookmark, FiBookmarkFill } from 'react-icons/fi';
import { BsLightningFill, BsCheckCircle, BsClock, BsCodeSlash } from 'react-icons/bs';
import { AiOutlineRocket } from 'react-icons/ai';
import { toast } from 'react-hot-toast';

const ProblemDetail = ({ problem }) => {
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    examples: true,
    constraints: true,
    tags: true,
    hints: true
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeExample, setActiveExample] = useState(0);

  useEffect(() => {
    // Check if problem is bookmarked
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedProblems') || '[]');
    setIsBookmarked(bookmarks.includes(problem._id));
  }, [problem._id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
    toast.success('Copied to clipboard!');
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedProblems') || '[]');
    if (isBookmarked) {
      const newBookmarks = bookmarks.filter(id => id !== problem._id);
      localStorage.setItem('bookmarkedProblems', JSON.stringify(newBookmarks));
      setIsBookmarked(false);
      toast.success('Removed from bookmarks');
    } else {
      bookmarks.push(problem._id);
      localStorage.setItem('bookmarkedProblems', JSON.stringify(bookmarks));
      setIsBookmarked(true);
      toast.success('Added to bookmarks');
    }
  };

  const shareProblem = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const renderDifficultyBadge = (difficulty) => {
    const styles = {
      easy: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
      medium: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      hard: 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
    };
    
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${styles[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty?.toUpperCase()}
      </span>
    );
  };

  const renderStatItem = (icon, label, value, color) => (
    <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all hover:scale-[1.02] ${color}`}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 p-3 rounded-xl bg-opacity-20 bg-white dark:bg-gray-700">
          {icon}
        </div>
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {label}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Problem Header */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 rounded-3xl p-8 shadow-xl border border-blue-100/50 dark:border-blue-900/30">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {renderDifficultyBadge(problem.difficulty)}
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                Problem ID: {problem._id?.slice(-6).toUpperCase()}
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {problem.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl">
              {problem.shortDescription || problem.description?.substring(0, 200) + '...'}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
                {problem.metadata?.acceptanceRate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Acceptance</div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={toggleBookmark}
                className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all hover:scale-105"
                title={isBookmarked ? "Remove bookmark" : "Bookmark problem"}
              >
                {isBookmarked ? 
                  <FiBookmarkFill className="text-yellow-500 text-xl" /> : 
                  <FiBookmark className="text-gray-500 dark:text-gray-400 text-xl" />
                }
              </button>
              
              <button
                onClick={shareProblem}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-all hover:scale-105"
                title="Share problem"
              >
                <FiShare2 className="text-blue-600 dark:text-blue-400 text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {renderStatItem(
            <BsLightningFill className="text-2xl text-yellow-500" />,
            'Time Limit',
            `${problem.constraints?.timeLimit || 2000}ms`,
            'hover:border-yellow-200 dark:hover:border-yellow-800'
          )}
          {renderStatItem(
            <BsCodeSlash className="text-2xl text-purple-500" />,
            'Memory Limit',
            `${problem.constraints?.memoryLimit || 256}MB`,
            'hover:border-purple-200 dark:hover:border-purple-800'
          )}
          {renderStatItem(
            <BsCheckCircle className="text-2xl text-green-500" />,
            'Submissions',
            (problem.metadata?.submissions || 0).toLocaleString(),
            'hover:border-green-200 dark:hover:border-green-800'
          )}
          {renderStatItem(
            <BsClock className="text-2xl text-blue-500" />,
            'Views',
            (problem.metadata?.views || 0).toLocaleString(),
            'hover:border-blue-200 dark:hover:border-blue-800'
          )}
        </div>

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <span className="mr-2">🏷️</span> Tags:
            </div>
            {problem.tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Problem Sections */}
      <div className="space-y-6">
        {/* Description */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => toggleSection('description')}
            className="w-full px-8 py-6 flex justify-between items-center hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-all"
          >
            <div className="flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-4"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Description
              </h2>
            </div>
            {expandedSections.description ? 
              <FiChevronUp className="text-gray-500 text-xl" /> : 
              <FiChevronDown className="text-gray-500 text-xl" />
            }
          </button>
          {expandedSections.description && (
            <div className="px-8 pb-8">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none prose-blue prose-headings:font-bold prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />
            </div>
          )}
        </div>

        {/* Input/Output Format */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 rounded-3xl shadow-xl overflow-hidden border border-emerald-100/50 dark:border-emerald-800/30">
            <div className="px-8 py-6 border-b border-emerald-200/30 dark:border-emerald-700/30 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3 text-emerald-500">📥</span>
                Input Format
              </h2>
            </div>
            <div className="px-8 py-6">
              <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-6 rounded-xl font-mono border border-gray-800">
                {problem.inputFormat || 'No specific input format defined.'}
              </pre>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10 rounded-3xl shadow-xl overflow-hidden border border-purple-100/50 dark:border-purple-800/30">
            <div className="px-8 py-6 border-b border-purple-200/30 dark:border-purple-700/30 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3 text-purple-500">📤</span>
                Output Format
              </h2>
            </div>
            <div className="px-8 py-6">
              <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-6 rounded-xl font-mono border border-gray-800">
                {problem.outputFormat || 'No specific output format defined.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Examples */}
        {problem.sampleInput && problem.sampleInput.length > 0 && (
          <div className="bg-gradient-to-br from-white to-yellow-50/30 dark:from-gray-800 dark:to-yellow-900/10 rounded-3xl shadow-xl overflow-hidden border border-yellow-100/50 dark:border-yellow-800/30">
            <button
              onClick={() => toggleSection('examples')}
              className="w-full px-8 py-6 flex justify-between items-center hover:bg-yellow-50/30 dark:hover:bg-yellow-900/20 transition-all"
            >
              <div className="flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mr-4"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Examples ({problem.sampleInput.length})
                </h2>
              </div>
              {expandedSections.examples ? 
                <FiChevronUp className="text-gray-500 text-xl" /> : 
                <FiChevronDown className="text-gray-500 text-xl" />
              }
            </button>
            {expandedSections.examples && (
              <div className="px-8 pb-8">
                {/* Example Navigation */}
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                  {problem.sampleInput.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveExample(index)}
                      className={`px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeExample === index
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      Example {index + 1}
                    </button>
                  ))}
                </div>
                
                {/* Active Example Content */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <span className="mr-2">📥</span> Input
                        </div>
                        <button
                          onClick={() => copyToClipboard(problem.sampleInput[activeExample], activeExample)}
                          className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {copiedIndex === activeExample ? (
                            <>
                              <FiCheck className="mr-1 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FiCopy className="mr-1" />
                              Copy Input
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-5 rounded-xl border border-gray-800">
                        {problem.sampleInput[activeExample]}
                      </pre>
                    </div>
                    
                    {problem.sampleOutput && problem.sampleOutput[activeExample] && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                          <span className="mr-2">📤</span> Output
                        </div>
                        <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-5 rounded-xl border border-gray-800">
                          {problem.sampleOutput[activeExample]}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <span className="mr-2">💡</span> Explanation
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 italic">
                      {problem.sampleExplanation?.[activeExample] || 'No explanation provided.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <div className="bg-gradient-to-br from-white to-red-50/30 dark:from-gray-800 dark:to-red-900/10 rounded-3xl shadow-xl overflow-hidden border border-red-100/50 dark:border-red-800/30">
            <button
              onClick={() => toggleSection('constraints')}
              className="w-full px-8 py-6 flex justify-between items-center hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-all"
            >
              <div className="flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full mr-4"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Constraints
                </h2>
              </div>
              {expandedSections.constraints ? 
                <FiChevronUp className="text-gray-500 text-xl" /> : 
                <FiChevronDown className="text-gray-500 text-xl" />
              }
            </button>
            {expandedSections.constraints && (
              <div className="px-8 pb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <strong className="font-semibold">Time Limit:</strong> {problem.constraints.timeLimit}ms
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                      <div className="text-gray-700 dark:text-gray-300">
                        <strong className="font-semibold">Memory Limit:</strong> {problem.constraints.memoryLimit}MB
                      </div>
                    </li>
                    {problem.constraints.inputConstraints && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <strong className="font-semibold">Input Constraints:</strong> {problem.constraints.inputConstraints}
                        </div>
                      </li>
                    )}
                    {problem.constraints.otherConstraints && (
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <strong className="font-semibold">Other:</strong> {problem.constraints.otherConstraints}
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl overflow-hidden border border-blue-100/50 dark:border-blue-800/30">
            <button
              onClick={() => toggleSection('hints')}
              className="w-full px-8 py-6 flex justify-between items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all"
            >
              <div className="flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-4"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  💡 Hints ({problem.hints.length})
                </h2>
              </div>
              {expandedSections.hints ? 
                <FiChevronUp className="text-gray-500 text-xl" /> : 
                <FiChevronDown className="text-gray-500 text-xl" />
              }
            </button>
            {expandedSections.hints && (
              <div className="px-8 pb-8">
                <div className="space-y-4">
                  {problem.hints.map((hint, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-5 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 pt-1">{hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow-up */}
        {problem.followUp && (
          <div className="bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-emerald-900/20 rounded-3xl shadow-xl p-8 border border-emerald-100/50 dark:border-emerald-800/30">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <AiOutlineRocket className="mr-3 text-emerald-500 text-2xl" />
              🚀 Follow-up Challenge
            </h2>
            <p className="text-gray-700 dark:text-gray-300 bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10 p-5 rounded-2xl">
              {problem.followUp}
            </p>
          </div>
        )}
      </div>

      {/* Quick Action Bar */}
      <div className="sticky bottom-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-gray-200/70 dark:border-gray-700/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleBookmark}
              className={`flex items-center px-4 py-2.5 rounded-xl font-medium transition-all ${isBookmarked
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {isBookmarked ? 
                <FiBookmarkFill className="mr-2" /> : 
                <FiBookmark className="mr-2" />
              }
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              onClick={shareProblem}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 rounded-xl font-medium hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-all"
            >
              <FiShare2 className="mr-2" />
              Share
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href={`/submit/${problem._id}`}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
            >
              <BsLightningFill className="mr-2" />
              Solve Problem
            </a>
            <a
              href={`/problems`}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-300 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
            >
              Browse Problems
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;