import { VALIDATION } from './constants';

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION.EMAIL.PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/**
 * Validate username
 */
export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < VALIDATION.USERNAME.MIN_LENGTH) {
    return `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`;
  }
  if (username.length > VALIDATION.USERNAME.MAX_LENGTH) {
    return `Username must be less than ${VALIDATION.USERNAME.MAX_LENGTH} characters`;
  }
  if (!VALIDATION.USERNAME.PATTERN.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return '';
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    return `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`;
  }
  if (password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    return `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`;
  }
  return '';
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

/**
 * Validate problem title
 */
export const validateProblemTitle = (title) => {
  if (!title) return 'Problem title is required';
  if (title.length < VALIDATION.PROBLEM_TITLE.MIN_LENGTH) {
    return `Title must be at least ${VALIDATION.PROBLEM_TITLE.MIN_LENGTH} characters`;
  }
  if (title.length > VALIDATION.PROBLEM_TITLE.MAX_LENGTH) {
    return `Title must be less than ${VALIDATION.PROBLEM_TITLE.MAX_LENGTH} characters`;
  }
  return '';
};

/**
 * Validate contest title
 */
export const validateContestTitle = (title) => {
  if (!title) return 'Contest title is required';
  if (title.length < VALIDATION.CONTEST_TITLE.MIN_LENGTH) {
    return `Title must be at least ${VALIDATION.CONTEST_TITLE.MIN_LENGTH} characters`;
  }
  if (title.length > VALIDATION.CONTEST_TITLE.MAX_LENGTH) {
    return `Title must be less than ${VALIDATION.CONTEST_TITLE.MAX_LENGTH} characters`;
  }
  return '';
};

/**
 * Validate time limit
 */
export const validateTimeLimit = (timeLimit) => {
  if (!timeLimit && timeLimit !== 0) return 'Time limit is required';
  const num = Number(timeLimit);
  if (isNaN(num)) return 'Time limit must be a number';
  if (num < 100) return 'Time limit must be at least 100ms';
  if (num > 10000) return 'Time limit must be less than 10000ms';
  return '';
};

/**
 * Validate memory limit
 */
export const validateMemoryLimit = (memoryLimit) => {
  if (!memoryLimit && memoryLimit !== 0) return 'Memory limit is required';
  const num = Number(memoryLimit);
  if (isNaN(num)) return 'Memory limit must be a number';
  if (num < 1) return 'Memory limit must be at least 1MB';
  if (num > 1024) return 'Memory limit must be less than 1024MB';
  return '';
};

/**
 * Validate code submission
 */
export const validateCode = (code) => {
  if (!code || code.trim().length === 0) {
    return 'Code cannot be empty';
  }
  if (code.trim().length < 10) {
    return 'Code is too short';
  }
  return '';
};

/**
 * Validate test cases
 */
export const validateTestCases = (testCases) => {
  if (!testCases || testCases.length === 0) {
    return 'At least one test case is required';
  }
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    if (!testCase.input || testCase.input.trim().length === 0) {
      return `Test case ${i + 1}: Input is required`;
    }
    if (!testCase.expectedOutput || testCase.expectedOutput.trim().length === 0) {
      return `Test case ${i + 1}: Expected output is required`;
    }
  }
  
  return '';
};

/**
 * Validate tags
 */
export const validateTags = (tags) => {
  if (!tags || tags.length === 0) {
    return 'At least one tag is required';
  }
  if (tags.length > 10) {
    return 'Maximum 10 tags allowed';
  }
  return '';
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
  if (!url) return '';
  
  try {
    new URL(url);
    return '';
  } catch (error) {
    return 'Please enter a valid URL';
  }
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate) return 'Start date is required';
  if (!endDate) return 'End date is required';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start < now) return 'Start date must be in the future';
  if (end <= start) return 'End date must be after start date';
  
  return '';
};

/**
 * Validate duration (in minutes)
 */
export const validateDuration = (duration) => {
  if (!duration && duration !== 0) return 'Duration is required';
  const num = Number(duration);
  if (isNaN(num)) return 'Duration must be a number';
  if (num < 1) return 'Duration must be at least 1 minute';
  if (num > 1440) return 'Duration must be less than 24 hours (1440 minutes)';
  return '';
};

/**
 * Validate number range
 */
export const validateNumberRange = (value, min, max, fieldName = 'Value') => {
  if (!value && value !== 0) return `${fieldName} is required`;
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  if (num > max) return `${fieldName} must be less than ${max}`;
  return '';
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value && value !== 0 && value !== false) {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return '';
};

/**
 * Validate array minimum length
 */
export const validateMinArrayLength = (array, minLength, fieldName) => {
  if (!array || array.length < minLength) {
    return `${fieldName} must have at least ${minLength} item(s)`;
  }
  return '';
};

/**
 * Validate array maximum length
 */
export const validateMaxArrayLength = (array, maxLength, fieldName) => {
  if (array && array.length > maxLength) {
    return `${fieldName} must have at most ${maxLength} item(s)`;
  }
  return '';
};

/**
 * Generic form validator
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach((field) => {
    const rules = validationRules[field];
    
    for (const rule of rules) {
      const error = rule(formData[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  
  return errors;
};

/**
 * Check if form has errors
 */
export const hasFormErrors = (errors) => {
  return Object.values(errors).some(error => error !== '');
};