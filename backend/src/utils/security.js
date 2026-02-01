import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';

/**
 * Security Utilities
 * Provides various security functions for authentication, encryption, and validation
 */

// ============ PASSWORD HASHING ============

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password, saltRounds = 10) => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    if (!password || !hashedPassword) {
      return false;
    }
    
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

// ============ JWT TOKEN MANAGEMENT ============

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret key
 * @param {Object} options - JWT options (expiresIn, etc.)
 * @returns {string} - JWT token
 */
export const generateToken = (payload, secret = process.env.JWT_SECRET, options = {}) => {
  try {
    const defaultOptions = {
      expiresIn: '7d',
      ...options
    };
    
    return jwt.sign(payload, secret, defaultOptions);
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret key
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// ============ RANDOM STRING GENERATION ============

/**
 * Generate random string
 * @param {number} length - Length of string (default: 32)
 * @returns {string} - Random string
 */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} - Random token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('base64url');
};

/**
 * Generate numeric OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Numeric OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

// ============ ENCRYPTION & DECRYPTION ============

/**
 * Encrypt data using AES-256-CBC
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {Object} - Encrypted data with IV
 */
export const encryptData = (data, key = process.env.ENCRYPTION_KEY) => {
  try {
    if (!key) {
      throw new Error('Encryption key is required');
    }
    
    // Ensure key is 32 bytes for AES-256
    const encryptionKey = crypto.createHash('sha256').update(key).digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedData - Encrypted data
 * @param {string} iv - Initialization vector
 * @param {string} key - Encryption key
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData, iv, key = process.env.ENCRYPTION_KEY) => {
  try {
    if (!key) {
      throw new Error('Encryption key is required');
    }
    
    // Ensure key is 32 bytes for AES-256
    const encryptionKey = crypto.createHash('sha256').update(key).digest();
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
};

// ============ HASHING ============

/**
 * Create SHA-256 hash
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
export const createHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} - HMAC signature
 */
export const createHmacSignature = (data, secret = process.env.HMAC_SECRET) => {
  return createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - HMAC signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} - True if signature is valid
 */
export const verifyHmacSignature = (data, signature, secret = process.env.HMAC_SECRET) => {
  try {
    const expectedSignature = createHmacSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying HMAC signature:', error);
    return false;
  }
};

// ============ INPUT SANITIZATION ============

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize email
 * @param {string} email - Email address
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }
  
  return email.toLowerCase().trim();
};

/**
 * Escape HTML special characters
 * @param {string} html - HTML string
 * @returns {string} - Escaped HTML
 */
export const escapeHtml = (html) => {
  if (typeof html !== 'string') {
    return '';
  }
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return html.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
};

// ============ VALIDATION ============

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: [],
    strength: 'weak'
  };
  
  if (!password) {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }
  
  if (password.length < 8) {
    result.isValid = false;
    result.errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password should contain at least one special character');
  }
  
  // Calculate strength
  if (result.isValid && result.errors.length === 0) {
    result.strength = 'strong';
  } else if (result.isValid) {
    result.strength = 'medium';
  }
  
  return result;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} - Validation result
 */
export const validateUsername = (username) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  if (!username) {
    result.isValid = false;
    result.errors.push('Username is required');
    return result;
  }
  
  if (username.length < 3) {
    result.isValid = false;
    result.errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 20) {
    result.isValid = false;
    result.errors.push('Username must not exceed 20 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    result.isValid = false;
    result.errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }
  
  return result;
};

// ============ RATE LIMITING HELPERS ============

/**
 * Generate rate limit key
 * @param {Object} req - Express request object
 * @param {string} prefix - Key prefix
 * @returns {string} - Rate limit key
 */
export const generateRateLimitKey = (req, prefix = 'rl') => {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;
  return `${prefix}:${userId}:${ip}`;
};

// Default export with all functions
export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  decodeToken,
  generateRandomString,
  generateSecureToken,
  generateOTP,
  encryptData,
  decryptData,
  createHash,
  createHmacSignature,
  verifyHmacSignature,
  sanitizeString,
  sanitizeEmail,
  escapeHtml,
  validatePasswordStrength,
  isValidEmail,
  validateUsername,
  generateRateLimitKey
};