import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiCode, FiBarChart2, FiCalendar, 
  FiUser, FiSettings, FiBell, FiAward, 
  FiFileText, FiHelpCircle, FiLogOut,
  FiChevronLeft, FiChevronRight, FiMenu, FiX
} from 'react-icons/fi';
import { MdOutlineEmojiEvents, MdOutlineLeaderboard } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const navItems = [
    {
      title: 'Dashboard',
      icon: <FiHome />,
      path: '/dashboard',
    },
    {
      title: 'Problems',
      icon: <FiCode />,
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
      icon: <MdOutlineEmojiEvents />,
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
      icon: <FiFileText />,
      path: '/submissions',
    },
    {
      title: 'Leaderboard',
      icon: <MdOutlineLeaderboard />,
      path: '/leaderboard',
    },
    {
      title: 'Achievements',
      icon: <FiAward />,
      path: '/achievements',
    },
    {
      title: 'Notifications',
      icon: <FiBell />,
      path: '/notifications',
      badge: 3,
    },
  ];

  const bottomItems = [
    {
      title: 'Profile',
      icon: <FiUser />,
      path: `/profile/${user?.username}`,
    },
    {
      title: 'Settings',
      icon: <FiSettings />,
      path: '/settings',
    },
    {
      title: 'Help',
      icon: <FiHelpCircle />,
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
      <div className={cn(
        "flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <FiCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CodeForge
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <FiCode className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <div className={cn(
        "px-4 py-6 border-b border-gray-200 dark:border-gray-700",
        collapsed ? "px-2" : "px-4"
      )}>
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {user?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-all",
                isActive(item.path)
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <span className={cn("flex-shrink-0", collapsed ? "" : "mr-3")}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
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
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm transition-all",
                      isActive(subItem.path, true)
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    )}
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
      <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.title}
            to={item.path}
            onClick={() => mobileOpen && onMobileClose()}
            className={cn(
              "flex items-center px-3 py-2.5 rounded-lg transition-all",
              isActive(item.path)
                ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <span className={cn("flex-shrink-0", collapsed ? "" : "mr-3")}>
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
          className={cn(
            "flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all",
            collapsed ? "justify-center" : ""
          )}
        >
          <span className={cn("flex-shrink-0", collapsed ? "" : "mr-3")}>
            <FiLogOut />
          </span>
          {!collapsed && (
            <span className="flex-1 font-medium text-left">Logout</span>
          )}
        </button>
      </div>

      {/* Stats Summary (Collapsed Only) */}
      {collapsed && (
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              45
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Solved
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Mobile Sidebar
  if (mobileOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onMobileClose}
        />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform lg:hidden">
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={cn(
      "hidden lg:flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 sticky top-0",
      collapsed ? "w-20" : "w-64"
    )}>
      {sidebarContent}
    </aside>
  );
};

export default Sidebar;