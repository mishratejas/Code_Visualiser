import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiTrendingUp, FiChevronRight, FiFilter, FiSearch, FiBarChart } from 'react-icons/fi';
import { TbCategory } from 'react-icons/tb';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Loader from '../components/common/Loader';

const categories = [
  { 
    name: 'Array', 
    icon: '📊', 
    color: 'from-blue-500 to-cyan-500',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
    description: 'Array manipulation and algorithms',
    tags: ['Two Pointers', 'Sliding Window', 'Prefix Sum']
  },
  { 
    name: 'String', 
    icon: '📝', 
    color: 'from-purple-500 to-pink-500',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    description: 'String processing and pattern matching',
    tags: ['DP', 'Two Pointers', 'Sliding Window']
  },
  { 
    name: 'Dynamic Programming', 
    icon: '🧮', 
    color: 'from-green-500 to-teal-500',
    gradient: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
    description: 'Optimization problems',
    tags: ['Memoization', 'Tabulation', 'State Machine']
  },
  { 
    name: 'Tree', 
    icon: '🌳', 
    color: 'from-yellow-500 to-orange-500',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    description: 'Tree data structures',
    tags: ['DFS', 'BFS', 'Binary Search Tree']
  },
  { 
    name: 'Graph', 
    icon: '🕸️', 
    color: 'from-red-500 to-rose-500',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #F43F5E 100%)',
    description: 'Graph algorithms',
    tags: ['BFS', 'DFS', 'Dijkstra', 'Union Find']
  },
  { 
    name: 'Binary Search', 
    icon: '🔍', 
    color: 'from-indigo-500 to-blue-500',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
    description: 'Search algorithms',
    tags: ['Binary Search', 'Lower/Upper Bound']
  },
  { 
    name: 'Sorting', 
    icon: '📈', 
    color: 'from-pink-500 to-red-500',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
    description: 'Sorting techniques',
    tags: ['Quick Sort', 'Merge Sort', 'Heap Sort']
  },
  { 
    name: 'Hash Table', 
    icon: '#️⃣', 
    color: 'from-teal-500 to-green-500',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #10B981 100%)',
    description: 'Hash-based data structures',
    tags: ['HashMap', 'HashSet', 'Collision']
  },
  { 
    name: 'Stack', 
    icon: '📚', 
    color: 'from-orange-500 to-amber-500',
    gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
    description: 'Stack operations',
    tags: ['LIFO', 'Monotonic Stack']
  },
  { 
    name: 'Queue', 
    icon: '🎯', 
    color: 'from-cyan-500 to-blue-500',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    description: 'Queue operations',
    tags: ['FIFO', 'Priority Queue', 'Deque']
  },
  { 
    name: 'Math', 
    icon: '🧮', 
    color: 'from-emerald-500 to-green-500',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    description: 'Mathematical problems',
    tags: ['Number Theory', 'Combinatorics', 'Probability']
  },
  { 
    name: 'Backtracking', 
    icon: '🔙', 
    color: 'from-violet-500 to-purple-500',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    description: 'Backtracking algorithms',
    tags: ['DFS', 'Pruning', 'State Space']
  },
];

const ProblemCategories = () => {
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

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
          avgAcceptance: stat.avgAcceptance,
          solved: Math.floor(Math.random() * stat.count),
        };
      });
      setCategoryStats(stats);
    } catch (error) {
      console.log('Using mock category stats');
      const mockStats = {};
      categories.forEach(cat => {
        mockStats[cat.name] = {
          count: Math.floor(Math.random() * 200) + 50,
          avgAcceptance: Math.floor(Math.random() * 40) + 30,
          solved: Math.floor(Math.random() * 50),
        };
      });
      setCategoryStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600">
                    <TbCategory className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Problem Categories
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                      Master algorithms by topic. Track progress and improve systematically.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full border border-blue-500/20">
                    <span className="text-blue-400">{categories.length} Categories</span>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full border border-purple-500/20">
                    <span className="text-purple-400">1000+ Problems</span>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full border border-green-500/20">
                    <span className="text-green-400">Interactive Learning</span>
                  </div>
                </div>
              </div>
              
              {/* Stats Overview */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 min-w-[250px]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Problems</span>
                    <span className="text-white font-bold">1,245</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Avg. Acceptance</span>
                    <span className="text-green-400 font-bold">42%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Categories Solved</span>
                    <span className="text-blue-400 font-bold">8/12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search categories, tags, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 justify-center">
                <FiFilter className="h-5 w-5" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const stats = categoryStats[category.name] || { count: 0, avgAcceptance: 0, solved: 0 };
            const progress = stats.count > 0 ? (stats.solved / stats.count) * 100 : 0;
            
            return (
              <Link
                key={category.name}
                to={`/problems?tags=${encodeURIComponent(category.name)}`}
                className="group relative transform transition-all duration-300 hover:-translate-y-1"
                onMouseEnter={() => setSelectedCategory(category.name)}
                onMouseLeave={() => setSelectedCategory(null)}
              >
                {/* Background Glow */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                  style={{ background: category.gradient }}
                ></div>
                
                {/* Card */}
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50 overflow-hidden">
                  {/* Animated Border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl ${selectedCategory === category.name ? 'scale-110' : ''} transition-transform duration-300`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {category.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <FiBarChart className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {stats.count} problems
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
                      <FiTrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                    {category.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {category.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full hover:bg-gray-600/50 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                    {category.tags.length > 3 && (
                      <span className="px-3 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                        +{category.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Your Progress</span>
                        <span className="text-white font-medium">
                          {stats.solved}/{stats.count} ({progress.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${progress}%`,
                            background: category.gradient
                          }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {stats.avgAcceptance ? stats.avgAcceptance.toFixed(1) : '0'}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Avg. Acceptance</div>
                      </div>
                      <div className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {stats.solved}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Solved</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {category.tags.length} topics to master
                      </span>
                      <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span className="text-sm font-medium">Explore</span>
                        <FiChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50">
              <FiSearch className="h-12 w-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No categories found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              No categories match your search. Try a different keyword or browse all categories.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Show All Categories
            </button>
          </div>
        )}

        {/* Footer CTA */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
          <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to master algorithms?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Start with one category at a time. Track your progress, earn badges, and climb the leaderboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/problems"
                className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 justify-center"
              >
                <FiCode className="h-5 w-5" />
                Start Practicing
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-3 bg-transparent text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                View Progress
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemCategories;