import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiUser, FiBell, FiSearch, FiMenu, FiX, FiCode,
  FiCheckCircle, FiAward, FiCalendar, FiAlertCircle,
  FiLogOut, FiSettings, FiMoon, FiSun
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import socketService from '../../services/socket';

// ── Notification type → icon/colour ──────────────────────────────────────────
const NOTIF_STYLES = {
  submission: { icon: <FiCheckCircle className="h-4 w-4" />, colour: 'text-green-400', bg: 'bg-green-500/10' },
  achievement: { icon: <FiAward    className="h-4 w-4" />, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  contest:     { icon: <FiCalendar className="h-4 w-4" />, colour: 'text-blue-400',   bg: 'bg-blue-500/10' },
  system:      { icon: <FiAlertCircle className="h-4 w-4" />, colour: 'text-gray-400', bg: 'bg-gray-500/10' },
  group:       { icon: <FiUser     className="h-4 w-4" />, colour: 'text-purple-400', bg: 'bg-purple-500/10' },
};
const getStyle = t => NOTIF_STYLES[t] || NOTIF_STYLES.system;

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  // 🌙 DARK MODE TOGGLE ADDED (ThemeContext integration)
  const { toggleTheme, isDark } = useTheme();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery]     = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification bell state
  const [showBell, setShowBell]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const bellRef = useRef(null);

  // ── fetch unread count on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
  }, [isAuthenticated]);

  // ── subscribe to real-time notifications via socket ───────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const userId = user._id || user.id;
    const socket = socketService.connect();
    if (!socket) return;

    socketService.joinUserRoom(userId);

    const handleNotif = (notif) => {
      setUnread(prev => prev + 1);
      setNotifications(prev => [notif, ...prev.slice(0, 19)]);

      toast(notif.title || notif.message, {
        icon: notif.icon || '🔔',
        duration: 5000,
        style: { background: '#1f2937', color: '#f9fafb', fontSize: '0.85rem' },
        onClick: () => { if (notif.link) navigate(notif.link); }
      });
    };

    socket.on('notification', handleNotif);
    return () => { socket.off('notification', handleNotif); };
  }, [isAuthenticated, user]);

  // ── close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnread(res?.data?.count ?? res?.count ?? 0);
    } catch {}
  };

  const openBell = async () => {
    setShowBell(v => !v);
    if (!showBell && notifications.length === 0) {
      setLoadingNotifs(true);
      try {
        const res = await api.get('/notifications', { params: { limit: 15 } });
        const list = res?.data?.notifications || res?.notifications || [];
        setNotifications(list);
        setUnread(res?.data?.unreadCount ?? 0);
      } catch {}
      finally { setLoadingNotifs(false); }
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/problems?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { label: 'Problems', path: '/problems' },
    { label: 'Contests', path: '/contests' },
    { label: 'Discuss',  path: '/discuss' },
    { label: 'Interview',path: '/interview' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 w-full backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center">
              <FiCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodeForge</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className="text-gray-300 hover:text-rose-400 transition-colors text-sm font-medium">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-3">

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input type="text" placeholder="Search problems…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-56 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-rose-500 text-white text-sm"/>
                <FiSearch className="absolute right-3 top-2.5 text-gray-400"/>
              </div>
            </form>

            {/* 🌙 DARK MODE TOGGLE (ADDED FEATURE) */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-300 hover:text-rose-400 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {isAuthenticated && (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={bellRef}>
                  <button onClick={openBell}
                    className="p-2 text-gray-300 hover:text-rose-400 relative transition-colors">
                    <FiBell size={20}/>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] rounded-full px-1">
                        {unread}
                      </span>
                    )}
                  </button>
                </div>

                <UserMenu user={user} logout={logout} navigate={navigate} />
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;