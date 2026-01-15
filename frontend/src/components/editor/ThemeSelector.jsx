import React, { useState } from 'react';

const ThemeSelector = ({ themes, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTheme = themes.find(t => t.value === value);

  const getThemeIcon = (themeValue) => {
    const icons = {
      'vs-dark': (
        <div className="w-4 h-4 bg-gray-800 rounded-sm border border-gray-600 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-600 rounded-sm"></div>
        </div>
      ),
      'light': (
        <div className="w-4 h-4 bg-gray-100 rounded-sm border border-gray-300 flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-300 rounded-sm"></div>
        </div>
      ),
      'hc-black': (
        <div className="w-4 h-4 bg-black rounded-sm border border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-sm"></div>
        </div>
      )
    };
    return icons[themeValue] || icons['vs-dark'];
  };

  const getThemeLabel = (themeValue) => {
    const labels = {
      'vs-dark': 'Dark',
      'light': 'Light',
      'hc-black': 'High Contrast'
    };
    return labels[themeValue] || themeValue;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
      >
        <div className="flex items-center">
          <span className="mr-2">{getThemeIcon(value)}</span>
          <span className="text-gray-700 dark:text-gray-200">
            {getThemeLabel(value)}
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
          <div className="py-1">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => {
                  onChange(theme.value);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${value === theme.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-200'
                  }`}
              >
                <span className="mr-2">{getThemeIcon(theme.value)}</span>
                {getThemeLabel(theme.value)}
                {value === theme.value && (
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

export default ThemeSelector;