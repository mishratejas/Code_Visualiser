import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Award,
  TrendingUp,
  Plus,
} from "lucide-react";
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdOutlineEmojiEvents } from "react-icons/md";
import { TbTrophy, TbRefresh } from "react-icons/tb";
import { format } from "date-fns";
import api from "../services/api";
import Loader from "../components/common/Loader";
import { toast } from "react-hot-toast";
import ContestTimer from "../components/contests/ContestTimer";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/common/ThemeToggle";

const Contests = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [contestPassword, setContestPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  // Theme classes
  const bgClass = isDark ? "bg-gray-950" : "bg-gray-50";
  const cardClass = isDark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200 shadow-sm";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const subTextClass = isDark ? "text-gray-400" : "text-gray-600";
  const inputClass = isDark
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400";
  const hoverClass = isDark ? "hover:bg-gray-800" : "hover:bg-gray-50";
  const filterButtonClass = (active) =>
    active
      ? "bg-gradient-to-r from-rose-500 to-red-500 text-white border-transparent"
      : isDark
      ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100";

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
    if (!date) return "Date unavailable";
    try {
      return format(date, formatString);
    } catch {
      return "Date unavailable";
    }
  };

  const fetchContests = async () => {
    try {
      setLoading(true);

      let contestsData = [];

      if (filter === "my") {
        // Hit the dedicated /contests/my endpoint that returns registered + created contests
        const response = await api.get("/contests/my");
        contestsData = response?.data || response || [];
      } else {
        const params = {};
        if (filter !== "all") params.status = filter;
        const response = await api.get("/contests", { params });
        // api interceptor already unwraps response.data
        // Backend returns { success, data: [...], total }
        contestsData = response?.data || response || [];
        if (!Array.isArray(contestsData)) {
          contestsData = response?.contests || [];
        }
      }

      if (!Array.isArray(contestsData)) contestsData = [];
      setContests(contestsData);

      const now = new Date();
      setStats({
        total: contestsData.length,
        upcoming: contestsData.filter((c) => {
          const start = safeDate(c.startTime || c.start_time);
          return start && start > now;
        }).length,
        ongoing: contestsData.filter((c) => {
          const start = safeDate(c.startTime || c.start_time);
          const end = safeDate(c.endTime || c.end_time);
          return start && end && start <= now && end >= now;
        }).length,
        past: contestsData.filter((c) => {
          const end = safeDate(c.endTime || c.end_time);
          return end && end < now;
        }).length,
      });
    } catch (error) {
      console.error("Failed to fetch contests:", error);
      toast.error("Failed to fetch contests");
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = safeDate(contest.startTime || contest.start_time);
    const end = safeDate(contest.endTime || contest.end_time);
    if (!start || !end) return "unknown";
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    return "past";
  };

  const getTimeRemaining = (contest) => {
    const now = new Date();
    const start = safeDate(contest.startTime || contest.start_time);
    const end = safeDate(contest.endTime || contest.end_time);
    if (!start || !end) return "Date unavailable";

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
    }
    return "Ended";
  };

  const handleRegisterClick = (contest) => {
    if (!user) {
      toast.error("Please login to register for contests");
      return;
    }
    setSelectedContest(contest);
    if (contest.is_private || contest.isPrivate) {
      setShowPasswordModal(true);
    } else {
      registerForContest(contest.id || contest._id, null);
    }
  };

  const registerForContest = async (contestId, password = null) => {
    try {
      setRegistering(true);
      const payload = password ? { password } : {};
      await api.post(`/contests/${contestId}/register`, payload);
      toast.success("Successfully registered for contest! 🎉");
      setShowPasswordModal(false);
      setContestPassword("");
      setSelectedContest(null);
      fetchContests();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!contestPassword.trim()) {
      toast.error("Please enter the contest password");
      return;
    }
    registerForContest(selectedContest.id || selectedContest._id, contestPassword);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "upcoming":
        return "text-blue-500 bg-blue-500/10";
      case "ongoing":
        return "text-green-500 bg-green-500/10";
      case "past":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const filteredContests = contests.filter((contest) => {
    const matchesSearch =
      !searchQuery ||
      contest.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contest.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      selectedDifficulty === "all" || contest.difficulty === selectedDifficulty;

    let matchesFilter = true;
    if (filter === "my") {
      // /contests/my already returns only user's contests — just show them all
      matchesFilter = true;
    } else {
      matchesFilter = filter === "all" || getContestStatus(contest) === filter;
    }
    return matchesSearch && matchesDifficulty && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-full space-y-6">
        {/* Header Row */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Page Header */}
        <div className={`${cardClass} rounded-xl p-6 border`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-500">
                <MdOutlineEmojiEvents className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textClass}`}>Contests</h1>
                <p className={`text-sm ${subTextClass}`}>
                  Compete worldwide and climb the leaderboard • {stats.total} contests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.role === "admin" && (
                <Link
                  to="/contests/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Create Contest
                </Link>
              )}
              <Link
                to="/leaderboard"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <TbTrophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextClass}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contests..."
              className={`w-full pl-10 pr-4 py-2.5 ${inputClass} rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 mt-4 px-4 py-2 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded-lg text-sm ${textClass}`}
          >
            <FiFilter size={16} />
            <span>Filters</span>
            {showFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className={`${cardClass} rounded-xl p-6 border space-y-6`}>
            {/* Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Status</label>
              <div className="flex flex-wrap gap-2">
                {["all", "upcoming", "ongoing", "past", "my"].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setFilter(statusOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterButtonClass(filter === statusOption)}`}
                  >
                    {statusOption === "my" ? "📌 My Contests" : statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textClass}`}>Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {["all", "easy", "medium", "hard"].map((diffOption) => (
                  <button
                    key={diffOption}
                    onClick={() => setSelectedDifficulty(diffOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${filterButtonClass(selectedDifficulty === diffOption)}`}
                  >
                    {diffOption.charAt(0).toUpperCase() + diffOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
                setSelectedDifficulty("all");
              }}
              className={`flex items-center gap-2 px-4 py-2 ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded-lg text-sm ${textClass} hover:opacity-80`}
            >
              <TbRefresh size={16} />
              Reset Filters
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: MdOutlineEmojiEvents, color: "rose" },
            { label: "Upcoming", value: stats.upcoming, icon: Calendar, color: "blue" },
            { label: "Live Now", value: stats.ongoing, icon: TrendingUp, color: "green" },
            { label: "Past", value: stats.past, icon: Award, color: "yellow" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`${cardClass} rounded-lg p-4 border`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                  <Icon className={`text-${color}-500 h-4 w-4`} />
                </div>
                <div>
                  <div className={`text-xl font-bold ${textClass}`}>{value}</div>
                  <div className={`text-xs ${subTextClass}`}>{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contests List */}
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>
          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-4 px-6 py-3 ${isDark ? "bg-gray-800" : "bg-gray-100"} text-xs font-medium ${subTextClass}`}>
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Contest</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-1">Participants</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Contest Rows */}
          <div className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-100"}`}>
            {filteredContests.length > 0 ? (
              filteredContests.map((contest) => {
                const status = getContestStatus(contest);
                const contestId = contest._id || contest.id;
                const participants =
                  contest.participants?.length || contest.participantsCount || 0;

                return (
                  <div
                    key={contestId}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 ${hoverClass} transition-colors`}
                  >
                    {/* Status Badge */}
                    <div className="col-span-1 flex items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}
                      >
                        {status === "upcoming"
                          ? "Soon"
                          : status === "ongoing"
                          ? "Live"
                          : "Ended"}
                      </span>
                    </div>

                    {/* Contest Name */}
                    <div className="col-span-4">
                      <Link
                        to={`/contests/${contestId}`}
                        className={`font-medium ${textClass} hover:text-rose-500 transition-colors`}
                      >
                        {contest.title}
                      </Link>
                      {status === "ongoing" && (
                        <div className={`text-xs mt-0.5 ${subTextClass}`}>
                          {getTimeRemaining(contest)}
                        </div>
                      )}
                      {status === "upcoming" && (
                        <div className="text-xs mt-0.5 text-blue-500">
                          {getTimeRemaining(contest)}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className={`col-span-2 flex items-center text-sm ${subTextClass}`}>
                      <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      {safeFormat(contest.startTime || contest.start_time, "MMM dd, yyyy")}
                    </div>

                    {/* Duration */}
                    <div className={`col-span-2 flex items-center text-sm ${subTextClass}`}>
                      <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      {contest.duration || contest.duration_minutes || "?"} min
                    </div>

                    {/* Participants */}
                    <div className={`col-span-1 flex items-center text-sm ${subTextClass}`}>
                      <Users className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      {participants}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/contests/${contestId}`}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-opacity hover:opacity-80 ${
                          isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Details
                      </Link>
                      {/* ✅ Show registered badge when already signed up */}
                      {contest.isRegistered && status !== "past" && (
                        <span className="px-3 py-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg font-medium flex items-center gap-1">
                          ✅ Registered
                        </span>
                      )}
                      {/* Register button — only when NOT yet registered */}
                      {status === "upcoming" && !contest.isRegistered && filter !== "my" && (
                        <button
                          onClick={() => handleRegisterClick(contest)}
                          disabled={registering}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {registering && selectedContest?.id === contestId ? "…" : "Register"}
                        </button>
                      )}
                      {status === "ongoing" && (
                        <Link
                          to={`/contests/${contestId}/live`}
                          className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:opacity-80 transition-opacity font-medium"
                        >
                          🟢 Enter Live
                        </Link>
                      )}
                      {filter === "my" && user?.role === "admin" && (
                        <Link
                          to={`/contests/${contestId}/add-problems`}
                          className="px-3 py-1.5 text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg hover:opacity-80 transition-opacity"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <MdOutlineEmojiEvents className={`h-12 w-12 mx-auto mb-3 ${subTextClass}`} />
                <p className={`${subTextClass} mb-4`}>
                  {filter === "my"
                    ? "You haven't registered for any contests yet."
                    : filter !== "all"
                    ? `No ${filter} contests match your filters.`
                    : "No contests available at the moment."}
                </p>
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearchQuery("");
                    setSelectedDifficulty("all");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Award,
              title: "Earn Rewards",
              desc: "Win prizes and certificates by performing well in contests.",
              color: "rose",
            },
            {
              icon: TrendingUp,
              title: "Improve Skills",
              desc: "Enhance your problem-solving skills under time pressure.",
              color: "green",
            },
            {
              icon: Users,
              title: "Global Ranking",
              desc: "Showcase achievements to recruiters and the community.",
              color: "purple",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className={`${cardClass} rounded-xl p-5 border`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                  <Icon className={`h-5 w-5 text-${color}-500`} />
                </div>
                <h4 className={`font-bold ${textClass}`}>{title}</h4>
              </div>
              <p className={`text-sm ${subTextClass}`}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedContest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-2xl border shadow-2xl max-w-md w-full p-8`}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className={`text-xl font-bold ${textClass} mb-2`}>Private Contest</h3>
              <p className={`text-sm ${subTextClass}`}>
                This contest requires a password to register.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${subTextClass}`}>
                  Contest Password
                </label>
                <input
                  type="password"
                  value={contestPassword}
                  onChange={(e) => setContestPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full px-4 py-3 ${inputClass} rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm`}
                  autoFocus
                  disabled={registering}
                />
              </div>
              <div className={`text-sm text-center p-3 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"} ${subTextClass}`}>
                <strong className={textClass}>{selectedContest.title}</strong>
                <div className="mt-1 text-xs">
                  {safeFormat(selectedContest.startTime || selectedContest.start_time, "MMM dd, yyyy • hh:mm a")}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setContestPassword("");
                    setSelectedContest(null);
                  }}
                  disabled={registering}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering || !contestPassword.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contests;