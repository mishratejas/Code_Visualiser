import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiBell, FiSearch, FiMenu, FiX, FiCode } from 'react-icons/fi';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { label: 'Discuss', path: '/discuss' },
    { label: 'Interview', path: '/interview' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FiCode className="h-7 w-7 text-green-500" />
            <span className="text-xl font-bold text-white">CodeForge</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-300 hover:text-green-400 transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-green-500 text-white text-sm"
                />
                <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </form>

            {/* User Actions */}
            {isAuthenticated ? (
              <>
                <button className="p-2 text-gray-300 hover:text-green-400 relative">
                  <FiBell size={20} />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-400 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 hidden lg:block">
                    {user?.username}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-green-400 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-sm transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-green-500 text-white text-sm pl-10"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </form>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-300 hover:text-green-400 hover:bg-gray-800 rounded-md text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
              
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-center text-gray-300 hover:text-green-400 hover:bg-gray-800 rounded-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-center bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                  >
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

export default Header;