import React, { useState, useEffect, useRef } from 'react';
import {
  FiSave, FiUser, FiBell, FiLock, FiShield,
  FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiTrash2,
  FiCode, FiSun, FiMoon, FiCamera, FiX,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
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
  const fileInputRef = useRef(null);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [profile, setProfile] = useState({
    username: '', name: '', bio: '', country: '', university: '', website: '', github: '', linkedin: '',
  });

  const [notifications, setNotifications] = useState({
    submissions: true, achievements: true, contests: true, newsletter: false, emailDigest: false,
  });

  const [preferences, setPreferences] = useState({
    defaultLanguage: 'python', editorFontSize: 14,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username:   user.username || '',
        name:       user.profile?.name || '',
        bio:        user.profile?.bio || '',
        country:    user.profile?.country || '',
        university: user.profile?.university || '',
        website:    user.profile?.website || '',
        github:     user.profile?.github || '',
        linkedin:   user.profile?.linkedin || '',
      });
      setNotifications(prev => ({ ...prev, ...(user.emailPreferences || {}) }));
      setPreferences({
        defaultLanguage: user.preferences?.defaultLanguage || 'python',
        editorFontSize:  user.preferences?.editorFontSize  || 14,
      });
    }
  }, [user]);

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;
    const av = user?.avatar || user?.profile?.avatar;
    if (av) return av;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=f43f5e&color=fff&size=128`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      setAvatarLoading(true);
      const form = new FormData();
      form.append('avatar', avatarFile);
      const res = await api.post('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res?.data?.avatarUrl || res?.avatarUrl;
      if (newUrl) updateUser({ ...user, avatar: newUrl, profile: { ...(user?.profile || {}), avatar: newUrl } });
      setAvatarFile(null);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      setAvatarLoading(true);
      await api.delete('/users/avatar');
      setAvatarFile(null);
      setAvatarPreview(null);
      updateUser({ ...user, avatar: null, profile: { ...(user?.profile || {}), avatar: null } });
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Profile save ─────────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Upload avatar first if pending
      if (avatarFile) await handleAvatarUpload();

      const res = await api.put('/users/me/profile', {
        username:   profile.username,
        name:       profile.name,
        bio:        profile.bio,
        country:    profile.country,
        university: profile.university,
        website:    profile.website,
        github:     profile.github,
        linkedin:   profile.linkedin,
      });
      updateUser(res?.data?.user || res?.user || { ...user, ...profile });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ── Notifications save ───────────────────────────────────────────────────────
  const handleNotificationsSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch('/users/preferences', { emailPreferences: notifications });
      updateUser({ ...user, emailPreferences: notifications });
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  // ── Editor preferences save ──────────────────────────────────────────────────
  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/auth/preferences', {
        defaultLanguage: preferences.defaultLanguage,
        editorFontSize:  preferences.editorFontSize,
      });
      updateUser({ ...user, preferences: { ...user?.preferences, ...preferences } });
      toast.success('Editor preferences saved!');
    } catch {
      toast.error('Failed to save editor preferences');
    } finally {
      setLoading(false);
    }
  };

  // ── Password change ──────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters'); return;
    }
    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      toast.error(`Please type "${user?.username}" to confirm`); return;
    }
    try {
      await api.delete('/users/account', { data: { confirmation: deleteConfirm } });
      logout();
    } catch {
      toast.error('Failed to delete account. Contact support.');
    }
  };

  // ── Theme classes ────────────────────────────────────────────────────────────
  const bgClass    = isDark ? 'bg-gray-950'                : 'bg-gray-50';
  const cardClass  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass  = isDark ? 'text-white'                 : 'text-gray-900';
  const subText    = isDark ? 'text-gray-400'              : 'text-gray-600';
  const inputClass = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-rose-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-rose-500';
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const dividerClass = isDark ? 'divide-gray-800' : 'divide-gray-100';

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: <FiUser className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell className="h-4 w-4" /> },
    { id: 'preferences',   label: 'Editor',        icon: <FiCode className="h-4 w-4" /> },
    { id: 'security',      label: 'Security',      icon: <FiShield className="h-4 w-4" /> },
    { id: 'danger',        label: 'Danger Zone',   icon: <FiTrash2 className="h-4 w-4" /> },
  ];

  const InputField = ({ label, name, value, onChange, type = 'text', placeholder = '', hint = '' }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-4 py-2.5 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all`}
      />
      {hint && <p className={`mt-1.5 text-xs ${subText}`}>{hint}</p>}
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className={`text-sm font-medium ${textClass}`}>{label}</p>
        {desc && <p className={`text-xs ${subText} mt-0.5`}>{desc}</p>}
      </div>
      <button
        type="button" onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-rose-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const SaveBtn = ({ label = 'Save Changes', loadLabel = 'Saving...', disabled = false, icon = <FiSave className="h-4 w-4" /> }) => (
    <button
      type="submit" disabled={loading || disabled}
      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
    >
      {icon} {loading ? loadLabel : label}
    </button>
  );

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Settings</h1>
            <p className={`text-sm ${subText}`}>Manage your account and preferences</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className={`${cardClass} border rounded-2xl p-2 h-fit md:w-52 flex-shrink-0`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                    : tab.id === 'danger'
                      ? `text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`
                      : `${subText} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} className={`${cardClass} border rounded-2xl p-6 space-y-5`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  Profile Information
                </h2>

                {/* Avatar section */}
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarSrc()}
                      alt="Profile photo"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-rose-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 p-1.5 bg-rose-500 rounded-xl text-white shadow-lg hover:bg-rose-600 transition-colors"
                      title="Change photo"
                    >
                      <FiCamera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className={`font-semibold ${textClass}`}>{profile.username || user?.username}</p>
                    <p className={`text-xs ${subText}`}>{user?.email}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:border-rose-500 hover:text-rose-400' : 'border-gray-300 text-gray-600 hover:border-rose-400 hover:text-rose-500'}`}
                      >
                        {avatarFile ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={handleAvatarUpload}
                          disabled={avatarLoading}
                          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                        >
                          {avatarLoading ? 'Uploading...' : 'Save Photo'}
                        </button>
                      )}
                      {(user?.avatar || user?.profile?.avatar) && !avatarFile && (
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          disabled={avatarLoading}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400' : 'border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500'}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className={`text-xs ${subText}`}>JPG, PNG or GIF — max 5 MB</p>
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
                  <InputField label="GitHub" name="github" value={profile.github} onChange={e => setProfile({ ...profile, github: e.target.value })} placeholder="github username" />
                  <InputField label="LinkedIn" name="linkedin" value={profile.linkedin} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} placeholder="linkedin.com/in/..." />
                  <InputField label="Website" name="website" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://yoursite.com" />
                </div>

                <SaveBtn />
              </form>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationsSave} className={`${cardClass} border rounded-2xl p-6`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} mb-4`}>
                  Email Notifications
                </h2>
                <div className={`divide-y ${dividerClass}`}>
                  <Toggle label="Submission Updates"  desc="Get notified when your code is judged"  checked={notifications.submissions}  onChange={() => setNotifications(n => ({ ...n, submissions: !n.submissions }))} />
                  <Toggle label="Achievement Unlocked" desc="Celebrate your milestones"              checked={notifications.achievements} onChange={() => setNotifications(n => ({ ...n, achievements: !n.achievements }))} />
                  <Toggle label="Contest Reminders"   desc="Reminders before contests start"        checked={notifications.contests}     onChange={() => setNotifications(n => ({ ...n, contests: !n.contests }))} />
                  <Toggle label="Weekly Digest"       desc="Weekly summary of your activity"        checked={notifications.emailDigest}  onChange={() => setNotifications(n => ({ ...n, emailDigest: !n.emailDigest }))} />
                  <Toggle label="Newsletter"          desc="Tips, new features, and updates"        checked={notifications.newsletter}   onChange={() => setNotifications(n => ({ ...n, newsletter: !n.newsletter }))} />
                </div>
                <div className="mt-6">
                  <SaveBtn label="Save Preferences" loadLabel="Saving..." />
                </div>
              </form>
            )}

            {/* ── EDITOR PREFERENCES ── */}
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
                  <div className={`flex justify-between text-xs ${subText} mt-1`}>
                    <span>10px</span><span>24px</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>App Theme</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { if (isDark) toggleTheme(); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${!isDark ? 'border-rose-500 bg-rose-500/10 text-rose-500' : `border-gray-700 ${subText} hover:border-gray-600`}`}
                    >
                      <FiSun className="h-4 w-4" /> Light
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!isDark) toggleTheme(); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${isDark ? 'border-rose-500 bg-rose-500/10 text-rose-500' : `border-gray-300 ${subText} hover:border-gray-400`}`}
                    >
                      <FiMoon className="h-4 w-4" /> Dark
                    </button>
                  </div>
                </div>

                <SaveBtn label="Save Preferences" loadLabel="Saving..." />
              </form>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className={`${cardClass} border rounded-2xl p-6 space-y-4`}>
                <h2 className={`text-lg font-bold ${textClass} pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  Change Password
                </h2>

                {[
                  { label: 'Current Password', key: 'currentPassword', show: showCurrentPwd, toggle: () => setShowCurrentPwd(v => !v), placeholder: 'Enter current password' },
                  { label: 'New Password',      key: 'newPassword',     show: showNewPwd,     toggle: () => setShowNewPwd(v => !v),     placeholder: 'At least 6 characters' },
                  { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirmPwd, toggle: () => setShowConfirmPwd(v => !v), placeholder: 'Repeat new password' },
                ].map(({ label, key, show, toggle, placeholder }) => (
                  <div key={key} className="relative">
                    <label className={labelClass}>{label}</label>
                    <input
                      type={show ? 'text' : 'password'}
                      value={passwords[key]}
                      onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                      placeholder={placeholder}
                      className={`w-full px-4 py-2.5 pr-10 ${inputClass} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20`}
                    />
                    <button type="button" onClick={toggle} className={`absolute right-3 bottom-3 ${subText}`}>
                      {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                ))}

                {passwords.newPassword && passwords.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1.5 ${passwords.newPassword === passwords.confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                    {passwords.newPassword === passwords.confirmPassword ? <FiCheck /> : <FiAlertCircle />}
                    {passwords.newPassword === passwords.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}

                <SaveBtn
                  label="Change Password"
                  loadLabel="Changing..."
                  disabled={!passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}
                  icon={<FiLock className="h-4 w-4" />}
                />
              </form>
            )}

            {/* ── DANGER ZONE ── */}
            {activeTab === 'danger' && (
              <div className={`${cardClass} border-2 border-red-500/30 rounded-2xl p-6 space-y-4`}>
                <h2 className="text-lg font-bold text-red-500 pb-4 border-b border-red-500/20">
                  ⚠️ Danger Zone
                </h2>
                <div className={`${isDark ? 'bg-red-500/5' : 'bg-red-50'} rounded-xl p-4`}>
                  <h3 className={`font-semibold ${textClass} mb-1`}>Delete Account</h3>
                  <p className={`text-sm ${subText} mb-4`}>
                    This action is <strong>irreversible</strong>. All your data including submissions, achievements, and profile will be permanently deleted.
                  </p>
                  <p className={`text-sm ${subText} mb-2`}>
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
                    <FiTrash2 className="h-4 w-4" /> Delete My Account
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