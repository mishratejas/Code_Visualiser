import React, { createContext, useState, useContext, useEffect } from 'react';

const EditorContext = createContext();

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

export const EditorProvider = ({ children }) => {
  const [editorSettings, setEditorSettings] = useState(() => {
    const saved = localStorage.getItem('editor_settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: { enabled: true },
      lineNumbers: 'on',
      automaticLayout: true,
      formatOnSave: true,
      autoSave: true,
      autoSaveDelay: 1000,
    };
  });

  const [keybindings, setKeybindings] = useState(() => {
    const saved = localStorage.getItem('editor_keybindings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      runCode: 'ctrl+enter',
      submitCode: 'ctrl+s',
      formatCode: 'shift+alt+f',
      toggleComment: 'ctrl+/',
      find: 'ctrl+f',
      replace: 'ctrl+h',
      toggleSidebar: 'ctrl+b',
      saveFile: 'ctrl+s',
    };
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred_language') || 'javascript';
  });

  const [recentLanguages, setRecentLanguages] = useState(() => {
    const saved = localStorage.getItem('recent_languages');
    return saved ? JSON.parse(saved) : ['javascript', 'python', 'java'];
  });

  const [snippets, setSnippets] = useState(() => {
    const saved = localStorage.getItem('code_snippets');
    return saved ? JSON.parse(saved) : {};
  });

  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('editor_layout');
    return saved ? JSON.parse(saved) : {
      sidebarOpen: true,
      panelHeight: 300,
      splitView: false,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('editor_settings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  useEffect(() => {
    localStorage.setItem('editor_keybindings', JSON.stringify(keybindings));
  }, [keybindings]);

  useEffect(() => {
    localStorage.setItem('preferred_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('recent_languages', JSON.stringify(recentLanguages));
  }, [recentLanguages]);

  useEffect(() => {
    localStorage.setItem('code_snippets', JSON.stringify(snippets));
  }, [snippets]);

  useEffect(() => {
    localStorage.setItem('editor_layout', JSON.stringify(layout));
  }, [layout]);

  const updateEditorSetting = (key, value) => {
    setEditorSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateKeybinding = (action, binding) => {
    setKeybindings(prev => ({
      ...prev,
      [action]: binding,
    }));
  };

  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    
    // Add to recent languages
    setRecentLanguages(prev => {
      const filtered = prev.filter(lang => lang !== newLanguage);
      return [newLanguage, ...filtered].slice(0, 5);
    });
  };

  const addSnippet = (name, code, language = 'javascript') => {
    setSnippets(prev => ({
      ...prev,
      [name]: { code, language, createdAt: new Date().toISOString() },
    }));
  };

  const removeSnippet = (name) => {
    setSnippets(prev => {
      const newSnippets = { ...prev };
      delete newSnippets[name];
      return newSnippets;
    });
  };

  const updateLayout = (key, value) => {
    setLayout(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleSidebar = () => {
    setLayout(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  };

  const resetToDefaults = (section) => {
    if (section === 'settings') {
      const defaults = {
        theme: 'vs-dark',
        fontSize: 14,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        minimap: { enabled: true },
        lineNumbers: 'on',
        automaticLayout: true,
        formatOnSave: true,
        autoSave: true,
        autoSaveDelay: 1000,
      };
      setEditorSettings(defaults);
    } else if (section === 'keybindings') {
      const defaults = {
        runCode: 'ctrl+enter',
        submitCode: 'ctrl+s',
        formatCode: 'shift+alt+f',
        toggleComment: 'ctrl+/',
        find: 'ctrl+f',
        replace: 'ctrl+h',
        toggleSidebar: 'ctrl+b',
        saveFile: 'ctrl+s',
      };
      setKeybindings(defaults);
    } else if (section === 'layout') {
      const defaults = {
        sidebarOpen: true,
        panelHeight: 300,
        splitView: false,
      };
      setLayout(defaults);
    }
  };

  const getSupportedLanguages = () => [
    { value: 'javascript', label: 'JavaScript', extension: '.js', icon: '⚡' },
    { value: 'python', label: 'Python', extension: '.py', icon: '🐍' },
    { value: 'java', label: 'Java', extension: '.java', icon: '☕' },
    { value: 'cpp', label: 'C++', extension: '.cpp', icon: '⚙️' },
    { value: 'c', label: 'C', extension: '.c', icon: '🔧' },
    { value: 'typescript', label: 'TypeScript', extension: '.ts', icon: '📘' },
    { value: 'go', label: 'Go', extension: '.go', icon: '🚀' },
    { value: 'rust', label: 'Rust', extension: '.rs', icon: '🦀' },
    { value: 'swift', label: 'Swift', extension: '.swift', icon: '🐦' },
    { value: 'kotlin', label: 'Kotlin', extension: '.kt', icon: '🤖' },
  ];

  const getLanguageConfig = (lang) => {
    const configs = {
      javascript: {
        name: 'JavaScript',
        monaco: 'javascript',
        defaultCode: `function solve(input) {
  // Write your solution here
  return input;
}`,
      },
      python: {
        name: 'Python',
        monaco: 'python',
        defaultCode: `def solve(input):
    # Write your solution here
    return input`,
      },
      java: {
        name: 'Java',
        monaco: 'java',
        defaultCode: `public class Solution {
    public Object solve(Object input) {
        // Write your solution here
        return input;
    }
}`,
      },
      cpp: {
        name: 'C++',
        monaco: 'cpp',
        defaultCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& input) {
        // Write your solution here
        return input;
    }
};`,
      },
      c: {
        name: 'C',
        monaco: 'c',
        defaultCode: `#include <stdio.h>
#include <stdlib.h>

int* solve(int* input, int inputSize, int* returnSize) {
    // Write your solution here
    *returnSize = inputSize;
    return input;
}`,
      },
      typescript: {
        name: 'TypeScript',
        monaco: 'typescript',
        defaultCode: `function solve(input: any): any {
  // Write your solution here
  return input;
}`,
      },
    };

    return configs[lang] || configs.javascript;
  };

  const getThemeOptions = () => [
    { value: 'vs-dark', label: 'Dark', description: 'Default dark theme' },
    { value: 'light', label: 'Light', description: 'Default light theme' },
    { value: 'hc-black', label: 'High Contrast', description: 'High contrast theme' },
    { value: 'vs', label: 'Visual Studio', description: 'Classic VS theme' },
  ];

  const getFontSizeOptions = () => [
    { value: 12, label: '12px' },
    { value: 13, label: '13px' },
    { value: 14, label: '14px' },
    { value: 15, label: '15px' },
    { value: 16, label: '16px' },
    { value: 18, label: '18px' },
    { value: 20, label: '20px' },
    { value: 24, label: '24px' },
  ];

  const getTabSizeOptions = () => [
    { value: 2, label: '2 spaces' },
    { value: 4, label: '4 spaces' },
    { value: 8, label: '8 spaces' },
  ];

  const value = {
    editorSettings,
    keybindings,
    language,
    recentLanguages,
    snippets,
    layout,
    updateEditorSetting,
    updateKeybinding,
    updateLanguage,
    addSnippet,
    removeSnippet,
    updateLayout,
    toggleSidebar,
    resetToDefaults,
    getSupportedLanguages,
    getLanguageConfig,
    getThemeOptions,
    getFontSizeOptions,
    getTabSizeOptions,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export default EditorContext;