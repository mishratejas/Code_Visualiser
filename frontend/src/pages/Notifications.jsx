import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiTrash2, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/common/Loader';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(filter === 'unread' && { unread: true })
      };

      const response = await api.get('/notifications', { params });
      const data = response.data?.data || {};
      
      if (page === 1) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      
      setHasMore(data.pagination?.page < data.pagination?.pages);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/mark-read/${id}`);
      
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearReadNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all read notifications?')) {
      return;
    }

    try {
      await api.delete('/notifications/clear-read');
      
      setNotifications(prev => prev.filter(notif => !notif.read));
      toast.success('Read notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      submission: '✅',
      achievement: '🏆',
      contest: '🎯',
      system: '📢',
      interview: '🎓',
      reminder: '⏰'
    };
    return icons[type] || '📬';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && page === 1) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">
            {unreadCount > 0 ? (
              <>You have <span className="text-blue-400 font-semibold">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}</>
            ) : (
              'You\'re all caught up!'
            )}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {['all', 'unread', 'read'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
            
            {notifications.some(n => n.read) && (
              <button
                onClick={clearReadNotifications}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Clear Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <FiBell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? 'You have no unread notifications'
                : 'You\'ll see notifications here when you have activity'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-gray-800 rounded-lg p-4 border transition-all hover:border-gray-600 ${
                  notification.read
                    ? 'border-gray-700'
                    : 'border-blue-500/30 bg-blue-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {notification.icon || getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white">{notification.title}</h3>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{notification.timeAgo}</span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded">
                        {notification.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <FiCheck className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && notifications.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;