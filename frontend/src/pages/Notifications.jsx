import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { BsCheckCircleFill, BsXCircleFill, BsClock } from 'react-icons/bs';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'submission',
        title: 'Submission Accepted',
        message: 'Your solution to "Two Sum" was accepted!',
        time: new Date(Date.now() - 300000),
        read: false,
        icon: <BsCheckCircleFill className="text-green-500" />
      },
      {
        id: 2,
        type: 'contest',
        title: 'Contest Starting Soon',
        message: 'Weekly Coding Challenge starts in 1 hour',
        time: new Date(Date.now() - 3600000),
        read: false,
        icon: <FiAlertCircle className="text-yellow-500" />
      },
      {
        id: 3,
        type: 'achievement',
        title: 'Achievement Unlocked',
        message: 'You earned "Problem Solver" badge!',
        time: new Date(Date.now() - 7200000),
        read: true,
        icon: <BsCheckCircleFill className="text-purple-500" />
      },
      {
        id: 4,
        type: 'submission',
        title: 'Wrong Answer',
        message: 'Test case 3 failed for "Longest Substring"',
        time: new Date(Date.now() - 10800000),
        read: true,
        icon: <BsXCircleFill className="text-red-500" />
      }
    ];
    setNotifications(mockNotifications);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    toast.success('Marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <FiBell />
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  {notifications.filter(n => !n.read).length} unread
                </p>
              </div>
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  <FiCheck />
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`relative ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'} border ${!notification.read ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'} rounded-2xl p-6 shadow-lg transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{notification.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <BsClock size={14} />
                        {getTimeAgo(notification.time)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <FiCheck size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      title="Delete"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <FiBell className="mx-auto text-6xl text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You're all caught up!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;