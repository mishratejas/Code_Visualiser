import { validationResult, body, param, query } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Validation result handler
export const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            return next();
        }
        
        // Format validation errors
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value,
            location: err.location
        }));
        
        throw ApiError.validationError('Validation failed', formattedErrors);
    };
};

// Common validation rules
export const AuthValidation = {
    register: validate([
        body('username')
            .trim()
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    ]),
    
    login: validate([
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address'),
        
        body('password')
            .notEmpty().withMessage('Password is required')
    ])
};

export const ProblemValidation = {
    create: validate([
        body('title')
            .trim()
            .notEmpty().withMessage('Title is required')
            .isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
        
        body('description')
            .trim()
            .notEmpty().withMessage('Description is required')
            .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
        
        body('difficulty')
            .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
        
        body('tags')
            .optional()
            .isArray().withMessage('Tags must be an array'),
        
        body('testCases')
            .isArray({ min: 1 }).withMessage('At least one test case is required'),
        
        body('testCases.*.input')
            .notEmpty().withMessage('Test case input is required'),
        
        body('testCases.*.expectedOutput')
            .notEmpty().withMessage('Test case expected output is required'),
        
        body('constraints.timeLimit')
            .optional()
            .isInt({ min: 100, max: 10000 }).withMessage('Time limit must be between 100ms and 10s'),
        
        body('constraints.memoryLimit')
            .optional()
            .isInt({ min: 16, max: 1024 }).withMessage('Memory limit must be between 16MB and 1GB')
    ]),
    
    update: validate([
        param('id')
            .isMongoId().withMessage('Invalid problem ID format'),
        
        body('title')
            .optional()
            .trim()
            .isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
        
        body('difficulty')
            .optional()
            .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard')
    ]),
    
    idParam: validate([
        param('id')
            .isMongoId().withMessage('Invalid problem ID format')
    ]),
    
    slugParam: validate([
        param('slug')
            .notEmpty().withMessage('Slug is required')
            .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
    ])
};

export const SubmissionValidation = {
    submit: validate([
        body('problemId')
            .notEmpty().withMessage('Problem ID is required')
            .isMongoId().withMessage('Invalid problem ID format'),
        
        body('language')
            .isIn(['python', 'cpp', 'java', 'javascript', 'go', 'rust'])
            .withMessage('Invalid programming language'),
        
        body('code')
            .trim()
            .notEmpty().withMessage('Code is required')
            .isLength({ max: 10000 }).withMessage('Code cannot exceed 10000 characters')
    ]),
    
    list: validate([
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer')
            .toInt(),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
            .toInt(),
        
        query('verdict')
            .optional()
            .isIn(['pending', 'accepted', 'wrong-answer', 'time-limit-exceeded', 
                   'runtime-error', 'compilation-error', 'memory-limit-exceeded'])
            .withMessage('Invalid verdict'),
        
        query('problemId')
            .optional()
            .isMongoId().withMessage('Invalid problem ID format')
    ])
};

export const UserValidation = {
    updateProfile: validate([
        body('name')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
        
        body('bio')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
        
        body('github')
            .optional()
            .isURL().withMessage('Please provide a valid GitHub URL'),
        
        body('linkedin')
            .optional()
            .isURL().withMessage('Please provide a valid LinkedIn URL'),
        
        body('website')
            .optional()
            .isURL().withMessage('Please provide a valid website URL')
    ]),
    
    updatePreferences: validate([
        body('theme')
            .optional()
            .isIn(['light', 'dark', 'auto']).withMessage('Theme must be light, dark, or auto'),
        
        body('editorFontSize')
            .optional()
            .isInt({ min: 10, max: 30 }).withMessage('Font size must be between 10 and 30'),
        
        body('defaultLanguage')
            .optional()
            .isIn(['python', 'cpp', 'java', 'javascript', 'go', 'rust'])
            .withMessage('Invalid programming language')
    ])
};

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove script tags and excessive whitespace
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .trim();
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        }
    };
    
    ['body', 'params', 'query'].forEach(location => {
        if (req[location]) {
            sanitize(req[location]);
        }
    });
    
    next();
};