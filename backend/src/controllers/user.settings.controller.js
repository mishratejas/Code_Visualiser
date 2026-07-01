/**
 * user.settings.controller.js — preferences, streak, and account lifecycle.
 *
 * M4 fix: split out of user.controller.js (811 lines mixing profile,
 * settings, and stats/activity concerns — audit finding M4). This file
 * covers account-level settings: preferences, streak state, and
 * deactivation — not identity (profile.controller.js) or read-only
 * stats/discovery (activity.controller.js).
 */
import User from '../models/user.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import streakService from '../services/streak.service.js';

// Update preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const { emailPreferences } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { emailPreferences: { ...req.user.emailPreferences, ...emailPreferences } } },
    { new: true }
  ).select('emailPreferences');

  res.status(200).json(
    ApiResponse.success({ emailPreferences: updatedUser.emailPreferences }, 'Preferences updated')
  );
});

// Get streak
export const getStreak = asyncHandler(async (req, res) => {
  const streak = await streakService.getStreak(req.user._id);
  
  res.status(200).json(
    ApiResponse.success({ streak }, 'Streak fetched successfully')
  );
});

// @desc    Update user preferences
// @route   PUT /api/v1/users/preferences
// @access  Private
export const updateUserPreferences = asyncHandler(async (req, res) => {
  const { 
    theme,
    editorTheme,
    editorFontSize,
    defaultLanguage,
    enableSyntaxHighlighting,
    showLineNumbers,
    tabSize,
    autoSave,
    notifications 
  } = req.body;
  
  const updateData = {};
  
  if (theme !== undefined) updateData['preferences.theme'] = theme;
  if (editorTheme !== undefined) updateData['preferences.editorTheme'] = editorTheme;
  if (editorFontSize !== undefined) updateData['preferences.editorFontSize'] = editorFontSize;
  if (defaultLanguage !== undefined) updateData['preferences.defaultLanguage'] = defaultLanguage;
  if (enableSyntaxHighlighting !== undefined) updateData['preferences.enableSyntaxHighlighting'] = enableSyntaxHighlighting;
  if (showLineNumbers !== undefined) updateData['preferences.showLineNumbers'] = showLineNumbers;
  if (tabSize !== undefined) updateData['preferences.tabSize'] = tabSize;
  if (autoSave !== undefined) updateData['preferences.autoSave'] = autoSave;
  
  if (notifications) {
    if (notifications.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
    if (notifications.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;
    if (notifications.submissionUpdates !== undefined) updateData['preferences.notifications.submissionUpdates'] = notifications.submissionUpdates;
    if (notifications.contestReminders !== undefined) updateData['preferences.notifications.contestReminders'] = notifications.contestReminders;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  ).select('-password -security.twoFactorSecret');
  
  res.status(200).json(
    ApiResponse.success({ user }, 'Preferences updated successfully')
  );
});

// @desc    Update user's streak
// @route   POST /api/v1/users/streak/update
// @access  Private
export const updateStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  await user.updateStreak();
  
  res.status(200).json(
    ApiResponse.success(
      { 
        streak: user.stats.streak,
        maxStreak: user.stats.maxStreak,
        lastActiveDate: user.stats.lastActiveDate
      },
      'Streak updated successfully'
    )
  );
});

// @desc    Delete user account
// @route   DELETE /api/v1/users/account
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  // Frontend sends { confirmation: username } — user types their username to confirm.
  const { confirmation, confirmPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (confirmation) {
    // Username-based confirmation (current UI)
    if (confirmation !== user.username) {
      throw ApiError.badRequest(`Please type your username "${user.username}" to confirm`);
    }
  } else if (confirmPassword) {
    // Legacy password-based confirmation
    const isPasswordValid = await user.comparePassword(confirmPassword);
    if (!isPasswordValid) throw ApiError.unauthorized('Incorrect password');
  } else {
    throw ApiError.badRequest('Please confirm by typing your username');
  }
  
  // Instead of deleting, deactivate the account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.username = `deleted_${Date.now()}_${user.username}`;
  await user.save();
  
  // Clear cookie
  res.clearCookie('token');
  
  res.status(200).json(
    ApiResponse.success(null, 'Account deactivated successfully')
  );
});