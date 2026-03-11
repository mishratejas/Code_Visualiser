// frontend/src/pages/FavoriteProblems.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FiBookmark, FiTrash2, FiStar } from 'react-icons/fi';
import { usersApi, problemsApi } from '../services/api';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/common/ThemeToggle';
import Loader from '../components/common/Loader';

const FavoriteProblems = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [bookmarkedProblems, setBookmarkedProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getBookmarks();
      
      // Your API returns bookmarks array with problem details populated
      const bookmarks = response.data?.bookmarks || [];
      setBookmarkedProblems(bookmarks);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (problemId, e) => {
    e.preventDefault();
    try {
      await usersApi.toggleBookmark(problemId);
      setBookmarkedProblems(prev => prev.filter(p => p._id !== problemId));
      toast.success('Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  // Theme-specific classes
  const bgClass = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const cardClass = isDark 
    ? 'bg-gray-900 border-gray-800' 
    : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className={`${cardClass} rounded-xl p-8 text-center max-w-md border`}>
          <FiBookmark className={`mx-auto h-12 w-12 ${subTextClass} mb-4`} />
          <h2 className={`text-2xl font-bold ${textClass} mb-2`}>Please Login</h2>
          <p className={`${subTextClass} mb-6`}>Login to view your bookmarked problems</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} py-6 px-4`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-500">
              <FiBookmark className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Favorite Problems</h1>
              <p className={`text-sm ${subTextClass}`}>{bookmarkedProblems.length} problems bookmarked</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Bookmarks List */}
        {bookmarkedProblems.length > 0 ? (
          <div className="space-y-4">
            {bookmarkedProblems.map(problem => (
              <Link
                key={problem._id}
                to={`/problem/${problem._id}`}
                className={`block ${cardClass} rounded-xl border p-5 transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-bold ${textClass} group-hover:text-rose-500`}>
                        {problem.title}
                      </h3>
                      <FiStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {problem.tags?.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full ${subTextClass}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`text-xs ${subTextClass}`}>
                      Acceptance: {problem.metadata?.acceptanceRate?.toFixed(1) || 0}%
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => removeBookmark(problem._id, e)}
                    className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                    title="Remove bookmark"
                  >
                    <FiTrash2 className={`h-5 w-5 ${subTextClass} hover:text-red-500`} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={`${cardClass} rounded-xl p-12 text-center border`}>
            <FiBookmark className={`mx-auto h-12 w-12 ${subTextClass} mb-4`} />
            <h3 className={`text-xl font-bold ${textClass} mb-2`}>No bookmarks yet</h3>
            <p className={`${subTextClass} mb-6`}>Start bookmarking problems you want to revisit</p>
            <Link
              to="/problems"
              className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg"
            >
              Browse Problems
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteProblems;