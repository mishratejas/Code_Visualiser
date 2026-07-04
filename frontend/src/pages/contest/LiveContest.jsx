import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiClock,
  FiUsers,
  FiTarget,
  FiCode,
  FiChevronRight,
  FiChevronLeft,
  FiBarChart2,
  FiAward,
  FiBell,
  FiSettings,
  FiDownload,
  FiShare2,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiAlertTriangle,
} from "react-icons/fi";
import { MdOutlineLeaderboard, MdOutlineEmojiEvents } from "react-icons/md";
import { TbTrophy } from "react-icons/tb";
import socketService from "../../services/socket";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ContestTimer from "../../components/contests/ContestTimer";
import Loader from "../../components/common/Loader";
import { toast } from "react-hot-toast";

/**
 * ✅ IMPROVED: LiveContest with better error handling and user feedback
 */
const LiveContest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("problems");
  const [submissions, setSubmissions] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [endingContest, setEndingContest] = useState(false);

  // ✅ Use refs to prevent re-initialization
  const socketInitialized = useRef(false);
  const contestJoined = useRef(false);
  const timerRef = useRef(null);
  const leaderboardPollRef = useRef(null);

  // ✅ Fetch contest data (separate from socket)
  useEffect(() => {
    fetchContest();
  }, [id]);


  // ✅ Socket connection — uses stable ref so React StrictMode double-invoke is harmless
  useEffect(() => {
    if (!user?.id) return;

    // Guard: if already truly initialized (not just the StrictMode first-pass), skip
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const userId = user?.id || user?._id?.toString();

    const socket = socketService.connect();
    if (!socket) { setIsConnected(false); return; }

    const handleConnect = () => {
      setIsConnected(true);
      if (!contestJoined.current && id) {
        socketService.joinContest(id, userId);
        contestJoined.current = true;
      }
    };
    const handleDisconnect = (reason) => {
      setIsConnected(false);
      contestJoined.current = false;
      if (reason === 'io server disconnect') toast.error('Disconnected — reconnecting…', { duration: 3000 });
    };
    const handleConnectError = () => { setIsConnected(false); };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    if (socket.connected) handleConnect();

    socketService.onLeaderboardUpdate((lb) => {
      if (Array.isArray(lb) && lb.length > 0) setLeaderboard(lb);
    });
    socketService.onContestStatus((data) => {
      if (data.status === 'ended') { toast.success('Contest has ended!'); navigate(`/contests/${id}/results`); }
    });
    socketService.onNewSubmission((sub) => {
      setLiveUpdates(prev => [sub, ...prev.slice(0, 9)]);
      if (sub.userId !== userId) toast(`${sub.username} solved ${sub.problem}!`, { icon: '🎯' });
    });

    // Also subscribe to real-time notifications for this user
    socket.on(`notification`, (notif) => {
      toast(notif.message || notif.title, { icon: notif.icon || '🔔', duration: 4000 });
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('notification');
      if (contestJoined.current && socketService.isConnected()) socketService.leaveContest(id);
      socketService.cleanupContestListeners();
      // Don't reset socketInitialized here — StrictMode calls cleanup + re-run,
      // resetting it would cause double-connect. Reset only on true unmount via contestJoined.
      contestJoined.current = false;
    };
  }, [id, user?.id, user?._id]);

  // ✅ Timer (separate effect)
  useEffect(() => {
    if (!contest) return;

    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const remaining = Math.max(0, end - now);
      setTimeRemaining(remaining);

      // Notifications
      if (remaining === 30 * 60 * 1000) {
        toast("⏰ 30 minutes remaining!", {
          duration: 60000,
          icon: "🚨",
        });
      } else if (remaining === 5 * 60 * 1000) {
        toast("⚠️ 5 minutes remaining! Submit your solutions!", {
          duration: 60000,
          icon: "⚡",
        });
      } else if (remaining === 0) {
        toast.success("Contest has ended!");
        navigate(`/contests/${id}/results`);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (leaderboardPollRef.current) {
        clearInterval(leaderboardPollRef.current);
      }
    };
  }, [contest, id, navigate]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/contests/${id}`);

      // ✅ FIXED: Backend returns response.data.data
      const contestData = response.data?.data || response.data;

      console.log("📦 Contest response:", {
        hasData: !!contestData,
        isRegistered: contestData?.isRegistered,
        userId: user?.id,
        rawResponse: response.data,
      });

      if (contestData) {
        // ✅ Check if user is registered (backend now returns this)
        if (!contestData.isRegistered) {
          console.warn("⚠️ User not registered for contest");
          toast.error("You must register for this contest first", {
            duration: 5000,
            icon: "🔒",
          });
          navigate(`/contests/${id}`);
          return;
        }

        setContest(contestData);
        setProblems(contestData.problems || []);
        setLeaderboard(contestData.leaderboard || []);
        setRetryCount(0);

        // Fetch user's contest submissions
        try {
          const subsRes = await api.get(`/contests/${id}/submissions`);
          const subsData = subsRes.data?.submissions || subsRes.submissions || subsRes.data || [];
          const subsList = Array.isArray(subsData) ? subsData : [];
          setSubmissions(subsList);
          // Track which problems the current user has solved (accepted)
          const solved = new Set(
            subsList
              .filter(s => s.verdict === 'accepted' || s.status === 'accepted')
              .map(s => s.problem?._id || s.problemId || s.problem_id)
              .filter(Boolean)
          );
          setSolvedProblemIds(solved);
        } catch (e) {
          console.warn('Could not load contest submissions', e);
        }

        // Live leaderboard polling every 15s (fallback when socket is not connected)
        if (leaderboardPollRef.current) clearInterval(leaderboardPollRef.current);
        leaderboardPollRef.current = setInterval(async () => {
          try {
            const lb = await api.get(`/contests/${id}/leaderboard`);
            const lbData = lb.data?.data || lb.data || [];
            if (Array.isArray(lbData) && lbData.length > 0) setLeaderboard(lbData);
          } catch { /* silent */ }
        }, 15000);

        console.log("✅ Contest data loaded:", {
          title: contestData.title,
          problems: contestData.problems?.length || 0,
          isRegistered: contestData.isRegistered,
        });
      } else {
        throw new Error("Invalid contest data received");
      }
    } catch (error) {
      console.error("❌ Failed to fetch contest:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load contest";
      const statusCode = error.response?.status;

      setError({
        message: errorMessage,
        statusCode: statusCode,
        canRetry: statusCode !== 404,
      });

      if (statusCode === 404) {
        toast.error("Contest not found");
        setTimeout(() => navigate("/contests"), 2000);
      } else if (statusCode === 403) {
        toast.error("You do not have access to this contest");
        setTimeout(() => navigate("/contests"), 2000);
      } else if (statusCode === 500) {
        toast.error("Server error. Please try again.", { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchContest();
  };

  const handleEndContest = async () => {
    if (!window.confirm(`Force-end "${contest?.title}" now and apply ratings? This cannot be undone.`)) return;
    setEndingContest(true);
    try {
      await api.post(`/contests/${id}/end`);
      toast.success('Contest ended — ratings applied!', { icon: '🏆', duration: 5000 });
      navigate(`/contests/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to end contest');
    } finally {
      setEndingContest(false);
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProblemClick = (problemId) => {
    navigate(`/contests/${id}/problems/${problemId}`);
  };

  const handleSubmit = (problemId) => {
    toast.success("Opening problem...");
    navigate(`/contests/${id}/problems/${problemId}`); // ✅ Contest-specific route
  };

  // ✅ Enhanced Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-black">
        <div className="text-center">
          <Loader />
          <p className="text-gray-500 dark:text-gray-400 mt-4 animate-pulse">
            Loading contest data...
          </p>
          {retryCount > 0 && (
            <p className="text-gray-600 dark:text-gray-500 text-sm mt-2">
              Attempt {retryCount + 1}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Enhanced Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700/50 shadow-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
              <FiAlertTriangle className="h-10 w-10 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {error.statusCode === 404
                ? "Contest Not Found"
                : "Error Loading Contest"}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mb-6">{error.message}</p>

            {error.statusCode === 500 && (
              <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <FiAlertCircle className="inline mr-2" />
                  This might be a database issue. Please contact support if the
                  problem persists.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {error.canRetry && (
                <button
                  onClick={handleRetry}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  <FiRefreshCw className="h-5 w-5" />
                  Try Again
                </button>
              )}

              <button
                onClick={() => navigate("/contests")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
              >
                <FiChevronLeft className="h-5 w-5" />
                Back to Contests
              </button>
            </div>

            {retryCount > 2 && (
              <p className="text-sm text-gray-600 dark:text-gray-500 mt-4">
                Having trouble? Try refreshing the page or contact support.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-900 rounded-2xl flex items-center justify-center border border-gray-300 dark:border-gray-700/50">
            <MdOutlineEmojiEvents className="h-10 w-10 text-gray-600 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Contest Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The contest you're looking for doesn't exist or has ended.
          </p>
          <button
            onClick={() => navigate("/contests")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all"
          >
            Browse Contests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 to-white dark:to-black text-gray-900 dark:text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/contests")}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Back to contests"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <MdOutlineEmojiEvents className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{contest.title}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Live Contest</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  isConnected
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                ></div>
                <span className="text-sm font-medium">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>

              <button
                onClick={handleRetry}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                title="Refresh contest data"
              >
                <FiRefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>

              {/* Admin: End Contest */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <button
                  onClick={handleEndContest}
                  disabled={endingContest}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-gray-900 dark:text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Force-end contest and apply ratings"
                >
                  {endingContest
                    ? <FiRefreshCw className="h-4 w-4 animate-spin" />
                    : <FiAlertTriangle className="h-4 w-4" />
                  }
                  {endingContest ? 'Ending…' : 'End Contest'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Timer & Stats */}
            <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800/50 to-gray-100 dark:to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-300 dark:border-gray-700/50 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{contest.title}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{contest.description}</p>
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
                <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl text-center border border-gray-300 dark:border-gray-700/30 hover:border-blue-500/30 transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {problems.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Problems</div>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl text-center border border-gray-300 dark:border-gray-700/30 hover:border-purple-500/30 transition-colors">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {contest.participantsCount || leaderboard.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Participants</div>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl text-center border border-gray-300 dark:border-gray-700/30 hover:border-yellow-500/30 transition-colors">
                  <div className="text-2xl font-bold text-yellow-400">
                    {leaderboard.find((l) => l.userId === user?.id)?.rank ||
                      "—"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your Rank</div>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl text-center border border-gray-300 dark:border-gray-700/30 hover:border-green-500/30 transition-colors">
                  <div className="text-2xl font-bold text-green-400">
                    {leaderboard.find((l) => l.userId === user?.id)?.score || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your Score</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800/50 to-gray-100 dark:to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-300 dark:border-gray-700/50 overflow-hidden shadow-xl">
              <div className="border-b border-gray-300 dark:border-gray-700/50">
                <nav className="flex overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab("problems")}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all ${
                      activeTab === "problems"
                        ? "text-gray-900 dark:text-white border-b-2 border-blue-500 bg-gradient-to-t from-blue-500/10 to-transparent"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <FiCode className="h-5 w-5" />
                    Problems ({problems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all ${
                      activeTab === "submissions"
                        ? "text-gray-900 dark:text-white border-b-2 border-blue-500 bg-gradient-to-t from-blue-500/10 to-transparent"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <FiCheckCircle className="h-5 w-5" />
                    My Submissions
                  </button>
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all ${
                      activeTab === "rules"
                        ? "text-gray-900 dark:text-white border-b-2 border-blue-500 bg-gradient-to-t from-blue-500/10 to-transparent"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <FiAlertCircle className="h-5 w-5" />
                    Rules
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "problems" && (
                  <div className="space-y-4">
                    {/* ── Contest not started yet ── */}
                    {contest && new Date() < new Date(contest.startTime || contest.start_time) && (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center">
                          <FiAlertTriangle className="h-10 w-10 text-yellow-400" />
                        </div>
                        <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">Contest hasn't started yet</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Problems will be revealed when the contest begins</p>
                        <div className="inline-block px-6 py-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                          <p className="text-xs text-yellow-400 mb-2 font-medium">STARTS IN</p>
                          <ContestTimer endTime={new Date(contest.startTime || contest.start_time)} />
                        </div>
                        {/* Show locked problem slots so participants know how many problems there are */}
                        {problems.length > 0 && (
                          <div className="mt-8 space-y-3 max-w-md mx-auto">
                            <p className="text-gray-600 dark:text-gray-500 text-xs mb-3">This contest has {problems.length} problem{problems.length !== 1 ? 's' : ''}</p>
                            {problems.map((problem, index) => (
                              <div key={index} className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 opacity-60">
                                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                                </div>
                                <FiAlertTriangle className="h-4 w-4 text-gray-600" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Contest live or ended — show real problems ── */}
                    {(!contest || new Date() >= new Date(contest.startTime || contest.start_time)) && (
                      problems.length > 0 ? (
                        problems.map((problem, index) => {
                          const isSolved = solvedProblemIds.has(problem._id);
                          return (
                          <div
                            key={problem._id}
                            className={`group border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                              isSolved
                                ? "bg-green-900/20 border-green-500/40 hover:border-green-400/60"
                                : "bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700/50 hover:border-blue-500/50"
                            }`}
                            onClick={() => handleProblemClick(problem._id)}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-gray-900 dark:text-white font-bold text-lg shadow-lg ${
                                  isSolved
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                                }`}>
                                  {isSolved ? <FiCheckCircle className="h-6 w-6" /> : String.fromCharCode(65 + index)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`text-xl font-bold transition-colors ${isSolved ? "text-green-300" : "text-gray-900 dark:text-white group-hover:text-blue-400"}`}>
                                      {problem.title}
                                    </h3>
                                    {isSolved && (
                                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold">
                                        ✓ Solved
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                      problem.difficulty === "easy"
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : problem.difficulty === "medium"
                                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}>
                                      {problem.difficulty?.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-blue-400 font-medium">
                                      {problem.points} points
                                    </span>
                                    {problem.metadata?.acceptanceRate && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {problem.metadata.acceptanceRate}% acceptance
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSubmit(problem._id); }}
                                className={`px-6 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2 ${
                                  isSolved
                                    ? "bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-400 dark:border-gray-600/50 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 text-gray-900 dark:text-white"
                                }`}
                              >
                                <FiCode className="h-4 w-4" /> {isSolved ? "Re-solve" : "Solve"}
                              </button>
                            </div>
                            {problem.tags && problem.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {problem.tags.slice(0, 4).map((tag, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-md">{tag}</span>
                                ))}
                                {problem.tags.length > 4 && (
                                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs rounded-md">+{problem.tags.length - 4} more</span>
                                )}
                              </div>
                            )}
                            <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-sm">
                              {problem.description || 'Click to view the full problem statement'}
                            </p>
                          </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center">
                            <FiCode className="h-10 w-10 text-gray-600 dark:text-gray-500" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-lg">No problems added yet.</p>
                          <p className="text-gray-600 dark:text-gray-500 text-sm mt-2">Contact the contest organizer.</p>
                        </div>
                      )
                    )}

                  </div>
                )}

                {activeTab === "submissions" && (
                  <div className="space-y-4">
                    {submissions.length > 0 ? (
                      submissions.map((submission) => {
                        const verdict = submission.verdict || submission.status || 'pending';
                        const isAccepted = verdict === 'accepted';
                        return (
                          <div key={submission._id} className="bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 hover:border-gray-400 dark:hover:border-gray-600/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white text-base truncate">
                                  {submission.problem?.title || submission.problemTitle || 'Unknown Problem'}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700/50 rounded">{submission.language}</span>
                                  {submission.executionTime && <span>⚡ {submission.executionTime}ms</span>}
                                  {submission.passedTestCases != null && (
                                    <span>✓ {submission.passedTestCases}/{submission.totalTestCases} tests</span>
                                  )}
                                  <span>{new Date(submission.submittedAt || submission.createdAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <span className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                                isAccepted
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {verdict.replace(/_/g,' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center">
                          <FiCheckCircle className="h-10 w-10 text-gray-600 dark:text-gray-500" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No submissions yet
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Start solving problems to see submissions here!
                        </p>
                        <button
                          onClick={() => setActiveTab("problems")}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white rounded-xl hover:shadow-lg transition-all"
                        >
                          <FiCode className="h-5 w-5" />
                          View Problems
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "rules" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
                        <FiAlertCircle className="h-5 w-5 text-blue-400" />
                        Contest Rules
                      </h4>
                      <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-3">
                          <FiCheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>
                            All submissions are final and cannot be reverted
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiXCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Plagiarism will result in immediate disqualification
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiTarget className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Solutions must pass all test cases to get points
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiClock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>
                            The contest ends exactly at the scheduled time
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiUsers className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span>
                            Respect other participants and maintain fair play
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700/50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                        Scoring System
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Points are awarded based on problem difficulty and time
                        taken. Earlier submissions with correct answers receive
                        more points. Wrong submissions may incur time penalties.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Live Leaderboard */}
            <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800/50 to-gray-100 dark:to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-300 dark:border-gray-700/50 p-6 shadow-xl sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdOutlineLeaderboard className="h-5 w-5 text-yellow-400" />
                  Live Leaderboard
                </h3>
                <button
                  onClick={handleRetry}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh leaderboard"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/30 pr-2">
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 20).map((entry, index) => {
                    // Match by either id or _id — backend uses PostgreSQL user_id (MongoDB ObjectId string)
                    const isMe = entry.userId === user?.id || entry.userId === user?._id?.toString();
                    return (
                    <div
                      key={entry.userId}
                      className={`p-3 rounded-xl transition-all ${
                        isMe
                          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 shadow-lg"
                          : index < 3
                            ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                            : "bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700/50 hover:border-gray-400 dark:hover:border-gray-600/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                              index < 3
                                ? "bg-gradient-to-br from-yellow-500 to-amber-500"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            {index < 3 ? (
                              <TbTrophy
                                className={`h-5 w-5 ${
                                  index === 0 ? "text-yellow-200" : index === 1 ? "text-gray-700 dark:text-gray-200" : "text-amber-700"
                                }`}
                              />
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-300">#{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {entry.username || `User ${(entry.userId||'').slice(0, 8)}`}
                              {isMe && (
                                <span className="ml-2 text-xs text-blue-400 font-semibold">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {entry.solved || 0} solved
                              {entry.totalTime > 0 && ` • ${Math.floor(entry.totalTime / 60)}m`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white text-lg">{entry.score || 0}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center">
                      <MdOutlineLeaderboard className="h-8 w-8 text-gray-600 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No submissions yet</p>
                    <p className="text-gray-600 dark:text-gray-500 text-xs mt-2">
                      Be the first to solve!
                    </p>
                  </div>
                )}
              </div>

              {leaderboard.length > 20 && (
                <button
                  onClick={() => navigate(`/contests/${id}/leaderboard`)}
                  className="w-full mt-4 px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2 font-medium"
                >
                  View Full Leaderboard
                  <FiChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Live Updates */}
            {liveUpdates.length > 0 && (
              <div className="bg-gradient-to-br from-gray-100 dark:from-gray-800/50 to-gray-100 dark:to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-300 dark:border-gray-700/50 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiBell className="h-5 w-5 text-green-400" />
                  Live Activity
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/30 pr-2">
                  {liveUpdates.map((update, index) => (
                    <div
                      key={update.id || index}
                      className="p-3 bg-gray-100 dark:bg-gray-800/30 rounded-xl border border-gray-300 dark:border-gray-700/50 hover:border-green-500/30 transition-colors animate-in fade-in slide-in-from-top duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {update.username}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            update.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {update.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Solved{" "}
                        <span className="text-gray-900 dark:text-white font-medium">
                          {update.problem}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-500 mt-2">
                        {update.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveContest;