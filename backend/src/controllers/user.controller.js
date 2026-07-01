/**
 * user.controller.js — re-export barrel.
 *
 * M4 fix: the original 811-line file mixed profile, settings, and
 * stats/activity concerns in one place (audit finding M4). The logic now
 * lives in three focused files:
 *   - user.profile.controller.js  → identity: avatar, profile fields
 *   - user.settings.controller.js → preferences, streak, account deactivation
 *   - user.activity.controller.js → stats, activity, bookmarks, leaderboard, search
 *
 * This barrel exists so nothing else in the codebase has to change — routes
 * and any other importer keep using `from '../controllers/user.controller.js'`
 * exactly as before. New code should import directly from the specific file
 * above instead of through this barrel.
 */
export {
  uploadAvatar,
  deleteAvatar,
  getUserProfile,
  updateUserProfile,
} from './user.profile.controller.js';

export {
  updatePreferences,
  getStreak,
  updateUserPreferences,
  updateStreak,
  deleteAccount,
} from './user.settings.controller.js';

export {
  getUserStats,
  getUserActivity,
  getSolvedProblems,
  getAttemptedProblems,
  getBookmarks,
  toggleBookmark,
  getLeaderboard,
  searchUsers,
} from './user.activity.controller.js';