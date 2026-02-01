import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiLock, FiBell, FiMoon, 
  FiGlobe, FiCode, FiSave, FiUpload,
  FiCheck, FiTrash2, FiEye, FiEyeOff,
  FiRefreshCw
} from 'react-icons/fi';

import { TbKeyboard } from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import api from '../services/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    company: user?.company || '',
    website: user?.website || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: user?.email || '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    contestReminders: true,
    submissionUpdates: true,
    weeklyDigest: true,
    promotional: false,
  });

  // Editor preferences
  const [editorSettings, setEditorSettings] = useState({
    theme: localStorage.getItem('editor_theme') || 'vs-dark',
    fontSize: parseInt(localStorage.getItem('editor_font_size')) || 14,
    tabSize: parseInt(localStorage.getItem('editor_tab_size')) || 2,
    wordWrap: localStorage.getItem('editor_word_wrap') === 'true' || true,
    minimap: localStorage.getItem('editor_minimap') === 'true' || true,
    autoSave: localStorage.getItem('editor_auto_save') === 'true' || true,
    formatOnSave: localStorage.getItem('editor_format_on_save') === 'true' || true,
  });

  // Keybindings
  const [keybindings, setKeybindings] = useState({
    runCode: 'ctrl+enter',
    submitCode: 'ctrl+s',
    formatCode: 'shift+alt+f',
    toggleComment: 'ctrl+/',
    find: 'ctrl+f',
    replace: 'ctrl+h',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'account', label: 'Account', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'appearance', label: 'Appearance', icon: FiMoon },
    { id: 'editor', label: 'Editor', icon: FiCode },
    { id: 'keybindings', label: 'Keybindings', icon: TbKeyboard },
  ];

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notification_settings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    const savedKeybindings = localStorage.getItem('keybindings');
    if (savedKeybindings) {
      setKeybindings(JSON.parse(savedKeybindings));
    }
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        toast.success('Avatar selected! Click Save Changes to update.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1')} ${!notifications[key] ? 'enabled' : 'disabled'}`);
  };

  const handleEditorSettingChange = (key, value) => {
    setEditorSettings(prev => ({
      ...prev,
      [key]: value
    }));
    localStorage.setItem(`editor_${key}`, value);
    if (key === 'theme') {
      toast.success(`Theme changed to ${themeOptions.find(t => t.value === value)?.label}`);
    }
  };

  const handleKeybindingChange = (key, value) => {
    setKeybindings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        const avatarResponse = await api.put('/users/avatar', formData);
        updateUser({ ...user, avatar: avatarResponse.avatar });
      }

      const response = await api.put('/users/profile', profileForm);
      updateUser({ ...user, ...response.user });
      
      toast.success('Profile updated successfully!', {
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async () => {
    try {
      if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (accountForm.newPassword && accountForm.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      setSaving(true);
      await api.put('/users/account', {
        currentPassword: accountForm.currentPassword,
        newPassword: accountForm.newPassword,
        email: accountForm.email,
      });

      setAccountForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      toast.success('Account settings updated successfully!', {
        icon: '🔒',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications));
    toast.success('Notification preferences saved!', {
      icon: '🔔',
    });
  };

  const saveKeybindings = () => {
    localStorage.setItem('keybindings', JSON.stringify(keybindings));
    toast.success('Keybindings saved!', {
      icon: '⌨️',
    });
  };

  const resetToDefaults = (section) => {
    if (section === 'editor') {
      const defaults = {
        theme: 'vs-dark',
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: true,
        autoSave: true,
        formatOnSave: true,
      };
      setEditorSettings(defaults);
      Object.entries(defaults).forEach(([key, value]) => {
        localStorage.setItem(`editor_${key}`, value);
      });
      toast.success('Editor settings reset to defaults', {
        icon: '🔄',
      });
    } else if (section === 'keybindings') {
      const defaults = {
        runCode: 'ctrl+enter',
        submitCode: 'ctrl+s',
        formatCode: 'shift+alt+f',
        toggleComment: 'ctrl+/',
        find: 'ctrl+f',
        replace: 'ctrl+h',
      };
      setKeybindings(defaults);
      toast.success('Keybindings reset to defaults', {
        icon: '⌨️',
      });
    }
  };

  const themeOptions = [
    { value: 'vs-dark', label: 'Dark', color: 'bg-gray-900' },
    { value: 'light', label: 'Light', color: 'bg-gray-100' },
    { value: 'hc-black', label: 'High Contrast', color: 'bg-black' },
  ];

  const fontSizeOptions = [12, 13, 14, 15, 16, 18, 20, 24];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <FiUser className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Profile Picture</Card.Title>
        </div>
        <Card.Body>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="relative h-32 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-2xl">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : user?.username?.charAt(0).toUpperCase()}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Change</span>
                </div>
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full cursor-pointer hover:shadow-lg hover:scale-105 transition-all shadow-lg">
                <FiUpload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white mb-2">Upload Profile Picture</h3>
              <p className="text-sm text-gray-400 mb-4">
                JPG, PNG or GIF. Maximum file size 5MB. Recommended: 256x256px
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button
                  variant="gradient"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <FiUpload className="mr-2" />
                  Upload Image
                </Button>
                {avatarPreview && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAvatarPreview('');
                      setAvatar(null);
                      toast.success('Avatar removed');
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Profile Information */}
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <FiUser className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Profile Information</Card.Title>
        </div>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Full Name', name: 'name', placeholder: 'John Doe', type: 'text' },
              { label: 'Location', name: 'location', placeholder: 'San Francisco, CA', type: 'text' },
              { label: 'Company', name: 'company', placeholder: 'Google', type: 'text' },
              { label: 'Website', name: 'website', placeholder: 'https://yourwebsite.com', type: 'url' },
              { label: 'GitHub', name: 'github', placeholder: 'https://github.com/username', type: 'url' },
              { label: 'LinkedIn', name: 'linkedin', placeholder: 'https://linkedin.com/in/username', type: 'url' },
            ].map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={profileForm[field.name]}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          
          {/* Bio Textarea */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Bio
            </label>
            <textarea
              name="bio"
              value={profileForm.bio}
              onChange={handleProfileChange}
              rows="4"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 resize-none transition-all"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-500 text-right">
              {profileForm.bio.length}/500 characters
            </p>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end pt-6 border-t border-gray-700/50">
          <Button
            onClick={saveProfile}
            loading={saving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg"
            startIcon={<FiSave />}
          >
            Save Changes
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Email Section */}
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
            <FiMail className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Email Address</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Email
              </label>
              <div className="flex items-center p-3 bg-gray-700/50 rounded-xl border border-gray-600">
                <FiMail className="mr-3 text-blue-400" />
                <span className="text-white">{user?.email}</span>
                <span className="ml-auto px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">
                  Verified
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                name="email"
                value={accountForm.email}
                onChange={handleAccountChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
                placeholder="new@email.com"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Password Change */}
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
            <FiLock className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Change Password</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-4">
            {[
              { 
                label: 'Current Password', 
                name: 'currentPassword', 
                show: showPassword.current,
                toggle: () => togglePasswordVisibility('current')
              },
              { 
                label: 'New Password', 
                name: 'newPassword', 
                show: showPassword.new,
                toggle: () => togglePasswordVisibility('new')
              },
              { 
                label: 'Confirm New Password', 
                name: 'confirmPassword', 
                show: showPassword.confirm,
                toggle: () => togglePasswordVisibility('confirm')
              },
            ].map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.show ? "text" : "password"}
                    name={field.name}
                    value={accountForm[field.name]}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {field.show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-400">
                <strong>Password Requirements:</strong> Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
              </p>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end pt-6 border-t border-gray-700/50">
          <Button
            onClick={saveAccount}
            loading={saving}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg"
            startIcon={<FiSave />}
          >
            Update Password
          </Button>
        </Card.Footer>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-red-500/30 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500">
            <FiTrash2 className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-red-400">Danger Zone</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div>
                <h4 className="font-medium text-white">Delete Account</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="danger"
                className="mt-3 sm:mt-0 bg-gradient-to-r from-red-600 to-rose-600"
                onClick={() => {
                  if (window.confirm('Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone.')) {
                    toast.error('Account deletion not implemented');
                  }
                }}
                startIcon={<FiTrash2 />}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <FiBell className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Notification Preferences</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="font-medium text-white text-lg flex items-center gap-2">
                <FiMail className="h-5 w-5 text-blue-400" />
                Email Notifications
              </h4>
              {[
                { key: 'emailNotifications', label: 'Enable all email notifications' },
                { key: 'contestReminders', label: 'Contest reminders' },
                { key: 'submissionUpdates', label: 'Submission status updates' },
                { key: 'weeklyDigest', label: 'Weekly progress digest' },
                { key: 'promotional', label: 'Promotional emails' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div>
                    <span className="text-gray-300">{item.label}</span>
                    {item.key === 'promotional' && (
                      <p className="text-xs text-gray-500 mt-1">Updates about new features and offers</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${notifications[item.key] 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-white text-lg flex items-center gap-2">
                <FiBell className="h-5 w-5 text-green-400" />
                Push Notifications
              </h4>
              <div className="flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg transition-colors">
                <div>
                  <span className="text-gray-300">Enable push notifications</span>
                  <p className="text-xs text-gray-500 mt-1">Get real-time notifications in your browser</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${notifications.pushNotifications 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                    : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end pt-6 border-t border-gray-700/50">
          <Button
            onClick={saveNotifications}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg"
            startIcon={<FiSave />}
          >
            Save Preferences
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderEditorTab = () => (
    <div className="space-y-6">
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
            <FiCode className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Editor Settings</Card.Title>
        </div>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => handleEditorSettingChange('theme', theme.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${editorSettings.theme === theme.value 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className={`h-8 rounded-lg ${theme.color} mb-2`}></div>
                      <span className="text-sm text-gray-300">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Font Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {fontSizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleEditorSettingChange('fontSize', size)}
                      className={`px-3 py-2 rounded-lg transition-all ${editorSettings.fontSize === size 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tab Size
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={editorSettings.tabSize}
                    onChange={(e) => handleEditorSettingChange('tabSize', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-500"
                  />
                  <span className="text-white font-medium min-w-[2rem] text-center">
                    {editorSettings.tabSize}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Editor Features</h4>
              {[
                { key: 'wordWrap', label: 'Word Wrap', description: 'Wrap lines that exceed the editor width' },
                { key: 'minimap', label: 'Minimap', description: 'Show code overview on the right side' },
                { key: 'autoSave', label: 'Auto Save', description: 'Automatically save your code' },
                { key: 'formatOnSave', label: 'Format on Save', description: 'Format code automatically when saving' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                  <div>
                    <span className="text-gray-300 font-medium">{item.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleEditorSettingChange(item.key, !editorSettings[item.key])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${editorSettings[item.key] 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                      : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${editorSettings[item.key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-between pt-6 border-t border-gray-700/50">
          <Button
            variant="outline"
            onClick={() => resetToDefaults('editor')}
            startIcon={<FiRefreshCw />}
          >
            Reset to Defaults
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-lg"
            onClick={() => toast.success('Editor settings saved!', { icon: '💾' })}
            startIcon={<FiSave />}
          >
            Save Settings
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderKeybindingsTab = () => (
    <div className="space-y-6">
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
            <TbKeyboard className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Keyboard Shortcuts</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-4">
            {[
              { key: 'runCode', label: 'Run Code', description: 'Execute your code with test cases', icon: '🚀' },
              { key: 'submitCode', label: 'Submit Code', description: 'Submit your solution for evaluation', icon: '📤' },
              { key: 'formatCode', label: 'Format Code', description: 'Auto-format your code', icon: '✨' },
              { key: 'toggleComment', label: 'Toggle Comment', description: 'Comment/uncomment selected lines', icon: '💬' },
              { key: 'find', label: 'Find', description: 'Search in editor', icon: '🔍' },
              { key: 'replace', label: 'Replace', description: 'Find and replace', icon: '🔄' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all group">
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className="p-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{item.label}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={keybindings[item.key]}
                  onChange={(e) => handleKeybindingChange(item.key, e.target.value)}
                  className="mt-2 sm:mt-0 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-center font-mono text-sm text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all sm:w-48"
                  placeholder="e.g., ctrl+enter"
                />
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-between pt-6 border-t border-gray-700/50">
          <Button
            variant="outline"
            onClick={() => resetToDefaults('keybindings')}
            startIcon={<FiRefreshCw />}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={saveKeybindings}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg"
            startIcon={<FiSave />}
          >
            Save Keybindings
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
            <FiPalette className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Theme</Card.Title>
        </div>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', description: 'Bright theme for daytime', icon: '🌞', color: 'from-gray-100 to-white' },
              { id: 'dark', label: 'Dark', description: 'Dark theme for night', icon: '🌙', color: 'from-gray-800 to-gray-900' },
              { id: 'auto', label: 'Auto', description: 'Follow system settings', icon: '⚙️', color: 'from-blue-500 to-purple-500' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  document.documentElement.classList.remove('dark', 'light');
                  if (theme.id === 'dark') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  } else if (theme.id === 'light') {
                    document.documentElement.classList.add('light');
                    localStorage.setItem('theme', 'light');
                  } else {
                    localStorage.removeItem('theme');
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.add('light');
                    }
                  }
                  toast.success(`Theme set to ${theme.label}`, {
                    icon: theme.icon,
                  });
                }}
                className={`flex flex-col items-center p-6 border-2 rounded-2xl transition-all hover:scale-105 ${
                  (theme.id === 'dark' && document.documentElement.classList.contains('dark')) ||
                  (theme.id === 'light' && document.documentElement.classList.contains('light')) ||
                  (theme.id === 'auto' && !localStorage.getItem('theme'))
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className={`w-16 h-16 rounded-xl mb-4 bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{theme.icon}</span>
                </div>
                <h4 className="font-semibold text-white text-lg">
                  {theme.label}
                </h4>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Card className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
            <FiCode className="h-5 w-5 text-white" />
          </div>
          <Card.Title className="text-white">Code Display</Card.Title>
        </div>
        <Card.Body>
          <div className="space-y-6">
            {[
              { key: 'syntaxHighlighting', label: 'Syntax Highlighting', description: 'Enable colorful syntax highlighting', default: true },
              { key: 'lineNumbers', label: 'Line Numbers', description: 'Show line numbers in editor', default: true },
              { key: 'bracketMatching', label: 'Bracket Matching', description: 'Highlight matching brackets', default: true },
              { key: 'codeLens', label: 'CodeLens', description: 'Show inline references and information', default: true },
              { key: 'scrollBeyondLastLine', label: 'Scroll Beyond Last Line', description: 'Allow scrolling past the end of the file', default: false },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                <div>
                  <h4 className="font-medium text-white">{item.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600">
                  <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white" />
                </button>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end pt-6 border-t border-gray-700/50">
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg"
            startIcon={<FiSave />}
            onClick={() => toast.success('Display settings saved!', { icon: '👁️' })}
          >
            Save Display Settings
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'account':
        return renderAccountTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'appearance':
        return renderAppearanceTab();
      case 'editor':
        return renderEditorTab();
      case 'keybindings':
        return renderKeybindingsTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl opacity-20 rounded-3xl"></div>
        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 shadow-2xl">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 mt-3 text-lg max-w-2xl">
            Manage your account preferences, customize your editor, and configure your notification settings.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse"></div>
              <span className="text-sm text-blue-400">Settings auto-saved</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-full">
              <span className="text-sm text-gray-400">Last updated: Just now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Enhanced Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="sticky top-8 border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
            <Card.Body className="p-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center w-full px-4 py-3.5 text-left rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-400 group-hover:bg-gray-600'
                      }`}>
                        <tab.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{tab.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
              
              {/* Progress Stats */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Settings Complete</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Profile</span>
                    <span className="text-green-400">100%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Security</span>
                    <span className="text-blue-400">80%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;