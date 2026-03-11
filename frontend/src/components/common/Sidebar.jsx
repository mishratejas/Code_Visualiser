import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiHome, FiCode, FiBarChart2, FiCalendar,
  FiUser, FiSettings, FiBell, FiAward,
  FiFileText, FiHelpCircle, FiLogOut,
  FiChevronLeft, FiChevronRight, FiChevronDown, FiZap,
} from 'react-icons/fi';

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const navItems = [
    { title: 'Dashboard',     icon: <FiHome      className="w-5 h-5" />, path: '/dashboard' },
    {
      title: 'Problems',
      icon: <FiCode className="w-5 h-5" />,
      path: '/problems',
      submenu: [
        { title: 'All Problems', path: '/problems' },
        { title: 'Categories',   path: '/problems/categories' },
        { title: 'Favourites',   path: '/problems/favorite' },
      ],
    },
    { title: 'Contests',      icon: <FiCalendar  className="w-5 h-5" />, path: '/contests' },
    { title: 'Submissions',   icon: <FiFileText  className="w-5 h-5" />, path: '/submissions' },
    { title: 'Leaderboard',   icon: <FiBarChart2 className="w-5 h-5" />, path: '/leaderboard' },
    { title: 'Achievements',  icon: <FiAward     className="w-5 h-5" />, path: '/achievements' },
    { title: 'Notifications', icon: <FiBell      className="w-5 h-5" />, path: '/notifications' },
  ];

  const bottomItems = [
    { title: 'Profile',  icon: <FiUser       className="w-5 h-5" />, path: `/profile/${user?.username}` },
    { title: 'Settings', icon: <FiSettings   className="w-5 h-5" />, path: '/settings' },
    { title: 'Help',     icon: <FiHelpCircle className="w-5 h-5" />, path: '/help' },
  ];

  const isActive = (path) => {
    const p = path.split('?')[0];
    return location.pathname === p || (p.length > 1 && location.pathname.startsWith(p + '/'));
  };
  const isGroupActive = (item) =>
    isActive(item.path) || (item.submenu?.some(s => isActive(s.path.split('?')[0])) ?? false);

  const bg     = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg';
  const txt    = isDark ? 'text-white' : 'text-gray-900';
  const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
  const hover  = isDark ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900';
  const active = 'bg-rose-500/10 text-rose-500 font-semibold';
  const border = isDark ? 'border-gray-800' : 'border-gray-100';

  const NavItem = ({ item }) => {
    const groupActive = isGroupActive(item);
    const isOpen      = openSubmenu === item.title;
    return (
      <div>
        <Link
          to={item.submenu ? '#' : item.path}
          onClick={e => {
            if (item.submenu) { e.preventDefault(); setOpenSubmenu(isOpen ? null : item.title); }
            else if (mobileOpen) onMobileClose();
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${groupActive ? active : `${sub} ${hover}`}`}
        >
          <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.submenu && <FiChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </>
          )}
        </Link>
        {!collapsed && item.submenu && isOpen && (
          <div className={`mt-0.5 ml-8 pl-3 border-l-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-0.5`}>
            {item.submenu.map(s => (
              <Link key={s.path} to={s.path} onClick={() => mobileOpen && onMobileClose()}
                className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive(s.path.split('?')[0]) ? 'text-rose-500 font-medium' : `${sub} hover:text-rose-500`}`}>
                {s.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SidebarBody = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Collapse toggle — no text name, icon only */}
      <div className={`flex-shrink-0 px-3 py-3 border-b ${border} flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow flex-shrink-0">
            <FiZap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className={`font-bold text-sm truncate ${txt}`}>{user?.username || 'User'}</p>
              <p className={`text-xs truncate ${sub}`}>{user?.role === 'admin' ? '⭐ Organizer' : 'Coder'}</p>
            </div>
          )}
        </div>
        {!collapsed ? (
          <button onClick={() => setCollapsed(true)} className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <FiChevronLeft size={16} className={sub} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <FiChevronRight size={16} className={sub} />
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map(item => <NavItem key={item.title} item={item} />)}
      </nav>

      {/* Bottom section — always visible */}
      <div className={`flex-shrink-0 border-t ${border} px-2 pt-2 pb-3 space-y-0.5`}>
        {bottomItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => mobileOpen && onMobileClose()}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${isActive(item.path) ? active : `${sub} ${hover}`}`}>
            <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
        {/* Logout — always reachable */}
        <button onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${sub} hover:bg-red-500/10 hover:text-red-400`}>
          <span className={`flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}><FiLogOut className="w-5 h-5" /></span>
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'} h-full border-r ${bg} transition-all duration-200`}>
        <SidebarBody />
      </aside>
      {/* Mobile */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileClose} />
          <aside className={`fixed left-0 top-0 h-full w-56 ${bg} border-r z-40 md:hidden flex flex-col`}>
            <SidebarBody />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;