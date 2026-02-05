import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Users, Award, Filter, ChevronDown, ChevronUp, 
  TrendingUp, Plus, Search
} from 'lucide-react';
import { MdOutlineEmojiEvents, MdRocketLaunch } from 'react-icons/md';
import { TbTrophy } from 'react-icons/tb';
import { format } from 'date-fns';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import ContestTimer from '../components/contests/ContestTimer';
import { useAuth } from '../context/AuthContext';

const Contests = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0
  });

  // ✅ Registration Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [contestPassword, setContestPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchContests();
  }, [filter]);

  const safeDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const safeFormat = (dateValue, formatString) => {
    const date = safeDate(dateValue);
    if (!date) return 'Invalid Date';
    try {
      return format(date, formatString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await api.get('/contests', { params });
      
      let contestsData = [];
      
      if (response && response.data) {
        if (response.data.contests && Array.isArray(response.data.contests)) {
          contestsData = response.data.contests;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          contestsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          contestsData = response.data;
        } else if (Array.isArray(response)) {
          contestsData = response;
        }
      }
      
      setContests(contestsData);
      
      // Calculate stats
      const now = new Date();
      const statsData = {
        total: contestsData.length,
        upcoming: contestsData.filter(c => {
          const start = safeDate(c.startTime || c.start_time);
          return start && start > now;
        }).length,
        ongoing: contestsData.filter(c => {
          const start = safeDate(c.startTime || c.start_time);
          const end = safeDate(c.endTime || c.end_time);
          return start && end && start <= now && end >= now;
        }).length,
        past: contestsData.filter(c => {
          const end = safeDate(c.endTime || c.end_time);
          return end && end < now;
        }).length
      };
      setStats(statsData);
      
    } catch (error) {
      console.error('Failed to fetch contests:', error);
      toast.error('Failed to fetch contests');
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = safeDate(contest.startTime || contest.start_time);
    const end = safeDate(contest.endTime || contest.end_time);

    if (!start || !end) return 'unknown';
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'past';
  };

  const getTimeRemaining = (contest) => {
    const now = new Date();
    const start = safeDate(contest.startTime || contest.start_time);
    const end = safeDate(contest.endTime || contest.end_time);

    if (!start || !end) return 'Date unavailable';

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Starts in ${days}d ${hours}h`;
    } else if (now >= start && now <= end) {
      const diff = end - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Ends in ${hours}h ${minutes}m`;
    } else {
      return 'Ended';
    }
  };

  // ✅ Registration Handler
  const handleRegisterClick = (contest) => {
    if (!user) {
      toast.error('Please login to register for contests');
      return;
    }

    setSelectedContest(contest);
    
    // Check if contest is private
    if (contest.is_private || contest.isPrivate) {
      setShowPasswordModal(true);
    } else {
      registerForContest(contest.id || contest._id, null);
    }
  };

  // ✅ Register for Contest
  const registerForContest = async (contestId, password = null) => {
    try {
      setRegistering(true);
      
      const payload = password ? { password } : {};
      
      await api.post(`/contests/${contestId}/register`, payload);
      
      toast.success('Successfully registered for contest! 🎉');
      setShowPasswordModal(false);
      setContestPassword('');
      setSelectedContest(null);
      
      // Refresh contests to update participant count
      fetchContests();
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  // ✅ Handle Password Submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!contestPassword.trim()) {
      toast.error('Please enter the contest password');
      return;
    }
    
    registerForContest(selectedContest.id || selectedContest._id, contestPassword);
  };

  // Filter contests based on search and difficulty
  const filteredContests = contests.filter(contest => {
    const matchesSearch = !searchQuery || 
      contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contest.description && contest.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'all' || 
      contest.difficulty === selectedDifficulty;
    
    const matchesFilter = filter === 'all' || 
      getContestStatus(contest) === filter;
    
    return matchesSearch && matchesDifficulty && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 p-8 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <MdOutlineEmojiEvents className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Contests</h1>
                  <p className="text-blue-100 mt-2 text-lg">
                    Compete with coders worldwide and climb the leaderboard
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-6">
                {user?.role === 'admin' && (
                  <Link
                    to="/contests/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    Create Contest
                  </Link>
                )}
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
                >
                  <TbTrophy className="h-5 w-5" />
                  View Leaderboard
                </Link>
              </div>
            </div>
            
            {/* Stats Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[250px]">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-blue-200 mt-1">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{stats.ongoing}</div>
                  <div className="text-sm text-blue-200 mt-1">Live Now</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{stats.upcoming}</div>
                  <div className="text-sm text-blue-200 mt-1">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">{stats.past}</div>
                  <div className="text-sm text-blue-200 mt-1">Past</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Contest */}
      {filteredContests.length > 0 && getContestStatus(filteredContests[0]) === 'upcoming' && (
        <div className="relative overflow-hidden rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          
          <div className="relative z-10 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <MdRocketLaunch className="h-4 w-4" />
                  <span className="text-sm font-medium">FEATURED CONTEST</span>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-3">
                  {filteredContests[0].title}
                </h2>
                
                <p className="text-gray-300 mb-6 text-lg">
                  {filteredContests[0].description}
                </p>
                
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <span>{safeFormat(filteredContests[0].startTime || filteredContests[0].start_time, 'MMM dd, yyyy • hh:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="h-5 w-5 text-green-400" />
                    <span>{filteredContests[0].duration || filteredContests[0].duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-5 w-5 text-purple-400" />
                    <span>{filteredContests[0].participants?.length || filteredContests[0].participantsCount || 0} registered</span>
                  </div>
                </div>
                
                <ContestTimer
                  startTime={filteredContests[0].startTime || filteredContests[0].start_time}
                  endTime={filteredContests[0].endTime || filteredContests[0].end_time}
                  size="large"
                  showLabels={true}
                />
              </div>
              
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30 min-w-[200px]">
                  <div className="text-center mb-4">
                    <div className="text-sm text-blue-300 mb-2">Registration Open</div>
                    <div className="text-2xl font-bold text-white">
                      {getTimeRemaining(filteredContests[0])}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link
                      to={`/contests/${filteredContests[0]._id || filteredContests[0].id}`}
                      className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all text-center"
                    >
                      View Details
                    </Link>
                    <button 
                      onClick={() => handleRegisterClick(filteredContests[0])}
                      className="block w-full px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search contests by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700/50 border border-gray-600 rounded-xl hover:bg-gray-700 transition-all text-white"
          >
            <Filter className="h-5 w-5" />
            Filters
            {showFilters ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Status</h4>
              <div className="flex flex-wrap gap-3">
                {['all', 'upcoming', 'ongoing', 'past'].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setFilter(statusOption)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filter === statusOption
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Difficulty</h4>
              <div className="flex flex-wrap gap-3">
                {['all', 'easy', 'medium', 'hard'].map((diffOption) => (
                  <button
                    key={diffOption}
                    onClick={() => setSelectedDifficulty(diffOption)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedDifficulty === diffOption
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {diffOption.charAt(0).toUpperCase() + diffOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contest Grid */}
      {filteredContests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContests.map((contest, index) => {
            const status = getContestStatus(contest);
            const isFeatured = index === 0 && status === 'upcoming';
            
            if (isFeatured) return null;

            const contestId = contest._id || contest.id;

            return (
              <div
                key={contestId}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${
                    status === 'upcoming'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : status === 'ongoing'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white'
                  }`}>
                    {status === 'upcoming' ? 'Upcoming' : status === 'ongoing' ? 'Live Now' : 'Ended'}
                  </span>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <Link
                      to={`/contests/${contestId}`}
                      className="text-xl font-bold text-white hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {contest.title}
                    </Link>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {contest.description}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="mr-3 h-5 w-5 text-blue-400" />
                      <span className="text-sm">{safeFormat(contest.startTime || contest.start_time, 'MMM dd, yyyy • hh:mm a')}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock className="mr-3 h-5 w-5 text-green-400" />
                      <span className="text-sm">{contest.duration || contest.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Users className="mr-3 h-5 w-5 text-purple-400" />
                      <span className="text-sm">{contest.participants?.length || contest.participantsCount || 0} participants</span>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
                    <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
                    <div className="font-medium text-white text-lg">
                      {getTimeRemaining(contest)}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/contests/${contestId}`}
                      className="flex-1 text-center px-4 py-2.5 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium"
                    >
                      View Details
                    </Link>
                    {status === 'upcoming' && (
                      <button 
                        onClick={() => handleRegisterClick(contest)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        Register
                      </button>
                    )}
                    {status === 'ongoing' && (
                      <Link
                        to={`/contests/${contestId}/live`}
                        className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        Enter Contest
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-xl">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-700/50">
            <MdOutlineEmojiEvents className="h-12 w-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            No contests found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {filter !== 'all'
              ? `No ${filter} contests match your filters. Try adjusting your search criteria.`
              : 'No contests available at the moment. Check back later!'}
          </p>
          <button
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
              setSelectedDifficulty('all');
            }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ✅ PASSWORD MODAL */}
      {showPasswordModal && selectedContest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Private Contest</h3>
              <p className="text-gray-400">
                This contest requires a password to register
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contest Password
                </label>
                <input
                  type="password"
                  value={contestPassword}
                  onChange={(e) => setContestPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-all"
                  autoFocus
                  disabled={registering}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setContestPassword('');
                    setSelectedContest(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium"
                  disabled={registering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={registering || !contestPassword.trim()}
                >
                  {registering ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-sm text-blue-300 text-center">
                <strong>{selectedContest.title}</strong>
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                {safeFormat(selectedContest.startTime || selectedContest.start_time, 'MMM dd, yyyy • hh:mm a')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg">Earn Rewards</h4>
          </div>
          <p className="text-gray-300 text-sm">
            Win cash prizes, certificates, and premium subscriptions by performing well in contests.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-2xl border border-green-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg">Improve Skills</h4>
          </div>
          <p className="text-gray-300 text-sm">
            Compete with top coders worldwide and enhance your problem-solving skills under time pressure.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl border border-purple-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg">Global Ranking</h4>
          </div>
          <p className="text-gray-300 text-sm">
            Get ranked globally and showcase your achievements to recruiters and the developer community.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="relative z-10 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Compete?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of developers in our coding contests. Test your skills, learn from others, and climb the global leaderboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.role === 'admin' && (
              <Link
                to="/contests/create"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
              >
                <Plus className="h-5 w-5" />
                Create Your Contest
              </Link>
            )}
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-bold"
            >
              <TbTrophy className="h-5 w-5" />
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contests;