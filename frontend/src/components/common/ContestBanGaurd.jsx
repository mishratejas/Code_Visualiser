import React from 'react';
import { FiSlash } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Blocks ONLY contest pages (not the whole app — a banned user can still use
// the rest of the platform normally) while security.contestBannedUntil is in
// the future. That field is already included in the /auth/me response the
// AuthContext user object is built from, so no extra fetch is needed here.
const ContestBanGuard = ({ children }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const bannedUntil = user?.security?.contestBannedUntil;
  const isBanned = !!bannedUntil && new Date(bannedUntil) > new Date();

  if (!isBanned) return children;

  const formatted = new Date(bannedUntil).toLocaleDateString('en', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center text-center px-6 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
        <FiSlash className="h-8 w-8 text-red-500" />
      </div>
      <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Contest access restricted
      </h2>
      <p className={`text-sm max-w-md ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Your account is temporarily restricted from contests following a confirmed plagiarism review.
        Access will be restored on <strong>{formatted}</strong>.
      </p>
      <p className={`text-xs max-w-md mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        The rest of the platform — practice problems, learning path, groups — is unaffected.
      </p>
    </div>
  );
};

export default ContestBanGuard;