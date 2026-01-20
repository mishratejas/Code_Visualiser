import React from 'react';
import { FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

const TestCase = ({ 
  index, 
  input, 
  expectedOutput, 
  isHidden = false, 
  explanation = '', 
  result = null 
}) => {
  const passed = result?.passed || false;
  const status = passed ? 'passed' : (result ? 'failed' : 'pending');
  
  return (
    <div className={`test-case border rounded-lg p-4 mb-3 transition-all ${
      status === 'passed' 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
        : status === 'failed' 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Test Case {index + 1}
          </h4>
          {isHidden && (
            <span className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
              <FiEyeOff className="mr-1" size={12} />
              Hidden
            </span>
          )}
          {!isHidden && explanation && (
            <span className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
              <FiEye className="mr-1" size={12} />
              With Explanation
            </span>
          )}
        </div>
        
        {result && (
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            passed 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {passed ? (
              <>
                <FiCheck className="mr-1" />
                Passed
              </>
            ) : (
              <>
                <FiX className="mr-1" />
                Failed
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Input
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <pre className="text-sm whitespace-pre-wrap break-words font-mono text-gray-800 dark:text-gray-200">
              {input || "No input"}
            </pre>
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expected Output
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <pre className="text-sm whitespace-pre-wrap break-words font-mono text-gray-800 dark:text-gray-200">
              {expectedOutput || "No output"}
            </pre>
          </div>
        </div>
      </div>
      
      {result && (
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Output
          </div>
          <div className={`p-3 rounded border ${
            passed 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}>
            <pre className="text-sm whitespace-pre-wrap break-words font-mono">
              {result.actualOutput || "No output"}
            </pre>
          </div>
        </div>
      )}
      
      {explanation && !isHidden && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Explanation
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            {explanation}
          </div>
        </div>
      )}
      
      {result && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <span className="font-medium mr-1">Time:</span>
              {result.runtime || 0}ms
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <span className="font-medium mr-1">Memory:</span>
              {result.memory || 0}MB
            </div>
          </div>
          
          {result.error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCase;