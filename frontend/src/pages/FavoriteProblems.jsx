import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import { BsStarFill } from 'react-icons/bs';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const FavoriteProblems = () => {
  const { user } = useAuth();
  const [bookmarkedProblems, setBookmarkedProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/users/me/bookmarks');
      const bookmarkIds = response.data?.bookmarks || response.data?.data?.bookmarks || [];
      
      // Fetch full problem details
      if (bookmarkIds.length > 0) {
        const problemsResponse = await api.get('/problems', {
          params: { ids: bookmarkIds.join(','), limit: 100 }
        });
        setBookmarkedProblems(problemsResponse.data?.problems || []);
      }
    } catch (error) {
      toast.error('Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (problemId, e) => {
    e.preventDefault();
    try {
      await api.post(`/users/bookmarks/${problemId}`);
      setBookmarkedProblems(prev => prev.filter(p => p._id !== problemId));
      toast.success('Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
              <BsStarFill className="text-yellow-600" />
              Favorite Problems
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              {bookmarkedProblems.length} problems bookmarked
            </p>
          </div>
        </div>

        {/* Bookmarked Problems */}
        {bookmarkedProblems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {bookmarkedProblems.map(problem => (
              <Link
                key={problem._id}
                to={`/problem/${problem._id}`}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 hover:scale-[1.02] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {problem.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {problem.tags?.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-3 py-1 rounded-lg font-bold ${
                          problem.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {problem.metadata?.acceptanceRate?.toFixed(1) || 0}% Acceptance
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeBookmark(problem._id, e)}
                      className="p-3 text-yellow-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BsStarFill className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No bookmarks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start bookmarking problems you want to revisit later
            </p>
            <Link
              to="/problems"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
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