import React, { useState } from 'react';

const LanguageSelector = ({ languages, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage = languages.find(lang => lang.value === value);

  const getLanguageIcon = (lang) => {
    const icons = {
      javascript: 'JS',
      python: 'PY',
      java: 'JV',
      cpp: 'C++',
      c: 'C',
      typescript: 'TS',
      ruby: 'RB',
      go: 'GO',
      rust: 'RS',
      php: 'PHP'
    };
    return <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{icons[lang] || lang}</span>;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
      >
        <div className="flex items-center">
          <span className="mr-2">{getLanguageIcon(value)}</span>
          <span className="text-gray-700 dark:text-gray-200">
            {selectedLanguage?.label || 'Select Language'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {languages.map((language) => (
              <button
                key={language.value}
                onClick={() => {
                  onChange(language.value);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${value === language.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-200'
                  }`}
              >
                <span className="mr-2">{getLanguageIcon(language.value)}</span>
                {language.label}
                {value === language.value && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;