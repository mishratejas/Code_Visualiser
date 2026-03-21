import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiTrash2, FiFilter, FiCheckCircle, FiAlertCircle, FiAward, FiCalendar, FiCode, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';

const Notifications = () => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  // Use a ref to hold latest filter+page so the fetch function
  // always sees current values and not stale closures.
  const filterRef = useRef(filter);
  const pageRef   = useRef(page);
  filterRef.current = filter;
  pageRef.current   = page;

  const fetchNotifications = async (forcePage, forceFilter) => {
    const pg  = forcePage  ?? pageRef.current;
    const flt = forceFilter ?? filterRef.current;
    try {
      setLoading(true);
      const params = { page: pg, limit: 20 };
      if (flt === 'unread') params.unread = true;
      if (flt === 'read')   params.read   = true;

      const response = await api.get('/notifications', { params });

      // Interceptor already returns response.data.
      // Backend may return { data: { notifications, pagination, unreadCount } }
      //                 OR flat { notifications, pagination, unreadCount }
      const resData    = response?.data ?? response ?? {};
      const notifs     = resData.notifications ?? [];
      const pagination = resData.pagination    ?? {};

      if (pg === 1) {
        setNotifications(notifs);
      } else {
        setNotifications(prev => [...prev, ...notifs]);
      }

      setHasMore((pagination.page || pg) < (pagination.pages || pagination.totalPages || 1));
      setStats({
        total:  pagination.total ?? notifs.length,
        unread: resData.unreadCount ?? notifs.filter(n => !n.read && !n.isRead).length,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (pg === 1) setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // When filter changes: reset page to 1 and fetch fresh
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, filter);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // When page changes beyond 1 (load more): append
  useEffect(() => {
    if (page > 1) fetchNotifications(page, filter);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/mark-read/${id}`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true, isRead: true } : n)
      );
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const getNotifIcon = (type) => {
    const icons = {
      submission: <FiCode className="h-4 w-4" />,
      achievement: <FiAward className="h-4 w-4" />,
      contest: <FiCalendar className="h-4 w-4" />,
      system: <FiAlertCircle className="h-4 w-4" />,
      warning: <FiAlertCircle className="h-4 w-4" />,
    };
    return icons[type] || <FiBell className="h-4 w-4" />;
  };

  const getNotifColor = (type) => {
    const colors = {
      submission: 'from-green-500 to-teal-500',
      achievement: 'from-yellow-400 to-amber-500',
      contest: 'from-blue-500 to-cyan-500',
      system: 'from-gray-500 to-gray-600',
      warning: 'from-orange-500 to-red-500',
    };
    return colors[type] || 'from-rose-500 to-red-500';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const filterBtn = (active) => active
    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
    : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-500">
                <FiBell className="h-6 w-6 text-white" />
              </div>
              {stats.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{stats.unread > 9 ? '9+' : stats.unread}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Notifications</h1>
              <p className={`text-sm ${subTextClass}`}>
                {stats.unread > 0 ? `${stats.unread} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FiCheckCircle className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(1, filter)}
              className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`${cardClass} border rounded-xl p-3 flex gap-2`}>
          {[
            { value: 'all', label: 'All', count: stats.total },
            { value: 'unread', label: 'Unread', count: stats.unread },
            { value: 'read', label: 'Read' },
          ].map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterBtn(filter === value)}`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === value ? 'bg-white/20' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className={`${cardClass} border rounded-xl overflow-hidden`}>
          {loading && page === 1 ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : notifications.length > 0 ? (
            <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {notifications.map((notif) => {
                const isRead = notif.read || notif.isRead;
                const type = notif.type || 'system';
                return (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-4 p-4 transition-colors ${
                      !isRead ? (isDark ? 'bg-rose-500/5' : 'bg-rose-50/50') : ''
                    } ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getNotifColor(type)} flex items-center justify-center text-white flex-shrink-0`}>
                      {getNotifIcon(type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium text-sm ${textClass} ${!isRead ? 'font-semibold' : ''}`}>
                            {notif.title || 'Notification'}
                          </p>
                          <p className={`text-xs ${subTextClass} mt-0.5 line-clamp-2`}>
                            {notif.message || notif.content || notif.body}
                          </p>
                          <p className={`text-xs ${subTextClass} mt-1`}>{formatTime(notif.createdAt)}</p>
                        </div>
                        {!isRead && <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} text-green-500 transition-colors`}
                          title="Mark as read"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} text-red-500 transition-colors`}
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`py-16 text-center ${subTextClass}`}>
              <FiBell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className={`text-xl font-bold ${textClass} mb-2`}>No notifications</h3>
              <p className="text-sm">
                {filter === 'unread' ? "You've read all your notifications! 🎉" : "You'll see activity here as you use the platform."}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 px-5 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm"
                >
                  View All
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Notifications;