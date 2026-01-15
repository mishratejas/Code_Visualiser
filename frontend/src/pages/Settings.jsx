import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiLock, FiBell, FiMoon, 
  FiGlobe, FiCode, FiSave, FiUpload 
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
    // Load saved settings
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

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEditorSettingChange = (key, value) => {
    setEditorSettings(prev => ({
      ...prev,
      [key]: value
    }));
    localStorage.setItem(`editor_${key}`, value);
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
      
      // Upload avatar if changed
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        const avatarResponse = await api.put('/users/avatar', formData);
        updateUser({ ...user, avatar: avatarResponse.avatar });
      }

      // Update profile
      const response = await api.put('/users/profile', profileForm);
      updateUser({ ...user, ...response.user });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async () => {
    try {
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      setSaving(true);
      await api.put('/users/account', {
        currentPassword: accountForm.currentPassword,
        newPassword: accountForm.newPassword,
        email: accountForm.email,
      });

      // Clear password fields
      setAccountForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      toast.success('Account settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications));
    toast.success('Notification preferences saved!');
  };

  const saveKeybindings = () => {
    localStorage.setItem('keybindings', JSON.stringify(keybindings));
    toast.success('Keybindings saved!');
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
      toast.success('Editor settings reset to defaults');
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
      toast.success('Keybindings reset to defaults');
    }
  };

  const themeOptions = [
    { value: 'vs-dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'hc-black', label: 'High Contrast' },
  ];

  const fontSizeOptions = [12, 13, 14, 15, 16, 18, 20, 24];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <Card.Title>Profile Picture</Card.Title>
        <Card.Body>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : user?.username?.charAt(0).toUpperCase()}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700">
                <FiUpload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Upload a new avatar. JPG, PNG or GIF. Max 5MB.
              </p>
              <Button
                variant="outline"
                onClick={() => document.querySelector('input[type="file"]')?.click()}
              >
                Choose Image
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Profile Information */}
      <Card>
        <Card.Title>Profile Information</Card.Title>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                rows="3"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={profileForm.location}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={profileForm.company}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="Google"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={profileForm.website}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub
              </label>
              <input
                type="url"
                name="github"
                value={profileForm.github}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end">
          <Button
            onClick={saveProfile}
            loading={saving}
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
      {/* Email */}
      <Card>
        <Card.Title>Email Address</Card.Title>
        <Card.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Email
              </label>
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FiMail className="mr-3 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                name="email"
                value={accountForm.email}
                onChange={handleAccountChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="new@email.com"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Password Change */}
      <Card>
        <Card.Title>Change Password</Card.Title>
        <Card.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={accountForm.currentPassword}
                onChange={handleAccountChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={accountForm.newPassword}
                onChange={handleAccountChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={accountForm.confirmPassword}
                onChange={handleAccountChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end">
          <Button
            onClick={saveAccount}
            loading={saving}
            startIcon={<FiSave />}
          >
            Update Account
          </Button>
        </Card.Footer>
      </Card>

      {/* Danger Zone */}
      <Card>
        <Card.Title className="text-red-600 dark:text-red-400">Danger Zone</Card.Title>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <Button
                variant="danger"
                className="mt-3 sm:mt-0"
                onClick={() => {
                  if (window.confirm('Are you sure? This action cannot be undone.')) {
                    // Handle account deletion
                    toast.error('Account deletion not implemented');
                  }
                }}
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
      <Card>
        <Card.Title>Notification Preferences</Card.Title>
        <Card.Body>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
              {[
                { key: 'emailNotifications', label: 'Enable all email notifications' },
                { key: 'contestReminders', label: 'Contest reminders' },
                { key: 'submissionUpdates', label: 'Submission status updates' },
                { key: 'weeklyDigest', label: 'Weekly progress digest' },
                { key: 'promotional', label: 'Promotional emails' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <button
                    onClick={() => handleNotificationToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Enable push notifications</span>
                <button
                  onClick={() => handleNotificationToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-end">
          <Button
            onClick={saveNotifications}
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
      <Card>
        <Card.Title>Editor Settings</Card.Title>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={editorSettings.theme}
                onChange={(e) => handleEditorSettingChange('theme', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {themeOptions.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size
              </label>
              <select
                value={editorSettings.fontSize}
                onChange={(e) => handleEditorSettingChange('fontSize', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              >
                {fontSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tab Size
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={editorSettings.tabSize}
                onChange={(e) => handleEditorSettingChange('tabSize', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Word Wrap</span>
                <button
                  onClick={() => handleEditorSettingChange('wordWrap', !editorSettings.wordWrap)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editorSettings.wordWrap ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editorSettings.wordWrap ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Minimap</span>
                <button
                  onClick={() => handleEditorSettingChange('minimap', !editorSettings.minimap)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editorSettings.minimap ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editorSettings.minimap ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Auto Save</span>
                <button
                  onClick={() => handleEditorSettingChange('autoSave', !editorSettings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editorSettings.autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editorSettings.autoSave ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Format on Save</span>
                <button
                  onClick={() => handleEditorSettingChange('formatOnSave', !editorSettings.formatOnSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editorSettings.formatOnSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editorSettings.formatOnSave ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => resetToDefaults('editor')}
          >
            Reset to Defaults
          </Button>
          <Button
            startIcon={<FiSave />}
            onClick={() => toast.success('Editor settings saved!')}
          >
            Save Settings
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );

  const renderKeybindingsTab = () => (
    <div className="space-y-6">
      <Card>
        <Card.Title>Keyboard Shortcuts</Card.Title>
        <Card.Body>
          <div className="space-y-4">
            {[
              { key: 'runCode', label: 'Run Code', description: 'Execute your code with test cases' },
              { key: 'submitCode', label: 'Submit Code', description: 'Submit your solution for evaluation' },
              { key: 'formatCode', label: 'Format Code', description: 'Auto-format your code' },
              { key: 'toggleComment', label: 'Toggle Comment', description: 'Comment/uncomment selected lines' },
              { key: 'find', label: 'Find', description: 'Search in editor' },
              { key: 'replace', label: 'Replace', description: 'Find and replace' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <input
                  type="text"
                  value={keybindings[item.key]}
                  onChange={(e) => handleKeybindingChange(item.key, e.target.value)}
                  className="mt-2 sm:mt-0 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-center font-mono text-sm"
                  placeholder="Shortcut"
                />
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => resetToDefaults('keybindings')}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={saveKeybindings}
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
      <Card>
        <Card.Title>Theme</Card.Title>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', description: 'Bright theme for daytime', icon: '🌞' },
              { id: 'dark', label: 'Dark', description: 'Dark theme for night', icon: '🌙' },
              { id: 'auto', label: 'Auto', description: 'Follow system settings', icon: '⚙️' },
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
                  }
                  toast.success(`Theme set to ${theme.label}`);
                }}
                className="flex flex-col items-center p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition"
              >
                <span className="text-3xl mb-3">{theme.icon}</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {theme.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Title>Code Display</Card.Title>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Syntax Highlighting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable colorful syntax highlighting
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Line Numbers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show line numbers in editor
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Bracket Matching</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Highlight matching brackets
                </p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white" />
              </button>
            </div>
          </div>
        </Card.Body>
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
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card className="sticky top-6">
            <Card.Body className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition ${activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <tab.icon className="mr-3" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
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