import mongoose from 'mongoose';

/**
 * Check if value is a valid MongoDB ObjectId
 */
export const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Check if value is a valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if value is a valid username
 */
export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};

/**
 * Check if value is a strong password
 * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 */
export const isStrongPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    return passwordRegex.test(password);
};

/**
 * Check if value is a valid URL
 */
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Check if value is a valid programming language
 */
export const isValidLanguage = (language) => {
    const validLanguages = ['python', 'cpp', 'java', 'javascript', 'go', 'rust'];
    return validLanguages.includes(language.toLowerCase());
};

/**
 * Check if value is a valid difficulty level
 */
export const isValidDifficulty = (difficulty) => {
    const validDifficulties = ['easy', 'medium', 'hard'];
    return validDifficulties.includes(difficulty.toLowerCase());
};

/**
 * Sanitize HTML input to prevent XSS
 */
export const sanitizeHtml = (html) => {
    if (!html) return '';
    
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/<iframe/gi, '&lt;iframe')
        .replace(/<\/iframe>/gi, '&lt;/iframe&gt;')
        .trim();
};

/**
 * Validate and sanitize code input
 */
export const sanitizeCode = (code, language) => {
    if (!code || typeof code !== 'string') return '';
    
    // Basic sanitization - remove null bytes and control characters
    let sanitized = code.replace(/\0/g, '')
                       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                       .trim();
    
    // Language-specific validation
    switch (language) {
        case 'python':
            // Check for dangerous imports in Python
            const dangerousPythonImports = [
                'import os', 'import sys', 'import subprocess',
                'from os import', 'from sys import', 'from subprocess import',
                '__import__', 'eval(', 'exec(', 'compile('
            ];
            
            dangerousPythonImports.forEach(imp => {
                if (sanitized.toLowerCase().includes(imp.toLowerCase())) {
                    throw new Error(`Disallowed import/function: ${imp}`);
                }
            });
            break;
            
        case 'cpp':
        case 'java':
            // Check for system calls
            const dangerousCalls = [
                'system(', 'Runtime.getRuntime().exec(', 'ProcessBuilder',
                'fork(', 'exec(', 'popen(', 'unistd.h', 'windows.h'
            ];
            
            dangerousCalls.forEach(call => {
                if (sanitized.toLowerCase().includes(call.toLowerCase())) {
                    throw new Error(`Disallowed system call: ${call}`);
                }
            });
            break;
            
        case 'javascript':
            // Check for dangerous JavaScript APIs
            const dangerousJS = [
                'eval(', 'Function(', 'setTimeout(', 'setInterval(',
                'execScript', 'document.write', 'window.open',
                'require(', 'import(', 'process.'
            ];
            
            dangerousJS.forEach(js => {
                if (sanitized.toLowerCase().includes(js.toLowerCase())) {
                    throw new Error(`Disallowed JavaScript: ${js}`);
                }
            });
            break;
    }
    
    return sanitized;
};

/**
 * Validate test cases format
 */
export const validateTestCases = (testCases) => {
    if (!Array.isArray(testCases)) {
        throw new Error('Test cases must be an array');
    }
    
    if (testCases.length === 0) {
        throw new Error('At least one test case is required');
    }
    
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        
        if (!tc.input || typeof tc.input !== 'string') {
            throw new Error(`Test case ${i + 1}: Input is required and must be a string`);
        }
        
        if (!tc.expectedOutput || typeof tc.expectedOutput !== 'string') {
            throw new Error(`Test case ${i + 1}: Expected output is required and must be a string`);
        }
        
        // Trim long test cases
        if (tc.input.length > 10000) {
            throw new Error(`Test case ${i + 1}: Input too large (max 10000 characters)`);
        }
        
        if (tc.expectedOutput.length > 10000) {
            throw new Error(`Test case ${i + 1}: Expected output too large (max 10000 characters)`);
        }
    }
    
    return true;
};

/**
 * Generate a random string (for tokens, IDs, etc.)
 */
export const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
};

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Calculate reading time for content
 */
export const calculateReadingTime = (text, wordsPerMinute = 200) => {
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return time;
};