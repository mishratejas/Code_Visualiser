import React, { useState, useEffect } from 'react';
import { 
  FiSave, FiUser, FiBell, FiLock, FiMail, FiShield, 
  FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiTrash2,
  FiCode, FiSun, FiMoon, FiGlobe, FiUpload
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Loader from '../components/common/Loader';
import ThemeToggle from '../components/common/ThemeToggle';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [profile, setProfile] = useState({
    username: '', email: '', name: '', bio: '', country: '', university: '', website: '', github: '', linkedin: '',
  });

  const [notifications, setNotifications] = useState({
    submissions: true, achievements: true, contests: true, newsletter: false, emailDigest: false,
  });

  const [preferences, setPreferences] = useState({
    defaultLanguage: 'python', editorFontSize: 14, tabSize: 4, theme: 'dark',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || '',
        bio: user.profile?.bio || '',
        country: user.profile?.country || '',
        university: user.profile?.university || '',
        website: user.profile?.website || '',
        github: user.profile?.github || '',
        linkedin: user.profile?.linkedin || '',
      });
      setNotifications(user.emailPreferences || notifications);
      setPreferences({
        defaultLanguage: user.preferences?.defaultLanguage || 'python',
        editorFontSize: user.preferences?.editorFontSize || 14,
        tabSize: user.preferences?.tabSize || 4,
        theme: isDark ? 'dark' : 'light',
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/users/me/profile', {
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        country: profile.country,
        university: profile.university,
        website: profile.website,
        github: profile.github,
        linkedin: profile.linkedin,
      });
      updateUser(response.data?.data?.user || response.data?.user || { ...user, ...profile });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch('/users/preferences', { emailPreferences: notifications });
      updateUser({ ...user, emailPreferences: notifications });
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/auth/preferences', { 
        defaultLanguage: preferences.defaultLanguage,
        editorFontSize: preferences.editorFontSize,
      });
      updateUser({ ...user, preferences });
      toast.success('Editor preferences saved!');
    } catch {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      toast.error(`Please type "${user?.username}" to confirm`);
      return;
    }
    try {
      await api.delete('/users/account', { data: { confirmation: deleteConfirm } });
      logout();
    } catch {
      toast.error('Failed to delete account. Contact support.');
    }
  };

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputClass = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-rose-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-rose-500';
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const dividerClass = isDark ? 'divide-gray-800' : 'divide-gray-100';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell className="h-4 w-4" /> },
    { id: 'preferences', label: 'Editor', icon: <FiCode className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <FiShield className="h-4 w-4" /> },
    { id: 'danger', label: 'Danger Zone', icon: <FiTrash2 className="h-4 w-4" /> },
  ];

  const InputField = ({ label, name, value, onChange, type = 'text', placeholder = '', hint = '' }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all`}
      />
      {hint && <p className={`mt-1.5 text-xs ${subTextClass}`}>{hint}</p>}
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className={`text-sm font-medium ${textClass}`}>{label}</p>
        {desc && <p className={`text-xs ${subTextClass} mt-0.5`}>{desc}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-rose-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Settings</h1>
            <p className={`text-sm ${subTextClass}`}>Manage your account and preferences</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className={`${cardClass} border rounded-2xl p-2 h-fit md:w-52 flex-shrink-0`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-rose-500 to-red-500 text-white`
                    : `${subTextClass} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} hover:${textClass}`
                } ${tab.id === 'danger' ? 'text-red-500 hover:bg-red-500/10' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} className={`${cardClass} border rounded-2xl p-6 space-y-5`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  Profile Information
                </h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${textClass}`}>{profile.username}</p>
                    <p className={`text-sm ${subTextClass}`}>{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Username" name="username" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} placeholder="Your username" />
                  <InputField label="Display Name" name="name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name" />
                </div>

                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className={`w-full px-4 py-2.5 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none transition-all`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Country" name="country" value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} placeholder="e.g. India" />
                  <InputField label="University" name="university" value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })} placeholder="Your university" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField label="GitHub" name="github" value={profile.github} onChange={e => setProfile({ ...profile, github: e.target.value })} placeholder="github.com/username" />
                  <InputField label="LinkedIn" name="linkedin" value={profile.linkedin} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} placeholder="linkedin.com/in/..." />
                  <InputField label="Website" name="website" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://yoursite.com" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <FiSave className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationsSave} className={`${cardClass} border rounded-2xl p-6`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} mb-4`}>
                  Email Notifications
                </h2>
                <div className={`divide-y ${dividerClass}`}>
                  <Toggle label="Submission Updates" desc="Get notified when your code is judged" checked={notifications.submissions} onChange={() => setNotifications(n => ({ ...n, submissions: !n.submissions }))} />
                  <Toggle label="Achievement Unlocked" desc="Celebrate your milestones" checked={notifications.achievements} onChange={() => setNotifications(n => ({ ...n, achievements: !n.achievements }))} />
                  <Toggle label="Contest Reminders" desc="Reminders before contests start" checked={notifications.contests} onChange={() => setNotifications(n => ({ ...n, contests: !n.contests }))} />
                  <Toggle label="Weekly Digest" desc="Weekly summary of your activity" checked={notifications.emailDigest} onChange={() => setNotifications(n => ({ ...n, emailDigest: !n.emailDigest }))} />
                  <Toggle label="Newsletter" desc="Tips, new features, and updates" checked={notifications.newsletter} onChange={() => setNotifications(n => ({ ...n, newsletter: !n.newsletter }))} />
                </div>
                <button type="submit" disabled={loading} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                  <FiSave className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}

            {/* Editor/Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handlePreferencesSave} className={`${cardClass} border rounded-2xl p-6 space-y-5`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  Editor Preferences
                </h2>
                <div>
                  <label className={labelClass}>Default Language</label>
                  <select
                    value={preferences.defaultLanguage}
                    onChange={e => setPreferences({ ...preferences, defaultLanguage: e.target.value })}
                    className={`w-full px-4 py-2.5 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
                  >
                    {['python', 'cpp', 'java', 'javascript'].map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Font Size: {preferences.editorFontSize}px</label>
                  <input
                    type="range" min="10" max="24"
                    value={preferences.editorFontSize}
                    onChange={e => setPreferences({ ...preferences, editorFontSize: parseInt(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                  <div className={`flex justify-between text-xs ${subTextClass} mt-1`}>
                    <span>10px</span><span>24px</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Theme</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { if (isDark) toggleTheme(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${!isDark ? 'border-rose-500 bg-rose-500/10 text-rose-500' : `border-gray-700 ${subTextClass}`}`}>
                      <FiSun className="h-4 w-4" /> Light
                    </button>
                    <button type="button" onClick={() => { if (!isDark) toggleTheme(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'border-rose-500 bg-rose-500/10 text-rose-500' : `border-gray-300 ${subTextClass}`}`}>
                      <FiMoon className="h-4 w-4" /> Dark
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                  <FiSave className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className={`${cardClass} border rounded-2xl p-6 space-y-4`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  Change Password
                </h2>
                <div className="relative">
                  <label className={labelClass}>Current Password</label>
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className={`w-full px-4 py-2.5 pr-10 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
                  />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className={`absolute right-3 bottom-3 ${subTextClass}`}>
                    {showCurrentPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <label className={labelClass}>New Password</label>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                    className={`w-full px-4 py-2.5 pr-10 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className={`absolute right-3 bottom-3 ${subTextClass}`}>
                    {showNewPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <label className={labelClass}>Confirm New Password</label>
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className={`w-full px-4 py-2.5 pr-10 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className={`absolute right-3 bottom-3 ${subTextClass}`}>
                    {showConfirmPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
                {passwords.newPassword && passwords.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1.5 ${passwords.newPassword === passwords.confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                    {passwords.newPassword === passwords.confirmPassword ? <FiCheck /> : <FiAlertCircle />}
                    {passwords.newPassword === passwords.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
                <button type="submit" disabled={loading || !passwords.currentPassword || !passwords.newPassword} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
                  <FiLock className="h-4 w-4" />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className={`${cardClass} border-2 border-red-500/30 rounded-2xl p-6 space-y-4`}>
                <h2 className="text-lg font-bold text-red-500 pb-4 border-b border-red-500/20">
                  ⚠️ Danger Zone
                </h2>
                <div className={`${isDark ? 'bg-red-500/5' : 'bg-red-50'} rounded-xl p-4`}>
                  <h3 className={`font-semibold ${textClass} mb-1`}>Delete Account</h3>
                  <p className={`text-sm ${subTextClass} mb-4`}>
                    This action is <strong>irreversible</strong>. All your data including submissions, achievements, and profile will be permanently deleted.
                  </p>
                  <p className={`text-sm ${subTextClass} mb-2`}>
                    To confirm, type your username: <strong className={textClass}>{user?.username}</strong>
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder={`Type "${user?.username}" to confirm`}
                    className={`w-full px-4 py-2.5 ${isDark ? 'bg-gray-800 border-red-500/30 text-white' : 'bg-white border-red-300 text-gray-900'} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 mb-3`}
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== user?.username}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;