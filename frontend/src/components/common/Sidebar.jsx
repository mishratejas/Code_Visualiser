import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiCode, FiBarChart2, FiCalendar, 
  FiUser, FiSettings, FiBell, FiAward, 
  FiFileText, FiHelpCircle, FiLogOut,
  FiChevronLeft, FiChevronRight, FiChevronDown,
  FiZap, FiActivity
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

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
      {/* Logo with Glow Effect */}
      <div className={`relative px-6 py-5 border-b border-gray-700 ${collapsed ? "justify-center" : "justify-between"} flex items-center`}>
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/10 to-red-600/10 blur-xl opacity-50"></div>
        {!collapsed && (
          <Link to="/" className="relative flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/25 group-hover:shadow-rose-600/40 transition-all duration-300">
              <FiCode className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">
                CodeForge
              </span>
              <span className="text-xs text-gray-400 font-medium">Practice & Compete</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="relative h-10 w-10 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/25">
            <FiCode className="h-6 w-6 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="relative z-10 hidden lg:flex p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-rose-400 transition-all duration-200 border border-gray-700 hover:border-rose-500/30"
        >
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      {/* User Profile with Gradient */}
      <div className={`px-4 py-5 border-b border-gray-700 ${collapsed ? "px-2" : "px-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}>
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-rose-600 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-rose-600/30">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-gray-800 shadow-sm"></div>
            <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-rose-600 to-red-600 animate-ping opacity-20"></div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white truncate text-sm">
                  {user?.username}
                </p>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 rounded-full">
                  <FiActivity className="h-2.5 w-2.5 text-rose-400" />
                  <span className="text-xs text-rose-400 font-medium">Pro</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-rose-500 to-red-500 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-400">75%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const isSubmenuOpen = activeSubmenu === item.title;
          
          return (
            <div key={item.title} className="relative">
              <Link
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={(e) => {
                  if (item.submenu) {
                    e.preventDefault();
                    toggleSubmenu(item.title);
                  }
                  if (mobileOpen) {
                    onMobileClose();
                  }
                }}
                className={`relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                  active
                    ? "bg-gradient-to-r from-rose-900/40 to-red-900/40 text-rose-300 shadow-lg shadow-rose-900/20 border-l-2 border-rose-500"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/30"
                }`}
              >
                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  active && "opacity-100"
                }`}></div>
                
                <span className={`relative flex-shrink-0 ${collapsed ? "" : "mr-3"} ${active ? "text-rose-400" : "text-gray-400 group-hover:text-rose-400"}`}>
                  {item.icon}
                </span>
                
                {!collapsed && (
                  <>
                    <span className="relative flex-1 font-medium text-sm">
                      {item.title}
                    </span>
                    <div className="relative flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-medium rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      {item.submenu && (
                        <span className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-180" : ""}`}>
                          <FiChevronDown size={14} />
                        </span>
                      )}
                    </div>
                  </>
                )}
                
                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-gradient-to-b from-rose-400 to-red-400 rounded-r-full"></div>
                )}
              </Link>
              
              {/* Submenu */}
              {item.submenu && !collapsed && isSubmenuOpen && (
                <div className="ml-8 mt-1 space-y-1 pl-3 border-l border-gray-700/50">
                  {item.submenu.map((subItem) => {
                    const subActive = isActive(subItem.path, true);
                    return (
                      <Link
                        key={subItem.title}
                        to={subItem.path}
                        onClick={() => mobileOpen && onMobileClose()}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group/sub ${
                          subActive
                            ? "text-rose-300 bg-gradient-to-r from-rose-900/20 to-red-900/10"
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/20"
                        }`}
                      >
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r-full bg-gradient-to-b from-rose-500 to-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity ${
                          subActive && "opacity-100"
                        }`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${
                          subActive 
                            ? "bg-gradient-to-r from-rose-400 to-red-400" 
                            : "bg-gray-600 group-hover/sub:bg-rose-500/50"
                        }`}></div>
                        <span className="flex-1">{subItem.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-gray-700/50 space-y-1">
        {bottomItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.title}
              to={item.path}
              onClick={() => mobileOpen && onMobileClose()}
              className={`relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                active
                  ? "text-rose-300 bg-gradient-to-r from-rose-900/20 to-red-900/10"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/20"
              }`}
            >
              <span className={`flex-shrink-0 ${collapsed ? "" : "mr-3"} ${active ? "text-rose-400" : "text-gray-400 group-hover:text-rose-400"}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 font-medium text-sm">{item.title}</span>
              )}
              
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          );
        })}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`relative flex items-center w-full px-3 py-3 rounded-xl text-gray-300 hover:text-white transition-all duration-300 group overflow-hidden ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/10 to-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-rose-500/20 transition-all duration-300"></div>
          
          <span className={`relative flex-shrink-0 ${collapsed ? "" : "mr-3"} text-gray-400 group-hover:text-rose-400 group-hover:animate-pulse`}>
            <FiLogOut className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span className="relative flex-1 font-medium text-sm text-left">Logout</span>
          )}
        </button>
        
        {/* Version info */}
        {!collapsed && (
          <div className="pt-4 mt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">v2.0.1</span>
              <div className="flex items-center gap-1">
                <FiZap className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">Online</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Mobile Sidebar
  if (mobileOpen) {
    return (
      <>
        {/* Animated Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-black/90 backdrop-blur-md lg:hidden animate-fadeIn"
          onClick={onMobileClose}
        />
        
        {/* Sidebar with Slide-in Animation */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-800 border-r border-gray-700/50 shadow-2xl transform transition-all duration-300 lg:hidden animate-slideInLeft">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900"></div>
          <div className="relative z-10 h-full flex flex-col">
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={`hidden lg:flex flex-col h-screen bg-gray-800 border-r border-gray-700/50 transition-all duration-300 sticky top-0 z-30 ${
      collapsed ? "w-20" : "w-72"
    }`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900"></div>
      <div className="relative z-10 h-full flex flex-col backdrop-blur-sm">
        {sidebarContent}
      </div>
    </aside>
  );
};

export default Sidebar;