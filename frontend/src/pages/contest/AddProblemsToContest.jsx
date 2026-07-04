import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiCheck, FiX, FiSearch, FiChevronLeft } from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';

const AddProblemsToContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [id]);

const fetchData = async () => {
  try {
    setLoading(true);
    console.log('🔍 Fetching contest and problems...');
    
    const [contestRes, problemsRes] = await Promise.all([
      api.get(`/contests/${id}`),
      api.get('/problems')
    ]);

    // ✅ FIX: Handle response.data.data (new backend structure)
    const contestData = contestRes.data?.data || contestRes.data?.contest || contestRes.data;
    console.log('✅ Contest data:', contestData);
    setContest(contestData);

    // ✅ FIX: Handle different response structures for problems
    const problemsData = problemsRes.data?.problems || 
                        problemsRes.data?.data?.problems ||
                        problemsRes.data?.data ||
                        problemsRes.data ||
                        [];
    
    console.log('📦 Raw problems data:', problemsData);
    
    const problemsList = Array.isArray(problemsData) ? problemsData : [];
    console.log('📋 Problems array:', problemsList.length, 'items');
    
    const publishedProblems = problemsData; 
    
    console.log('✅ Found', publishedProblems.length, 'published problems out of', problemsList.length, 'total');
    
    if (publishedProblems.length === 0) {
      console.warn('⚠️ No published problems found.');
      toast.error('No published problems available. Please publish some problems first.', {
        duration: 5000
      });
    }
    
    setProblems(publishedProblems);

    // Pre-select already added problems
    if (contestData.problem_ids && Array.isArray(contestData.problem_ids)) {
      console.log('📌 Pre-selecting', contestData.problem_ids.length, 'existing problems');
      setSelectedProblems(contestData.problem_ids);
    }
  } catch (error) {
    console.error('❌ Failed to fetch data:', error);
    toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
    navigate('/contests');
  } finally {
    setLoading(false);
  }
};
  const toggleProblem = (problemId) => {
    setSelectedProblems(prev =>
      prev.includes(problemId)
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  const handleSubmit = async () => {
    if (selectedProblems.length === 0) {
      toast.error('Please select at least one problem');
      return;
    }

    if (submitting) {
      console.log('⚠️ Already submitting, ignoring duplicate');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📤 Submitting', selectedProblems.length, 'problems to contest', id);
      
      const response = await api.post(`/contests/${id}/problems`, {
        problem_ids: selectedProblems
      });

      console.log('✅ Response:', response.data);
      
      toast.success(`Successfully added ${selectedProblems.length} problem(s) to contest!`, {
        duration: 3000,
        icon: '🎉'
      });
      
      // Navigate back to contests
      navigate('/contests');
    } catch (error) {
      console.error('❌ Failed to add problems:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to add problems');
      setSubmitting(false);
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = !searchQuery ||
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty = difficultyFilter === 'all' ||
      problem.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader />
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading contest and problems...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Contest not found</p>
          <button
            onClick={() => navigate('/contests')}
            className="mt-4 px-6 py-2 bg-blue-600 text-gray-900 dark:text-white rounded-lg hover:bg-blue-700"
          >
            Back to Contests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative z-10 p-8 text-gray-900 dark:text-white">
          <button
            onClick={() => navigate('/contests')}
            className="flex items-center gap-2 mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
          >
            <FiChevronLeft className="h-5 w-5" />
            Back to Contests
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <MdOutlineEmojiEvents className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Add Problems to Contest</h1>
              <p className="text-blue-100 mt-2 text-lg">{contest.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {selectedProblems.length} problem{selectedProblems.length !== 1 ? 's' : ''} selected
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
              {filteredProblems.length} available
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700/50 shadow-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search problems by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-200 dark:bg-gray-700/50 border border-gray-400 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700/50 border border-gray-400 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition-all min-w-[180px]"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problems List */}
      <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700/50 shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Available Problems</h2>
        
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center">
              <FiSearch className="h-8 w-8 text-gray-600 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {problems.length === 0 
                ? 'No published problems available. Please publish some problems first.'
                : 'No problems found matching your filters'}
            </p>
            {(searchQuery || difficultyFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('all');
                }}
                className="mt-4 text-rose-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredProblems.map((problem) => {
              const isSelected = selectedProblems.includes(problem._id);
              return (
                <div
                  key={problem._id}
                  onClick={() => toggleProblem(problem._id)}
                  className={`group p-5 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/10 shadow-lg'
                      : 'border-gray-300 dark:border-gray-700 hover:border-rose-500/40 bg-gray-100 dark:bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                    }`}>
                      {isSelected ? (
                        <FiCheck className="h-6 w-6 text-gray-900 dark:text-white" />
                      ) : (
                        <FiPlus className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{problem.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {problem.description || 'No description available'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {problem.difficulty?.toUpperCase()}
                        </span>
                        
                        {problem.points && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {problem.points} points
                          </span>
                        )}
                        
                        {problem.tags && problem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {problem.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {problem.tags.length > 3 && (
                              <span className="text-xs text-gray-600 dark:text-gray-500">
                                +{problem.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700/50 shadow-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/contests')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700/50 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedProblems.length === 0}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              submitting || selectedProblems.length === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 to-red-600 text-gray-900 dark:text-white hover:shadow-lg'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Adding Problems...
              </span>
            ) : (
              `Add ${selectedProblems.length} Problem${selectedProblems.length !== 1 ? 's' : ''} to Contest`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProblemsToContest;