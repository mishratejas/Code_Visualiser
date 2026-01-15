import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import config from '../config/index.js';

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      username: user.username,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email or username already exists');
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  // Generate token
  const token = generateToken(user);

  // Remove password from response
  user.password = undefined;

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json(
    ApiResponse.created(
      { user, token },
      'User registered successfully'
    )
  );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }

  // Find user by email (including password for comparison)
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password matches
  if (!user || !(await user.comparePassword(password))) {
    // Increment failed login attempts
    if (user) {
      await user.incrementLoginAttempts();
    }
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw ApiError.forbidden('Account is temporarily locked due to too many failed login attempts');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate token
  const token = generateToken(user);

  // Remove password from response
  user.password = undefined;

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json(
    ApiResponse.success(
      { user, token },
      'Login successful'
    )
  );
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json(
    ApiResponse.success(null, 'Logged out successfully')
  );
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.status(200).json(
    ApiResponse.success({ user }, 'User profile fetched successfully')
  );
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/update-profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, github, linkedin, website } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'profile.name': name,
      'profile.bio': bio,
      'profile.github': github,
      'profile.linkedin': linkedin,
      'profile.website': website
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json(
    ApiResponse.success({ user }, 'Profile updated successfully')
  );
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/v1/auth/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, editorFontSize, defaultLanguage } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'preferences.theme': theme,
      'preferences.editorFontSize': editorFontSize,
      'preferences.defaultLanguage': defaultLanguage
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json(
    ApiResponse.success({ user }, 'Preferences updated successfully')
  );
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  user.security.lastPasswordChange = new Date();
  await user.save();

  // Generate new token
  const token = generateToken(user);

  res.status(200).json(
    ApiResponse.success(
      { token },
      'Password changed successfully'
    )
  );
});

/**
 * @desc    Forgot password (placeholder - needs email service)
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal that user doesn't exist for security
    return res.status(200).json(
      ApiResponse.success(null, 'If your email exists, you will receive a reset link')
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // For now, just log the token (in production, send email)
  console.log('Password reset token:', resetToken);

  res.status(200).json(
    ApiResponse.success(
      { resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined },
      'Password reset email sent'
    )
  );
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw ApiError.badRequest('Token is invalid or has expired');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.security.lastPasswordChange = new Date();
  await user.save();

  // Generate new token for auto-login
  const newToken = generateToken(user);

  res.status(200).json(
    ApiResponse.success(
      { token: newToken },
      'Password reset successfully'
    )
  );
});

/**
 * @desc    Resend verification email (placeholder)
 * @route   POST /api/v1/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal that user doesn't exist
    return res.status(200).json(
      ApiResponse.success(null, 'If your email exists, you will receive a verification email')
    );
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // In production, send verification email
  console.log('Verification email would be sent to:', email);

  res.status(200).json(
    ApiResponse.success(null, 'Verification email sent')
  );
});

/**
 * @desc    Verify email (placeholder)
 * @route   POST /api/v1/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // In a real app, you would validate the token
  // For now, just simulate verification
  console.log('Email verification token:', token);

  res.status(200).json(
    ApiResponse.success(null, 'Email verified successfully')
  );
});

// Note: updateAvatar function removed since we don't have multer setup yet
// Add it later when you implement file uploads