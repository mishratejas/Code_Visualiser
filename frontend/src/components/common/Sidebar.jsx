import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiCode, FiBarChart2, FiCalendar, 
  FiUser, FiSettings, FiBell, FiAward, 
  FiFileText, FiHelpCircle, FiLogOut,
  FiChevronLeft, FiChevronRight, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const navItems = [
    {
      title: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      path: '/dashboard',
    },
    {
      title: 'Problems',
      icon: <FiCode className="w-5 h-5" />,
      path: '/problems',
      submenu: [
        { title: 'All Problems', path: '/problems' },
        { title: 'Categories', path: '/problems/categories' },
        { title: 'Favorite', path: '/problems/favorite' },
        { title: 'Practice', path: '/problems/practice' },
      ],
    },
    {
      title: 'Contests',
      icon: <FiCalendar className="w-5 h-5" />,
      path: '/contests',
      submenu: [
        { title: 'Upcoming', path: '/contests?status=upcoming' },
        { title: 'Ongoing', path: '/contests?status=ongoing' },
        { title: 'Past', path: '/contests?status=past' },
        { title: 'My Contests', path: '/contests/my' },
      ],
    },
    {
      title: 'Submissions',
      icon: <FiFileText className="w-5 h-5" />,
      path: '/submissions',
    },
    {
      title: 'Leaderboard',
      icon: <FiBarChart2 className="w-5 h-5" />,
      path: '/leaderboard',
    },
    {
      title: 'Achievements',
      icon: <FiAward className="w-5 h-5" />,
      path: '/achievements',
    },
    {
      title: 'Notifications',
      icon: <FiBell className="w-5 h-5" />,
      path: '/notifications',
      badge: 3,
    },
  ];

  const bottomItems = [
    {
      title: 'Profile',
      icon: <FiUser className="w-5 h-5" />,
      path: `/profile/${user?.username}`,
    },
    {
      title: 'Settings',
      icon: <FiSettings className="w-5 h-5" />,
      path: '/settings',
    },
    {
      title: 'Help',
      icon: <FiHelpCircle className="w-5 h-5" />,
      path: '/help',
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const toggleSubmenu = (title) => {
    setActiveSubmenu(activeSubmenu === title ? null : title);
  };

  const handleLogout = async () => {
    await logout();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center px-6 py-5 border-b border-gray-700 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center">
              <FiCode className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              CodeForge
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center">
            <FiCode className="h-6 w-6 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-700 text-gray-400"
        >
          {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className={`px-4 py-6 border-b border-gray-700 ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}>
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-800"></div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {user?.username}
              </p>
              <p className="text-sm text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.title}>
            <Link
              to={item.path}
              onClick={(e) => {
                if (item.submenu) {
                  e.preventDefault();
                  toggleSubmenu(item.title);
                }
                if (mobileOpen) {
                  onMobileClose();
                }
              }}
              className={`flex items-center px-3 py-3 rounded-lg transition-all ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-rose-900/30 to-red-900/30 text-rose-400 border border-rose-800/30"
                  : "text-gray-300 hover:text-rose-400 hover:bg-gray-700/50"
              }`}
            >
              <span className={`flex-shrink-0 ${collapsed ? "" : "mr-3"}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.submenu && (
                    <span className="ml-2">
                      {activeSubmenu === item.title ? (
                        <FiChevronDown size={16} />
                      ) : (
                        <FiChevronRight size={16} />
                      )}
                    </span>
                  )}
                </>
              )}
            </Link>
            
            {/* Submenu */}
            {item.submenu && !collapsed && activeSubmenu === item.title && (
              <div className="ml-12 mt-1 space-y-1">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.title}
                    to={subItem.path}
                    onClick={() => mobileOpen && onMobileClose()}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive(subItem.path, true)
                        ? "text-rose-400 bg-rose-900/20"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/30"
                    }`}
                  >
                    <span className="flex-1">{subItem.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-6 border-t border-gray-700 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.title}
            to={item.path}
            onClick={() => mobileOpen && onMobileClose()}
            className={`flex items-center px-3 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? "text-rose-400 bg-rose-900/20"
                : "text-gray-300 hover:text-rose-400 hover:bg-gray-700/50"
            }`}
          >
            <span className={`flex-shrink-0 ${collapsed ? "" : "mr-3"}`}>
              {item.icon}
            </span>
            {!collapsed && (
              <span className="flex-1 font-medium">{item.title}</span>
            )}
          </Link>
        ))}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-3 rounded-lg text-rose-400 hover:bg-rose-900/20 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span className={`flex-shrink-0 ${collapsed ? "" : "mr-3"}`}>
            <FiLogOut className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span className="flex-1 font-medium text-left">Logout</span>
          )}
        </button>
      </div>
    </>
  );

  // Mobile Sidebar
  if (mobileOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-800 border-r border-gray-700 shadow-2xl transform transition-transform lg:hidden">
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={`hidden lg:flex flex-col h-screen bg-gray-800 border-r border-gray-700 transition-all duration-300 sticky top-0 ${
      collapsed ? "w-20" : "w-72"
    }`}>
      {sidebarContent}
    </aside>
  );
};

export default Sidebar;