import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiCalendar, FiClock, FiUsers, FiLock, FiUnlock, 
  FiCode, FiCheckCircle, FiAlertCircle, FiArrowRight,
  FiTag, FiAward, FiInfo, FiShield
} from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import Loader from '../components/common/Loader';

const ContestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [endingContest, setEndingContest] = useState(false);

  useEffect(() => {
    fetchContest();
  }, [id]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contests/${id}`);
      const contestData = response.data?.data || response.data;
      setContest(contestData);
      setLeaderboard(contestData?.leaderboard || []);
      // Fetch live leaderboard separately
      try {
        const lb = await api.get(`/contests/${id}/leaderboard`);
        const lbData = lb.data?.data || lb.data || [];
        if (Array.isArray(lbData)) setLeaderboard(lbData);
      } catch { /* optional */ }
    } catch (error) {
      console.error('Failed to fetch contest:', error);
      toast.error('Failed to load contest');
      navigate('/contests');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (contestPassword = null) => {
    if (!user) {
      toast.error('Please login to register for contests');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const payload = contest.is_private ? { password: contestPassword } : {};
      await api.post(`/contests/${id}/register`, payload);
      
      toast.success('Successfully registered for contest!', {
        icon: '🎉',
        duration: 4000
      });
      
      setShowPasswordModal(false);
      setPassword('');
      
      // Refresh contest data to update registration status
      await fetchContest();
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    if (contest.is_private) {
      setShowPasswordModal(true);
    } else {
      handleRegister();
    }
  };

  const handleEndContest = async () => {
    if (!window.confirm(`End "${contest.title}" now and apply ratings? This cannot be undone.`)) return;
    setEndingContest(true);
    try {
      await api.post(`/contests/${id}/end`);
      toast.success('Contest ended — ratings applied!', { icon: '🏆', duration: 5000 });
      fetchContest();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to end contest');
    } finally {
      setEndingContest(false);
    }
  };

  const handleEnterContest = () => {
    navigate(`/contests/${id}/live`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700">
          <FiAlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Contest Not Found</h2>
          <p className="text-gray-400 mb-6">The contest you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/contests')}
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Browse Contests
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(contest.startTime);
  const end = new Date(contest.endTime);
  
  const isUpcoming = now < start;
  const isLive = now >= start && now <= end;
  const isEnded = now > end;

  const canRegister = isUpcoming && contest.registration_open && !contest.isRegistered;

  // Difficulty colors
  const difficultyColors = {
    easy: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    hard: 'text-red-400 bg-red-500/10 border-red-500/30'
  };

  const difficultyClass = difficultyColors[contest.difficulty] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Contest Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 opacity-90"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <MdOutlineEmojiEvents className="h-8 w-8 text-white" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {isLive && (
                    <span className="px-4 py-2 bg-green-500 text-white rounded-full font-medium flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Live Now
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium shadow-lg">
                      Upcoming
                    </span>
                  )}
                  {isEnded && (
                    <span className="px-4 py-2 bg-gray-600 text-white rounded-full font-medium shadow-lg">
                      Ended
                    </span>
                  )}
                  {contest.is_private && (
                    <span className="px-4 py-2 bg-purple-500/30 text-white rounded-full font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20">
                      <FiLock className="h-4 w-4" />
                      Private
                    </span>
                  )}
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 break-words">{contest.title}</h1>
              {contest.description && (
                <p className="text-blue-100 text-lg max-w-3xl">{contest.description}</p>
              )}
            </div>
            
            {contest.difficulty && (
              <div className={`px-4 py-2 rounded-xl border font-medium ${difficultyClass} backdrop-blur-sm`}>
                {contest.difficulty.charAt(0).toUpperCase() + contest.difficulty.slice(1)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Status and Actions */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {contest.isRegistered ? (
              <>
                <div className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl flex items-center gap-2 shadow-lg">
                  <FiCheckCircle className="h-5 w-5" />
                  <span className="font-medium">Successfully Registered</span>
                </div>
                {isLive && (
                  <button
                    onClick={handleEnterContest}
                    className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>Enter Contest Now</span>
                    <FiArrowRight className="h-5 w-5" />
                  </button>
                )}
                {isUpcoming && (() => {
                    const diffMs = start - now;
                    const hrs    = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins   = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return (
                      <div className="flex items-center gap-2 text-blue-300">
                        <FiClock className="h-4 w-4" />
                        <span className="font-medium">
                          {hrs > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${mins} minute${mins !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    );
                  })()}
              </>
            ) : canRegister ? (
              <>
                <button
                  onClick={handleRegisterClick}
                  disabled={registering}
                  className="px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {contest.is_private && <FiLock className="h-5 w-5" />}
                  {registering ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Now</span>
                      <FiArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                <span className="text-gray-400">
                  {contest.max_participants ? 
                    `${contest.participantsCount}/${contest.max_participants} spots filled` : 
                    `${contest.participantsCount} registered`
                  }
                </span>
              </>
            ) : !contest.registration_open ? (
              <div className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl flex items-center gap-2 border border-red-500/30">
                <FiAlertCircle className="h-5 w-5" />
                <span className="font-medium">Registration Closed</span>
              </div>
            ) : isLive ? (
              <div className="px-6 py-3 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center gap-2 border border-yellow-500/30">
                <FiAlertCircle className="h-5 w-5" />
                <span className="font-medium">Contest has started - Registration closed</span>
              </div>
            ) : isEnded ? (
              <div className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl flex items-center gap-2 border border-gray-500/30">
                <FiAlertCircle className="h-5 w-5" />
                <span className="font-medium">Contest has ended</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Admin: Plagiarism Panel shortcut */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="space-y-3">
          {/* Plagiarism Panel */}
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
                <FiShield className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Plagiarism Detection</div>
                <div className="text-sm text-gray-400">Review and manage suspicious submissions for this contest</div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/contests/${id}/plagiarism`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all font-medium whitespace-nowrap"
            >
              <FiShield className="h-4 w-4" />
              Open Plagiarism Panel
            </button>
          </div>
        </div>
      )}

      {/* Contest Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-rose-500/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <FiCalendar className="text-rose-400 h-5 w-5" />
            </div>
            <div className="text-sm text-gray-400">Start Time</div>
          </div>
          <div className="text-white font-bold text-lg">
            {new Date(contest.startTime).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {new Date(contest.startTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-rose-500/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <FiClock className="text-rose-400 h-5 w-5" />
            </div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
          <div className="text-white font-bold text-lg">
            {Math.floor(contest.duration / 60)}h {contest.duration % 60}m
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Total time
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-rose-500/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <FiUsers className="text-rose-400 h-5 w-5" />
            </div>
            <div className="text-sm text-gray-400">Participants</div>
          </div>
          <div className="text-white font-bold text-lg">{contest.participantsCount}</div>
          <div className="text-gray-400 text-sm mt-1">
            {contest.max_participants ? `of ${contest.max_participants} max` : 'Unlimited'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 hover:border-rose-500/50 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <FiCode className="text-rose-400 h-5 w-5" />
            </div>
            <div className="text-sm text-gray-400">Problems</div>
          </div>
          <div className="text-white font-bold text-lg">{contest.problemsCount}</div>
          <div className="text-gray-400 text-sm mt-1">
            Total challenges
          </div>
        </div>
      </div>

      {/* Tags */}
      {contest.tags && contest.tags.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <FiTag className="text-rose-400 h-5 w-5" />
            <h2 className="text-xl font-bold text-white">Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {contest.tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm border border-gray-600/50">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      {contest.rules && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <FiInfo className="text-rose-400 h-5 w-5" />
            <h2 className="text-xl font-bold text-white">Rules & Guidelines</h2>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{contest.rules}</p>
        </div>
      )}

      {/* Prizes */}
      {contest.prizes && contest.prizes.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <FiAward className="text-rose-400 h-5 w-5" />
            <h2 className="text-xl font-bold text-white">Prizes</h2>
          </div>
          <ul className="space-y-2">
            {contest.prizes.map((prize, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-300">
                <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold text-sm">
                  {index + 1}
                </span>
                <span>{prize}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Problems List */}
      {contest.problems && contest.problems.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiCode className="text-rose-400 h-6 w-6" />
              Contest Problems
            </h2>
            <span className="text-gray-400">{contest.problems.length} problems</span>
          </div>
          
          <div className="space-y-3">
            {contest.problems.map((problem, index) => {
              const problemDifficultyColor = {
                easy: 'text-green-400',
                medium: 'text-yellow-400',
                hard: 'text-red-400'
              }[problem.difficulty] || 'text-gray-400';

              return (
                <div key={problem._id} className="bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800/70 transition-all border border-gray-700/50 hover:border-rose-500/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="flex items-center justify-center w-10 h-10 bg-rose-500/20 text-rose-400 rounded-lg font-bold shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-lg mb-1">{problem.title}</div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`font-medium ${problemDifficultyColor}`}>
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                          {problem.tags && problem.tags.length > 0 && (
                            <div className="flex gap-2">
                              {problem.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FiLock className="text-purple-400 h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Private Contest</h3>
                <p className="text-gray-400 text-sm">Password required</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              This is a private contest. Please enter the contest password to register.
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter contest password"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 mb-6 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && password) {
                  handleRegister(password);
                }
              }}
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
                disabled={registering}
                className="flex-1 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRegister(password)}
                disabled={registering || !password}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {registering ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="h-4 w-4" />
                    <span>Register</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestDetail;