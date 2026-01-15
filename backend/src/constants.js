// ============ DATABASE CONSTANTS ============
export const DB_CONNECTION_TIMEOUT = 10000; // 10 seconds
export const MAX_POOL_SIZE = 10;
export const SOCKET_TIMEOUT = 45000;

// ============ USER ROLES ============
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPER_ADMIN: 'super_admin'
};

// ============ PROBLEM DIFFICULTY ============
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// ============ SUBMISSION VERDICTS ============
export const VERDICT = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong-answer',
  TIME_LIMIT_EXCEEDED: 'time-limit-exceeded',
  RUNTIME_ERROR: 'runtime-error',
  COMPILATION_ERROR: 'compilation-error',
  MEMORY_LIMIT_EXCEEDED: 'memory-limit-exceeded'
};

// ============ PROGRAMMING LANGUAGES ============
export const LANGUAGES = {
  PYTHON: 'python',
  CPP: 'cpp',
  JAVA: 'java',
  JAVASCRIPT: 'javascript',
  GO: 'go',
  RUST: 'rust'
};

// ============ HTTP STATUS CODES ============
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ============ PAGINATION ============
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// ============ SECURITY ============
export const SECURITY = {
  PASSWORD_MIN_LENGTH: 6,
  JWT_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// ============ DEFAULT SETTINGS ============
export const DEFAULT_PREFERENCES = {
  theme: 'auto',
  editorFontSize: 14,
  defaultLanguage: 'python'
};

// ============ FILE LIMITS ============
export const FILE_LIMITS = {
  MAX_CODE_SIZE: 10000, // 10KB
  MAX_FILE_UPLOAD: 10 * 1024 * 1024 // 10MB
};

// ============ RATE LIMITING ============
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// ============ PROBLEM TAGS ============
export const PROBLEM_TAGS = [
  'array', 'string', 'linked-list', 'tree', 'graph', 
  'dynamic-programming', 'backtracking', 'greedy', 
  'binary-search', 'two-pointers', 'stack', 'queue', 
  'heap', 'hash-table', 'math', 'bit-manipulation', 
  'sorting', 'recursion', 'divide-and-conquer'
];

// ============ TEST CASE DEFAULTS ============
export const TEST_CASE_DEFAULTS = {
  TIME_LIMIT: 2000, // 2 seconds
  MEMORY_LIMIT: 256 // 256 MB
};

// ============ RATE LIMIT MESSAGES ============
export const RATE_LIMIT_MESSAGES = {
  TOO_MANY_REQUESTS: 'Too many requests, please try again later.',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts, account temporarily locked.',
  TOO_MANY_SUBMISSIONS: 'Too many submissions, please slow down.',
  AUTH_LIMIT_EXCEEDED: 'Too many authentication attempts, please try again later.'
};