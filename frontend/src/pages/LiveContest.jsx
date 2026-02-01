import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiClock, FiUsers, FiTarget, FiCode, FiChevronRight, FiChevronLeft,
  FiBarChart2, FiAward, FiBell, FiSettings, FiDownload, FiShare2,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiEye
} from 'react-icons/fi';
import { MdOutlineLeaderboard, MdOutlineEmojiEvents } from 'react-icons/md';
import { TbTrophy } from 'react-icons/tb';
import socketService from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ContestTimer from '../components/contests/ContestTimer';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const LiveContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('problems');
  const [submissions, setSubmissions] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchContest();
    
    // Try to connect to socket (with error handling)
    try {
      const socket = socketService.connect();
      
      // Check if methods exist before calling
      if (typeof socketService.joinContest === 'function') {
        socketService.joinContest(id, user?.id);
      }
      setIsConnected(true);

      // Listen for real-time updates (only if methods exist)
      if (typeof socketService.onLeaderboardUpdate === 'function') {
        socketService.onLeaderboardUpdate((newLeaderboard) => {
          console.log('📊 Leaderboard updated!');
          setLeaderboard(newLeaderboard);
          
          // Show toast for significant rank changes
          if (leaderboard.length > 0) {
            const oldRank = leaderboard.findIndex(l => l.userId === user?.id);
            const newRank = newLeaderboard.findIndex(l => l.userId === user?.id);
            if (oldRank !== -1 && newRank !== -1 && oldRank !== newRank) {
              const direction = newRank < oldRank ? '↑' : '↓';
              const change = Math.abs(newRank - oldRank);
              if (change > 0) {
                toast.success(`Rank ${direction}${change} places!`);
              }
            }
          }
        });
      }

      if (typeof socketService.onContestStatus === 'function') {
        socketService.onContestStatus((data) => {
          if (data.status === 'ended') {
            toast.success('Contest has ended!');
            navigate(`/contests/${id}/results`);
          }
        });
      }

      if (typeof socketService.onNewSubmission === 'function') {
        socketService.onNewSubmission((submission) => {
          setLiveUpdates(prev => [submission, ...prev.slice(0, 9)]);
          
          if (submission.userId !== user?.id) {
            toast(`${submission.username} solved ${submission.problem}!`, {
              icon: '🎯',
            });
          }
        });
      }
    } catch (error) {
      console.warn('Socket connection failed, using polling mode:', error);
      setIsConnected(false);
    }

    // Timer
    const timer = setInterval(() => {
      if (contest) {
        const now = new Date().getTime();
        const end = new Date(contest.endTime).getTime();
        const remaining = Math.max(0, end - now);
        setTimeRemaining(remaining);

        // Auto-submit notification
        if (remaining === 30 * 60 * 1000) { // 30 minutes remaining
          toast('⏰ 30 minutes remaining!', {
            duration: 60000,
            icon: '🚨',
          });
        } else if (remaining === 5 * 60 * 1000) { // 5 minutes remaining
          toast('⚠️ 5 minutes remaining! Submit your solutions!', {
            duration: 60000,
            icon: '⚡',
          });
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      try {
        if (typeof socketService.leaveContest === 'function') {
          socketService.leaveContest(id);
        }
        if (typeof socketService.disconnect === 'function') {
          socketService.disconnect();
        }
      } catch (error) {
        console.warn('Socket cleanup failed:', error);
      }
      setIsConnected(false);
    };
  }, [id, user, contest]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contests/${id}`);
      
      if (response.data?.contest) {
        setContest(response.data.contest);
        setProblems(response.data.problems || []);
        setLeaderboard(response.data.leaderboard || []);
        
        // Mock live updates
        setLiveUpdates([
          { id: 1, username: 'coder123', problem: 'Two Sum', time: '2 minutes ago', status: 'accepted' },
          { id: 2, username: 'alice456', problem: 'Binary Search', time: '3 minutes ago', status: 'accepted' },
          { id: 3, username: 'bob789', problem: 'DFS Maze', time: '4 minutes ago', status: 'wrong' },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch contest:', error);
      toast.error('Failed to load contest');
      navigate('/contests');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProblemClick = (problemId) => {
    navigate(`/contests/${id}/problems/${problemId}`);
  };

  const handleSubmit = (problemId) => {
    toast.success('Opening submission page...');
    navigate(`/contests/${id}/submit/${problemId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Loader />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50">
            <MdOutlineEmojiEvents className="h-10 w-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Contest Not Found</h2>
          <p className="text-gray-400 mb-6">The contest you're looking for doesn't exist or has ended.</p>
          <button
            onClick={() => navigate('/contests')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Browse Contests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/contests')}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <MdOutlineEmojiEvents className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{contest.title}</h1>
                  <p className="text-sm text-gray-400">Live Contest</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-sm">{isConnected ? 'Live' : 'Polling'}</span>
              </div>
              
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <FiSettings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Timer & Stats */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{contest.title}</h2>
                  <p className="text-gray-400">{contest.description}</p>
                </div>
                
                <ContestTimer
                  startTime={contest.startTime}
                  endTime={contest.endTime}
                  size="large"
                  showLabels={true}
                  onEnd={() => navigate(`/contests/${id}/results`)}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/30 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white">{problems.length}</div>
                  <div className="text-sm text-gray-400 mt-1">Problems</div>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white">{contest.participantsCount || leaderboard.length}</div>
                  <div className="text-sm text-gray-400 mt-1">Participants</div>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {leaderboard.find(l => l.userId === user?.id)?.rank || '—'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Your Rank</div>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {leaderboard.find(l => l.userId === user?.id)?.score || 0}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Your Score</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="border-b border-gray-700/50">
                <nav className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('problems')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'problems'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300'
                      }`}
                  >
                    <FiCode className="h-5 w-5" />
                    Problems
                  </button>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'submissions'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300'
                      }`}
                  >
                    <FiCheckCircle className="h-5 w-5" />
                    My Submissions
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'rules'
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-gray-300'
                      }`}
                  >
                    <FiAlertCircle className="h-5 w-5" />
                    Rules
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'problems' && (
                  <div className="space-y-4">
                    {problems.map((problem, index) => (
                      <div
                        key={problem._id}
                        className="group bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer"
                        onClick={() => handleProblemClick(problem._id)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                {problem.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                  problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {problem.difficulty}
                                </span>
                                <span className="text-sm text-gray-400">{problem.points} points</span>
                                <span className="text-sm text-gray-400">{problem.acceptance}% acceptance</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmit(problem._id);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                          >
                            Submit
                          </button>
                        </div>
                        <p className="text-gray-400 line-clamp-2">{problem.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'submissions' && (
                  <div className="space-y-4">
                    {submissions.length > 0 ? (
                      submissions.map((submission) => (
                        <div key={submission._id} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{submission.problemTitle}</div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span>{submission.language}</span>
                                <span>•</span>
                                <span>{submission.time}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              submission.status === 'accepted'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-2xl flex items-center justify-center">
                          <FiCode className="h-8 w-8 text-gray-500" />
                        </div>
                        <p className="text-gray-400">No submissions yet. Start solving problems!</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                      <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                        <FiAlertCircle className="h-5 w-5 text-blue-400" />
                        Contest Rules
                      </h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• All submissions are final and cannot be reverted</li>
                        <li>• Plagiarism will result in immediate disqualification</li>
                        <li>• Solutions must pass all test cases to get points</li>
                        <li>• The contest ends exactly at the scheduled time</li>
                        <li>• Respect other participants and maintain fair play</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Live Leaderboard */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MdOutlineLeaderboard className="h-5 w-5 text-yellow-400" />
                  Live Leaderboard
                </h3>
                <button
                  onClick={fetchContest}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`p-3 rounded-xl transition-all ${entry.userId === user?.id
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                        : index < 3
                          ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-gray-800/30 border border-gray-700/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                          {index < 3 ? (
                            <TbTrophy className={`h-5 w-5 ${
                              index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-gray-300' :
                              'text-amber-600'
                            }`} />
                          ) : (
                            <span className="font-bold">#{entry.rank}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {entry.username}
                            {entry.userId === user?.id && (
                              <span className="ml-2 text-xs text-blue-400">(You)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{entry.solved} solved</div>
                        </div>
                      </div>
                      <div className="font-bold text-white">{entry.score}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate(`/contests/${id}/leaderboard`)}
                className="w-full mt-4 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
              >
                View Full Leaderboard
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Live Updates */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiBell className="h-5 w-5 text-green-400" />
                Live Updates
              </h3>
              
              <div className="space-y-3">
                {liveUpdates.map((update) => (
                  <div key={update.id} className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{update.username}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        update.status === 'accepted'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {update.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Solved <span className="text-white">{update.problem}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{update.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">View All Problems</span>
                  <FiCode className="h-4 w-4 text-blue-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">Download Scoreboard</span>
                  <FiDownload className="h-4 w-4 text-green-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-300">Share Contest</span>
                  <FiShare2 className="h-4 w-4 text-purple-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate(`/contests/${id}/leaderboard`)}
          className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          <MdOutlineLeaderboard className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default LiveContest;