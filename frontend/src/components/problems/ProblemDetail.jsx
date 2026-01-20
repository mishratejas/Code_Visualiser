import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCopy, FiCheck } from 'react-icons/fi';
import { BsLightningFill } from 'react-icons/bs';

const ProblemDetail = ({ problem }) => {
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    examples: true,
    constraints: true,
    tags: true
  });

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
  };

  const renderDifficultyBadge = (difficulty) => {
    const styles = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty?.toUpperCase()}
      </span>
    );
  };

  const renderStatItem = (icon, label, value) => (
    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-gray-500 dark:text-gray-400 mb-1">{icon}</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Problem Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {problem.title}
            </h1>
            <div className="flex items-center space-x-4 mb-3">
              {renderDifficultyBadge(problem.difficulty)}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Problem ID: {problem._id?.slice(-6)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {problem.metadata?.acceptanceRate?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Acceptance</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {renderStatItem(
            <BsLightningFill />,
            'Time Limit',
            `${problem.constraints?.timeLimit || 2000}ms`
          )}
          {renderStatItem(
            '💾',
            'Memory',
            `${problem.constraints?.memoryLimit || 256}MB`
          )}
          {renderStatItem(
            '📊',
            'Submissions',
            problem.metadata?.submissions || 0
          )}
          {renderStatItem(
            '👁️',
            'Views',
            problem.metadata?.views || 0
          )}
        </div>

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Problem Sections */}
      <div className="space-y-4">
        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('description')}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
            {expandedSections.description ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {expandedSections.description && (
            <div className="px-6 pb-6">
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />
            </div>
          )}
        </div>

        {/* Input/Output Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Input Format
              </h2>
            </div>
            <div className="px-6 py-4">
              <pre className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                {problem.inputFormat}
              </pre>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Output Format
              </h2>
            </div>
            <div className="px-6 py-4">
              <pre className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                {problem.outputFormat}
              </pre>
            </div>
          </div>
        </div>

        {/* Examples */}
        {problem.sampleInput && problem.sampleInput.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('examples')}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Examples ({problem.sampleInput.length})
              </h2>
              {expandedSections.examples ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.examples && (
              <div className="px-6 pb-6 space-y-6">
                {problem.sampleInput.map((input, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">
                        Example {index + 1}
                      </h3>
                      <button
                        onClick={() => copyToClipboard(input, index)}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        {copiedIndex === index ? (
                          <>
                            <FiCheck className="mr-1" />
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Input
                        </div>
                        <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-4 rounded-lg">
                          {input}
                        </pre>
                      </div>
                      
                      {problem.sampleOutput && problem.sampleOutput[index] && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Output
                          </div>
                          <pre className="text-sm whitespace-pre-wrap bg-gray-900 text-gray-100 p-4 rounded-lg">
                            {problem.sampleOutput[index]}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                      {problem.sampleExplanation?.[index] || 'No explanation provided.'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('constraints')}
              className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Constraints
              </h2>
              {expandedSections.constraints ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {expandedSections.constraints && (
              <div className="px-6 pb-6">
                <ul className="space-y-2">
                  <li className="text-gray-700 dark:text-gray-300">
                    <strong>Time Limit:</strong> {problem.constraints.timeLimit}ms
                  </li>
                  <li className="text-gray-700 dark:text-gray-300">
                    <strong>Memory Limit:</strong> {problem.constraints.memoryLimit}MB
                  </li>
                  {problem.constraints.inputConstraints && (
                    <li className="text-gray-700 dark:text-gray-300">
                      <strong>Input Constraints:</strong> {problem.constraints.inputConstraints}
                    </li>
                  )}
                  {problem.constraints.otherConstraints && (
                    <li className="text-gray-700 dark:text-gray-300">
                      <strong>Other:</strong> {problem.constraints.otherConstraints}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 Hints ({problem.hints.length})
            </h2>
            <div className="space-y-3">
              {problem.hints.map((hint, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {problem.followUp && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🔄 Follow-up
            </h2>
            <p className="text-gray-700 dark:text-gray-300">{problem.followUp}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetail;