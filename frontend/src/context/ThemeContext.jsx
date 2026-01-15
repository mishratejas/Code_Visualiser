import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem('editorTheme') || 'vs-dark';
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Save editor theme
    localStorage.setItem('editorTheme', editorTheme);
  }, [editorTheme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'auto'].includes(mode)) {
      if (mode === 'auto') {
        localStorage.removeItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      } else {
        setTheme(mode);
      }
    }
  };

  const setEditorThemeMode = (theme) => {
    const validThemes = ['vs-dark', 'light', 'hc-black', 'vs'];
    if (validThemes.includes(theme)) {
      setEditorTheme(theme);
    }
  };

  const getEditorThemes = () => [
    { value: 'vs-dark', label: 'Dark', preview: 'bg-gray-900' },
    { value: 'light', label: 'Light', preview: 'bg-gray-100' },
    { value: 'hc-black', label: 'High Contrast', preview: 'bg-black' },
    { value: 'vs', label: 'Visual Studio', preview: 'bg-white' },
  ];

  const value = {
    theme,
    editorTheme,
    toggleTheme,
    setTheme: setThemeMode,
    setEditorTheme: setEditorThemeMode,
    getEditorThemes,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;