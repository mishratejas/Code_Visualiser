import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiPercent,
  FiClock,
  FiEye,
  FiBarChart2,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { MdOutlineEmojiEvents } from "react-icons/md";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { aiApi, contestsApi } from "../services/api";
import Loader from "../components/common/Loader";

// ── helpers ──────────────────────────────────────────────────────────────────

const pct = (val) => `${Math.round((val ?? 0) * 100)}%`;

const verdictMeta = {
  pending:               { label: "Pending Review",     color: "yellow",  icon: FiClock },
  plagiarism_confirmed:  { label: "Plagiarism Confirmed", color: "red",   icon: FiXCircle },
  false_positive:        { label: "False Positive",     color: "green",   icon: FiCheckCircle },
  common_solution:       { label: "Common Solution",    color: "blue",    icon: FiInfo },
};

const VerdictBadge = ({ verdict }) => {
  const meta = verdictMeta[verdict] ?? verdictMeta.pending;
  const Icon = meta.icon;
  const colors = {
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    red:    "bg-red-500/15 text-red-400 border-red-500/30",
    green:  "bg-green-500/15 text-green-400 border-green-500/30",
    blue:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[meta.color]}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const SimilarityBar = ({ value, label }) => {
  const pctVal = Math.round((value ?? 0) * 100);
  const color =
    pctVal >= 90 ? "from-red-500 to-rose-500" :
    pctVal >= 75 ? "from-orange-500 to-amber-500" :
    pctVal >= 60 ? "from-yellow-500 to-amber-400" :
                   "from-green-500 to-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pctVal}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-white w-10 text-right">{pctVal}%</span>
    </div>
  );
};

// ── PlagiarismPanel ───────────────────────────────────────────────────────────

