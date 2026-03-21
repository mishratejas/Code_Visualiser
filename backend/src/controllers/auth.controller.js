import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import Notification from '../models/notification.models.js';
import config from '../config/index.js';

/** HTML body for reset email */
const buildResetEmailHtml = (resetUrl) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0;border-radius:8px;">
    <h2 style="color:#f43f5e;margin-bottom:16px;">Reset Your Password</h2>
    <p style="margin-bottom:16px;">Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#f43f5e,#ef4444);color:white;text-decoration:none;border-radius:6px;font-weight:bold;margin-bottom:20px;">Reset Password</a>
    <p style="font-size:13px;color:#94a3b8;">If you didn't request this, ignore this email.</p>
    <p style="font-size:12px;color:#64748b;margin-top:20px;">Or copy:<br/>${resetUrl}</p>
  </div>
`;

const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const mailBody = {
    from: `"CodeForge" <${process.env.EMAIL_FROM || 'noreply@codeforge.com'}>`,
    to: toEmail, subject: 'Password Reset Request - CodeForge',
    html: buildResetEmailHtml(resetUrl),
  };
  const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '';
  const hasRealSmtp = process.env.EMAIL_HOST && process.env.EMAIL_USER && emailPass
    && !process.env.EMAIL_USER.includes('ethereal')
    && !emailPass.includes('ethereal-password');
  if (hasRealSmtp) {
    try {
      const t = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT)||587,
        secure: false, auth: { user: process.env.EMAIL_USER, pass: emailPass },
      });
      await t.sendMail(mailBody);
      return { ok: true };
    } catch(err) { console.error('SMTP error:', err.message); return { ok: false }; }
  }
  try {
    const acct = await nodemailer.createTestAccount();
    const t = nodemailer.createTransport({
      host:'smtp.ethereal.email', port:587, secure:false,
      auth:{ user:acct.user, pass:acct.pass },
    });
    const info = await t.sendMail(mailBody);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n📧  Reset email (Ethereal dev preview):', previewUrl);
    console.log('   Reset link:', resetUrl, '\n');
    return { ok: true, previewUrl };
  } catch(err) { console.error('Ethereal fallback error:', err.message); return { ok: false }; }
};

/**
 * Generate JWT Token
 * @param {boolean} rememberMe - 30d expiry if true, otherwise 1h
 */
const generateToken = (user, rememberMe = false) => {
  const expiry = rememberMe ? '30d' : (process.env.JWT_EXPIRE || '1h');
  return jwt.sign(
    { userId: user._id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: expiry }
  );
};

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email or username already exists');
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user);
  user.password = undefined;

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.status(201).json(
    ApiResponse.created({ user, token }, 'User registered successfully')
  );
});

/**
 * @desc    Register as Organizer (with special invite code)
 * @route   POST /api/v1/auth/register/organizer
 * @access  Public (requires invite code)
 */
export const registerOrganizer = asyncHandler(async (req, res) => {
  const { username, email, password, organizationName, inviteCode } = req.body;

  // Validate invite code
  const validInviteCode = process.env.ORGANIZER_INVITE_CODE || 'ORGANIZER2024';
  if (inviteCode !== validInviteCode) {
    throw ApiError.forbidden('Invalid invite code for organizer registration');
  }

  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email or username already exists');
  }

  const user = await User.create({
    username,
    email,
    password,
    role: 'admin',
    'profile.name': organizationName || username,
    isEmailVerified: true,
  });

  const token = generateToken(user);
  user.password = undefined;

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.status(201).json(
    ApiResponse.created({ user, token }, 'Organizer account created successfully')
  );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  if (!email || !password) throw ApiError.badRequest('Please provide email and password');

  const user = await User.findOne({ email }).select('+password');

  // 1. Check if user exists first
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 2. Check if account is locked BEFORE verifying password or incrementing attempts
  //    This prevents further incrementing attempts on an already-locked account
  //    and gives the correct error message immediately.
  if (user.isLocked()) {
    throw ApiError.forbidden('Account is temporarily locked due to too many failed login attempts');
  }

  // 3. Now verify the password
  if (!(await user.comparePassword(password))) {
    await user.incrementLoginAttempts();
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 4. Successful login — reset the counter
  await user.resetLoginAttempts();

  // Create a welcome notification on very first login
  try {
    const notifCount = await Notification.countDocuments({ user: user._id });
    if (notifCount === 0) {
      await Notification.create({
        user: user._id, type: 'system',
        title: 'Welcome to CodeForge!',
        message: 'Start solving problems, join contests, and track your progress. Happy coding!',
        read: false,
      });
    }
  } catch { /* non-critical */ }

  const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
  const token = generateToken(user, rememberMe);
  user.password = undefined;

  res.cookie('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: cookieMaxAge,
  });

  res.status(200).json(ApiResponse.success({ user, token, rememberMe }, 'Login successful'));
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
 */
export const googleAuthCallback = asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { 
      userId: req.user._id, 
      email: req.user.email,
      role: req.user.role,
      username: req.user.username 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  const userData = {
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    isEmailVerified: req.user.isEmailVerified
  };

  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  // Use query params (not hash) so the page can read them cleanly
  const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
  res.redirect(302, `${frontendUrl}/auth/google-success?token=${token}&user=${userDataEncoded}`);
});

/**
 * @desc    Logout user
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

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword;
  user.security.lastPasswordChange = new Date();
  await user.save();

  const token = generateToken(user);

  res.status(200).json(
    ApiResponse.success({ token }, 'Password changed successfully')
  );
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(200).json(
      ApiResponse.success(null, 'If your email exists, you will receive a reset link')
    );
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password'}/${resetToken}`;
  const { ok, previewUrl } = await sendPasswordResetEmail(email, resetUrl);

  res.status(200).json(ApiResponse.success(
    process.env.NODE_ENV === 'development'
      ? { ...(previewUrl ? { emailPreviewUrl: previewUrl } : {}), ...(!ok ? { resetUrl, note: 'Email failed - use this link' } : {}) }
      : null,
    'If your email is registered, a password reset link has been sent'
  ));
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

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

  const newToken = generateToken(user);

  res.status(200).json(
    ApiResponse.success({ token: newToken }, 'Password reset successfully')
  );
});

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(200).json(
      ApiResponse.success(null, 'If your email exists, you will receive a verification email')
    );
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  console.log('Verification email would be sent to:', email);

  res.status(200).json(
    ApiResponse.success(null, 'Verification email sent')
  );
});

/**
 * @desc    Verify email
 * @route   POST /api/v1/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  console.log('Email verification token:', token);

  res.status(200).json(
    ApiResponse.success(null, 'Email verified successfully')
  );
});