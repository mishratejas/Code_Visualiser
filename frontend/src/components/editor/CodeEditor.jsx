import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FiCopy, FiPlay, FiSave, FiSettings } from 'react-icons/fi';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';

const CodeEditor = ({ problemId, initialCode = '', onCodeChange, onSubmit, readOnly = false }) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const editorRef = useRef(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
  ];

  const themes = [
    { value: 'vs-dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'hc-black', label: 'High Contrast' },
  ];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (onCodeChange) {
      onCodeChange(value);
    }
  };

  const handleSave = () => {
    localStorage.setItem(`code_${problemId}_${language}`, code);
    toast.success('Code saved locally');
  };

  const handleRunTests = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual API
      const response = await mockRunTests(code, language);
      setTestResults(response);
      toast.success('Tests completed!');
    } catch (error) {
      toast.error('Error running tests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ code, language, problemId });
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const loadSavedCode = () => {
    const saved = localStorage.getItem(`code_${problemId}_${language}`);
    if (saved) {
      setCode(saved);
      toast.success('Loaded saved code');
    }
  };

  useEffect(() => {
    loadSavedCode();
  }, [language, problemId]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Code Editor</h3>
          <LanguageSelector languages={languages} value={language} onChange={setLanguage} />
          <ThemeSelector themes={themes} value={theme} onChange={setTheme} />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FiCopy className="mr-2" /> Copy
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            <FiSave className="mr-2" /> Save
          </button>
          <button
            onClick={handleRunTests}
            disabled={isSubmitting}
            className="flex items-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50"
          >
            <FiPlay className="mr-2" /> Run Tests
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-[500px]">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: readOnly,
          }}
        />
      </div>

      {/* Test Results Panel */}
      {testResults && (
        <div className="border-t bg-gray-50 dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 dark:text-white">Test Results</h4>
              <button
                onClick={() => setTestResults(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${test.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {test.passed ? (
                        <BsCheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <BsXCircle className="text-red-500 mr-2" />
                      )}
                      <span className="font-medium text-gray-800 dark:text-white">
                        Test Case {index + 1}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${test.passed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                    >
                      {test.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  {!test.passed && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>Expected: {test.expected}</p>
                      <p>Got: {test.actual}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor Status Bar */}
      <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t">
        <div className="flex justify-between">
          <div>
            Language: {language.toUpperCase()} | Lines: {code.split('\n').length} | 
            Characters: {code.length}
          </div>
          <div>
            {readOnly ? 'Read Only' : 'Editing'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock function for testing
const mockRunTests = async (code, language) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { passed: true, expected: '5', actual: '5' },
        { passed: true, expected: '10', actual: '10' },
        { passed: false, expected: '15', actual: '14' },
        { passed: true, expected: '20', actual: '20' },
      ]);
    }, 1500);
  });
};

export default CodeEditor;