const PlagiarismPanel = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contest, setContest] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [reviewingPairId, setReviewingPairId] = useState(null); // index of pair being reviewed
  const [selectedPair, setSelectedPair] = useState(null);       // pair detail modal
  const [filter, setFilter] = useState("all");                  // all | pending | confirmed | cleared
  const [search, setSearch] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // ── guard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Admin access required");
      navigate("/contests");
    }
  }, [isAdmin, navigate]);

  // ── fetch contest + existing report ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!contestId) return;
    try {
      setLoading(true);
      const [contestRes, reportRes] = await Promise.allSettled([
        contestsApi.getById(contestId),
        aiApi.getPlagiarismReport(contestId),
      ]);

      if (contestRes.status === "fulfilled") {
        const cd = contestRes.value?.data?.data || contestRes.value?.data || contestRes.value;
        setContest(cd);
      }

      if (reportRes.status === "fulfilled") {
        // Axios interceptor returns response.data (the HTTP body).
        // ApiResponse.success(report, msg) wraps as { success, data: report, message }.
        // So reportRes.value = { success, data: report, message }
        // and reportRes.value.data = the actual report object.
        const rd = reportRes.value?.data ?? reportRes.value ?? null;
        setReport((rd && typeof rd === 'object' && rd.suspiciousPairs !== undefined) ? rd : null);
      } else {
        // 404 = no report yet — that's fine, show the empty state
        // Any other error is also non-fatal here; the Run Check button handles recovery
        setReport(null);
      }
    } catch (err) {
      console.error("Failed to load plagiarism data", err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── run check ─────────────────────────────────────────────────────────────
  const handleRunCheck = async () => {
    try {
      setChecking(true);
      toast.loading("Running plagiarism analysis… this may take up to 2 minutes", { id: "plag-check" });

      // checkPlagiarism triggers analysis and returns the saved report
      const res = await aiApi.checkPlagiarism(contestId);
      // res = { success, data: report, message } after axios interceptor
      const resultData = res?.data ?? res;

      // If the service returned a result directly, use it; otherwise re-fetch
      if (resultData?.suspiciousPairs !== undefined) {
        setReport(resultData);
        const count = resultData.suspiciousPairs?.length ?? 0;
        toast.success(
          count > 0
            ? `Analysis complete — ${count} suspicious pair${count !== 1 ? "s" : ""} found`
            : "Analysis complete — no suspicious pairs found",
          { id: "plag-check", duration: 5000 }
        );
      } else {
        // Fallback: re-fetch the stored report
        const reportRes = await aiApi.getPlagiarismReport(contestId);
        const rd = reportRes?.data ?? reportRes;
        setReport(rd?.suspiciousPairs !== undefined ? rd : null);
        toast.success("Plagiarism check completed", { id: "plag-check" });
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message || "";
      let userMsg = "Plagiarism check failed.";

      if (serverMsg.toLowerCase().includes("econnrefused") || serverMsg.toLowerCase().includes("ai service")) {
        userMsg = "AI analysis service is offline. The check runs automatically when a contest ends — check back shortly or contact your system admin.";
      } else if (serverMsg.toLowerCase().includes("not enough")) {
        userMsg = "Not enough submissions to run a plagiarism check (need at least 2).";
      } else if (serverMsg) {
        userMsg = serverMsg;
      }

      toast.error(userMsg, { id: "plag-check", duration: 8000 });
    } finally {
      setChecking(false);
    }
  };

  // ── review a pair ─────────────────────────────────────────────────────────
  const handleReview = async (pair, verdict) => {
    const pairKey = `${pair.submission1}_${pair.submission2}`;
    try {
      setReviewingPairId(pairKey);
      const payload = {
        contestId,
        submission1Id: pair.submission1,
        submission2Id: pair.submission2,
        verdict,
        notes: reviewNotes,
      };
      // When plagiarism is confirmed, also send ban + rating penalty fields
      if (verdict === 'plagiarism_confirmed') {
        payload.banUsers        = true;
        payload.banDurationDays = 7;
        payload.ratingPenalty   = 200;
        payload.user1Id         = pair.user1?._id || pair.user1;
        payload.user2Id         = pair.user2?._id || pair.user2;
      }
      await aiApi.reviewPlagiarismPair(payload);
      if (verdict === 'plagiarism_confirmed') {
        toast.success(`🚫 ${pair.user1?.username || 'User1'} & ${pair.user2?.username || 'User2'} banned 7 days · −200 rating each`);
      } else {
        toast.success(`Verdict saved: ${verdictMeta[verdict]?.label}`);
      }
      setSelectedPair(null);
      setReviewNotes("");
      // Refresh report so confirmed pairs show punishment details
      const reportRes = await aiApi.getPlagiarismReport(contestId);
      const rd = reportRes?.data ?? reportRes;
      if (rd?.suspiciousPairs !== undefined) {
        setReport(rd);
      } else {
        // Optimistically update the pair verdict in local state
        setReport(prev => prev ? {
          ...prev,
          suspiciousPairs: prev.suspiciousPairs.map(p =>
            (p.submission1 === pair.submission1 && p.submission2 === pair.submission2)
              ? { ...p, verdict, reviewNotes, punishmentApplied: verdict === 'plagiarism_confirmed' }
              : p
          )
        } : prev);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Review failed");
    } finally {
      setReviewingPairId(null);
    }
  };

  // ── filtered pairs ────────────────────────────────────────────────────────
  const pairs = report?.suspiciousPairs ?? [];

  const filteredPairs = pairs.filter((p) => {
    const matchesFilter =
      filter === "all" ? true :
      filter === "pending"   ? p.verdict === "pending" :
      filter === "confirmed" ? p.verdict === "plagiarism_confirmed" :
      filter === "cleared"   ? p.verdict === "false_positive" || p.verdict === "common_solution" :
      true;

    const u1Name = (p.user1?.username || "").toLowerCase();
    const u2Name = (p.user2?.username || "").toLowerCase();
    const matchesSearch = !search || u1Name.includes(search.toLowerCase()) || u2Name.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total:     pairs.length,
    pending:   pairs.filter(p => p.verdict === "pending").length,
    confirmed: pairs.filter(p => p.verdict === "plagiarism_confirmed").length,
    cleared:   pairs.filter(p => p.verdict === "false_positive" || p.verdict === "common_solution").length,
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <Loader />
          <p className="text-gray-400 mt-4 animate-pulse">Loading plagiarism data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">

      {/* ── Header bar ── */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/contests/${contestId}`)}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <div className="p-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg">
              <FiShield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Plagiarism Panel</h1>
              <p className="text-sm text-gray-400">{contest?.title || `Contest #${contestId}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleRunCheck}
              disabled={checking}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checking ? (
                <><FiRefreshCw className="h-4 w-4 animate-spin" />Running…</>
              ) : (
                <><FiSearch className="h-4 w-4" />Run Check</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">

        {/* ── No report yet ── */}
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-6 border border-gray-700/50">
              <FiShield className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Report Yet</h2>
            <p className="text-gray-400 max-w-md mb-3">
              No plagiarism analysis has been run for this contest yet.
            </p>
            <p className="text-gray-500 text-sm max-w-md mb-8">
              Reports are generated <strong className="text-gray-400">automatically</strong> when a contest ends.
              If the contest has already ended, the auto-report may still be processing — try refreshing.
              You can also trigger a manual check below.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all font-medium"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleRunCheck}
                disabled={checking}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-60"
              >
                {checking ? <FiRefreshCw className="h-5 w-5 animate-spin" /> : <FiSearch className="h-5 w-5" />}
                {checking ? "Running Analysis…" : "Run Plagiarism Check"}
              </button>
            </div>
          </div>
        )}

        {report && (
          <>
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Pairs",     value: stats.total,     color: "blue",   icon: FiBarChart2 },
                { label: "Pending Review",  value: stats.pending,   color: "yellow", icon: FiClock },
                { label: "Confirmed",       value: stats.confirmed, color: "red",    icon: FiXCircle },
                { label: "Cleared",         value: stats.cleared,   color: "green",  icon: FiCheckCircle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className={`bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5 text-center hover:border-${color}-500/40 transition-colors`}
                >
                  <Icon className={`h-6 w-6 text-${color}-400 mx-auto mb-2`} />
                  <div className="text-3xl font-bold text-white">{value}</div>
                  <div className="text-sm text-gray-400 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* ── Report meta ── */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5 flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FiClock className="h-4 w-4" />
                Last checked:{" "}
                <span className="text-white font-medium">
                  {report.checkedAt ? new Date(report.checkedAt).toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiBarChart2 className="h-4 w-4" />
                Submissions analysed:{" "}
                <span className="text-white font-medium">{report.totalSubmissions ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPercent className="h-4 w-4" />
                Avg similarity:{" "}
                <span className="text-white font-medium">{pct(report.averageSimilarity)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="h-4 w-4" />
                Threshold:{" "}
                <span className="text-white font-medium">{pct(report.threshold)}</span>
              </div>
            </div>

            {/* ── Filters + search ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-gray-800/50 border border-gray-700/50 rounded-xl p-1 gap-1 flex-wrap">
                {[
                  { key: "all",       label: `All (${stats.total})` },
                  { key: "pending",   label: `Pending (${stats.pending})` },
                  { key: "confirmed", label: `Confirmed (${stats.confirmed})` },
                  { key: "cleared",   label: `Cleared (${stats.cleared})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === key
                        ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by username…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>
            </div>

            {/* ── Pairs table ── */}
            {filteredPairs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiCheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                <p className="text-lg font-medium text-white">No pairs match this filter</p>
                <p className="text-sm mt-2">Try changing the filter or search term.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPairs.map((pair, idx) => {
                  const score = Math.round((pair.similarityScore ?? 0) * 100);
                  const scoreColor =
                    score >= 90 ? "text-red-400" :
                    score >= 75 ? "text-orange-400" :
                    score >= 60 ? "text-yellow-400" : "text-green-400";

                  return (
                    <div
                      key={idx}
                      className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600/60 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Users */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-2 rounded-xl border border-gray-700/40">
                            <FiUser className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-white">
                              {pair.user1?.username || pair.user1?.toString?.().slice(0, 8) || "User 1"}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs font-bold">VS</span>
                          <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-2 rounded-xl border border-gray-700/40">
                            <FiUser className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">
                              {pair.user2?.username || pair.user2?.toString?.().slice(0, 8) || "User 2"}
                            </span>
                          </div>
                        </div>

                        {/* Score + verdict */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className={`text-2xl font-black ${scoreColor}`}>{score}%</div>
                            <div className="text-xs text-gray-500">similarity</div>
                          </div>
                          <VerdictBadge verdict={pair.verdict ?? "pending"} />
                        </div>
                      </div>

                      {/* Mini similarity bars */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <SimilarityBar value={pair.tokenSimilarity}      label="Token" />
                        <SimilarityBar value={pair.astSimilarity}        label="AST" />
                        <SimilarityBar value={pair.structuralSimilarity} label="Structural" />
                      </div>

                      {/* Actions */}
                      {pair.verdict === "pending" && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-700/40">
                          <button
                            onClick={() => setSelectedPair({ pair, idx })}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            <FiEye className="h-4 w-4" />
                            Review
                          </button>
                          <button
                            onClick={() => handleReview(pair, "plagiarism_confirmed")}
                            disabled={reviewingPairId === `${pair.submission1}_${pair.submission2}`}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <FiXCircle className="h-4 w-4" />
                            Confirm Plagiarism
                          </button>
                          <button
                            onClick={() => handleReview(pair, "false_positive")}
                            disabled={reviewingPairId === `${pair.submission1}_${pair.submission2}`}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <FiCheckCircle className="h-4 w-4" />
                            False Positive
                          </button>
                          <button
                            onClick={() => handleReview(pair, "common_solution")}
                            disabled={reviewingPairId === `${pair.submission1}_${pair.submission2}`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <FiInfo className="h-4 w-4" />
                            Common Solution
                          </button>
                        </div>
                      )}

                      {/* Reviewed info */}
                      {pair.verdict !== "pending" && (
                        <div className="mt-4 pt-4 border-t border-gray-700/40 space-y-2">
                          {pair.verdict === "plagiarism_confirmed" && (
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                                🚫 Disqualified from contest
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                                🔒 Banned 7 days
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
                                📉 −200 rating
                              </span>
                            </div>
                          )}
                          {pair.reviewNotes && (
                            <p className="text-sm text-gray-400 italic">Notes: {pair.reviewNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail / Review modal ── */}
      {selectedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
                Review Suspicious Pair
              </h3>
              <button
                onClick={() => { setSelectedPair(null); setReviewNotes(""); }}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiXCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Users */}
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                    <FiUser className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="font-medium text-white">
                    {selectedPair.pair.user1?.username || "User 1"}
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-500">VS</div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-2">
                    <FiUser className="h-7 w-7 text-purple-400" />
                  </div>
                  <div className="font-medium text-white">
                    {selectedPair.pair.user2?.username || "User 2"}
                  </div>
                </div>
              </div>

              {/* Similarity scores */}
              <div className="space-y-2 bg-gray-800/40 rounded-xl p-4">
                <SimilarityBar value={selectedPair.pair.similarityScore}    label="Overall" />
                <SimilarityBar value={selectedPair.pair.tokenSimilarity}     label="Token" />
                <SimilarityBar value={selectedPair.pair.astSimilarity}       label="AST" />
                <SimilarityBar value={selectedPair.pair.structuralSimilarity} label="Structural" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Review Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about your decision…"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              {/* Verdict buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleReview(selectedPair.pair, "plagiarism_confirmed")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all font-semibold"
                >
                  <FiXCircle className="h-5 w-5" />
                  Confirm Plagiarism — Disqualify Both
                </button>
                <button
                  onClick={() => handleReview(selectedPair.pair, "false_positive")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/20 transition-all font-semibold"
                >
                  <FiCheckCircle className="h-5 w-5" />
                  Mark as False Positive — Clear Both
                </button>
                <button
                  onClick={() => handleReview(selectedPair.pair, "common_solution")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all font-semibold"
                >
                  <FiInfo className="h-5 w-5" />
                  Mark as Common Solution — No Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlagiarismPanel;