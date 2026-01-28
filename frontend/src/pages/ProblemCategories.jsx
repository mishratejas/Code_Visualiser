import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const categories = [
  { name: 'Array', icon: '📊', color: 'from-blue-500 to-cyan-500', description: 'Array manipulation and algorithms' },
  { name: 'String', icon: '📝', color: 'from-purple-500 to-pink-500', description: 'String processing and pattern matching' },
  { name: 'Dynamic Programming', icon: '🧮', color: 'from-green-500 to-teal-500', description: 'Optimization problems' },
  { name: 'Tree', icon: '🌳', color: 'from-yellow-500 to-orange-500', description: 'Tree data structures' },
  { name: 'Graph', icon: '🕸️', color: 'from-red-500 to-rose-500', description: 'Graph algorithms' },
  { name: 'Binary Search', icon: '🔍', color: 'from-indigo-500 to-blue-500', description: 'Search algorithms' },
  { name: 'Sorting', icon: '📈', color: 'from-pink-500 to-red-500', description: 'Sorting techniques' },
  { name: 'Hash Table', icon: '#️⃣', color: 'from-teal-500 to-green-500', description: 'Hash-based data structures' },
  { name: 'Stack', icon: '📚', color: 'from-orange-500 to-amber-500', description: 'Stack operations' },
  { name: 'Queue', icon: '🎯', color: 'from-cyan-500 to-blue-500', description: 'Queue operations' },
];

const ProblemCategories = () => {
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const response = await api.get('/problems/tags/stats');
      const stats = {};
      response.data?.data?.tagStats?.forEach(stat => {
        stats[stat._id] = {
          count: stat.count,
          avgAcceptance: stat.avgAcceptance
        };
      });
      setCategoryStats(stats);
    } catch (error) {
      toast.error('Failed to fetch category stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-10"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <FiCode />
              Problem Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Browse problems by topic and master each category
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const stats = categoryStats[category.name] || { count: 0, avgAcceptance: 0 };
            
            return (
              <Link
                key={category.name}
                to={`/problems?tags=${encodeURIComponent(category.name)}`}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-transform">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{category.icon}</div>
                    <div className={`p-2 bg-gradient-to-r ${category.color} rounded-lg`}>
                      <FiTrendingUp className="text-white w-5 h-5" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.count}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Problems
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.avgAcceptance ? stats.avgAcceptance.toFixed(1) : '0'}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Avg Acceptance
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProblemCategories;