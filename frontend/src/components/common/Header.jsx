import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiBell, FiSearch, FiMenu, FiX, FiCode, FiCheckCircle, FiAward, FiCalendar, FiAlertCircle, FiLogOut, FiSettings } from 'react-icons/fi';
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

    // Join personal notification room — backend will target user-{id}
    socketService.joinUserRoom(userId);

    const handleNotif = (notif) => {
      setUnread(prev => prev + 1);
      setNotifications(prev => [notif, ...prev.slice(0, 19)]);

      // Show a toast popup for the incoming notification
      const style = getStyle(notif.type);
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
    } catch { /* silent */ }
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
      } catch { /* silent */ }
      finally { setLoadingNotifs(false); }
    }
  };

  const markAllRead = async () => {
    try {
      // Backend route is POST /notifications/mark-all-read (see notification.routes.js).
      // This was previously calling api.patch('/notifications/read-all'), which is
      // both the wrong HTTP method and the wrong path — every click 404'd silently
      // (the catch swallows the error) so "Mark all read" appeared to do nothing.
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const markOne = async (id) => {
    try {
      // Same fix as markAllRead — backend route is POST /notifications/mark-read/:id,
      // not PATCH /notifications/:id/read.
      await api.post(`/notifications/mark-read/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) { navigate(`/problems?search=${encodeURIComponent(searchQuery)}`); setSearchQuery(''); }
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

            {isAuthenticated ? (
              <>
                {/* ── Notification Bell ── */}
                <div className="relative" ref={bellRef}>
                  <button onClick={openBell}
                    className="p-2 text-gray-300 hover:text-rose-400 relative transition-colors">
                    <FiBell size={20}/>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {showBell && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">Notifications</span>
                          {unread > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-bold">{unread}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {unread > 0 && (
                            <button onClick={markAllRead}
                              className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                              Mark all read
                            </button>
                          )}
                          <Link to="/notifications" onClick={() => setShowBell(false)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            See all →
                          </Link>
                        </div>
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                        {loadingNotifs ? (
                          <div className="py-8 text-center text-gray-500 text-sm">Loading…</div>
                        ) : notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <FiBell className="h-8 w-8 mx-auto mb-2 text-gray-700"/>
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-600 mt-1">You'll be notified about submissions, achievements, contests & more</p>
                          </div>
                        ) : notifications.map(n => {
                          const s = getStyle(n.type);
                          return (
                            <div key={n._id}
                              className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${n.read ? 'opacity-60' : 'bg-gray-800/40'} hover:bg-gray-800/70`}
                              onClick={() => { markOne(n._id); if (n.link) { navigate(n.link); setShowBell(false); } }}>
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${s.bg} ${s.colour} flex items-center justify-center mt-0.5`}>
                                {n.icon || s.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold ${n.read ? 'text-gray-400' : 'text-white'} truncate`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && <div className="flex-shrink-0 w-2 h-2 bg-rose-500 rounded-full mt-2 animate-pulse"/>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer quick-links */}
                      <div className="px-4 py-2 border-t border-gray-800 grid grid-cols-3 gap-1">
                        {[
                          { icon: '✅', label: 'Submissions', path: '/submissions' },
                          { icon: '🏆', label: 'Achievements', path: '/achievements' },
                          { icon: '🏁', label: 'Contests', path: '/contests' },
                        ].map(item => (
                          <Link key={item.path} to={item.path} onClick={() => setShowBell(false)}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                            <span className="text-base">{item.icon}</span>
                            <span className="text-[10px]">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── User Avatar + Menu ── */}
                <UserMenu user={user} logout={logout} navigate={navigate} />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-300 hover:text-rose-400 text-sm font-medium">Sign in</Link>
                <Link to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-medium rounded-lg text-sm transition-all">
                  Sign up
                </Link>
              </div>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-rose-400">
              {mobileMenuOpen ? <FiX size={24}/> : <FiMenu size={24}/>}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input type="text" placeholder="Search problems…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-rose-500 text-white text-sm pl-10"/>
              <FiSearch className="absolute left-3 top-2.5 text-gray-400"/>
            </form>
            <div className="space-y-1">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-gray-300 hover:text-rose-400 hover:bg-gray-800 rounded-lg text-sm font-medium">
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-800 space-y-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-center text-gray-300 hover:text-rose-400 hover:bg-gray-800 rounded-lg">
                    Sign in
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-center bg-gradient-to-r from-rose-600 to-red-600 text-white font-medium rounded-lg">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// ── User avatar + dropdown menu ────────────────────────────────────────────────
function UserMenu({ user, logout, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-800 transition-colors">
        {/* Previously this always showed the username initial, even after the
            user uploaded a profile photo in Settings — the actual avatar URL
            was never read here. */}
        {(user?.avatar || user?.profile?.avatar) ? (
          <img
            src={user.avatar || user.profile.avatar}
            alt={user?.username}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-gray-300 hidden lg:block">{user?.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          <Link to={`/profile/${user?.username}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <FiUser className="h-4 w-4"/> Profile
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <FiSettings className="h-4 w-4"/> Settings
          </Link>
          <Link to="/notifications" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <FiBell className="h-4 w-4"/> Notifications
          </Link>
          <div className="border-t border-gray-800"/>
          <button onClick={() => { logout(); setOpen(false); navigate('/'); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors">
            <FiLogOut className="h-4 w-4"/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;