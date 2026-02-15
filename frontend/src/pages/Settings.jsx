import React, { useState, useEffect } from 'react';
import { FiSave, FiUser, FiBell, FiLock, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUpload from '../components/common/ImageUpload';
import Loader from '../components/common/Loader';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    avatar: ''
  });
  
  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState({
    submissions: true,
    achievements: true,
    contests: true,
    newsletter: false
  });
  
  // Password change
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
      
      setEmailPreferences(user.emailPreferences || {
        submissions: true,
        achievements: true,
        contests: true,
        newsletter: false
      });
    }
  }, [user]);

  const handleImageChange = (avatarUrl) => {
    setProfile(prev => ({ ...prev, avatar: avatarUrl }));
    updateUser({ ...user, avatar: avatarUrl });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await api.patch('/users/profile', {
        username: profile.username,
        email: profile.email
      });
      
      updateUser(response.data?.data?.user || response.data?.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPreferencesUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await api.patch('/users/preferences', {
        emailPreferences
      });
      
      updateUser({ ...user, emailPreferences });
      toast.success('Email preferences updated!');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update email preferences');
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
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      await api.patch('/users/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'security', label: 'Security', icon: <FiLock /> }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg mb-6">
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Profile Picture
                  </label>
                  <ImageUpload
                    currentImage={profile.avatar}
                    onImageChange={handleImageChange}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleEmailPreferencesUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiMail className="w-5 h-5" />
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose which emails you'd like to receive
                  </p>

                  <div className="space-y-3">
                    {/* Submissions */}
                    <label className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">Submission Results</p>
                        <p className="text-sm text-gray-400">Get notified when your code is evaluated</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.submissions}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, submissions: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                    </label>

                    {/* Achievements */}
                    <label className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">Achievement Unlocked</p>
                        <p className="text-sm text-gray-400">Get notified when you unlock new achievements</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.achievements}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, achievements: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                    </label>

                    {/* Contests */}
                    <label className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">Contest Updates</p>
                        <p className="text-sm text-gray-400">Reminders for contests you've registered for</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.contests}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, contests: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                    </label>

                    {/* Newsletter */}
                    <label className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <div>
                        <p className="font-medium text-white">Newsletter & Tips</p>
                        <p className="text-sm text-gray-400">Weekly coding tips and platform updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.newsletter}
                        onChange={(e) => setEmailPreferences({ ...emailPreferences, newsletter: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiLock className="w-5 h-5" />
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Ensure your password is strong and secure
                  </p>

                  {/* Current Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      At least 6 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <FiLock className="w-4 h-4" />
                  <span>{loading ? 'Changing...' : 'Change Password'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;