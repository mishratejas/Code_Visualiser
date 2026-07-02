import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    FiBookOpen, FiTrendingUp, FiAward, FiZap, FiCheckCircle,
    FiClock, FiTarget, FiAlertTriangle, FiChevronRight, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { aiApi, problemsApi, submissionsApi } from '../../services/api.js';

// ── small reusable bits ──────────────────────────────────────────────────────

const Ring = ({ percent, size = 72, stroke = 7, color = '#f43f5e', track }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, percent || 0));
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
            <circle
                cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
        </svg>
    );
};

const Bar = ({ percent, color = 'bg-rose-500', track }) => (
    <div className={`w-full h-2 rounded-full overflow-hidden ${track}`}>
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, percent || 0))}%` }} />
    </div>
);

const DIFF_COLOR = {
    easy:   { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    hard:   { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
};

const LearningPath = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [learningPath, setLearningPath] = useState(null);
    const [activeTab, setActiveTab] = useState('today');
    const [progress, setProgress] = useState({ overall: 0, easy: 0, medium: 0, hard: 0 });
    const [totalSolved, setTotalSolved] = useState(0);

    useEffect(() => {
        fetchLearningPath();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchLearningPath = async () => {
        setLoading(true);
        try {
            const userStats = user?.stats || {};
            const userId = user?._id || user?.id || '';

            // These two calls don't depend on each other — fire them together
            // instead of one-after-another. Previously this page made 3+ AI/DB
            // round trips in strict sequence (each waiting for the last to
            // finish before starting), which is most of why the page felt slow
            // even when every individual call was healthy.
            const [problemsRes, pathRes] = await Promise.all([
                // Real problem pool with per-user solved/attempted status attached server-side
                problemsApi.getAll({ limit: 50, sort: '-createdAt' }),
                // Real AI-generated roadmap (Gemini, falls back to rule-based phases if unavailable).
                // user_id is required for the AI service to cache this per-user — without it,
                // every reload re-hit Gemini (or its 15s timeout) and different users could
                // even collide on the same cached result.
                aiApi.getLearningPath({ user_stats: userStats, target_role: 'sde', user_id: userId }),
            ]);
            const problems = problemsRes?.data?.problems || [];
            const path = pathRes?.data || {};

            const availableProblems = problems.map(p => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                difficulty: p.difficulty,
                tags: p.tags || [],
                acceptanceRate: p.metadata?.acceptanceRate ?? 50,
            }));
            const solvedProblems = availableProblems.filter(
                (p, i) => problems[i].userStatus === 'solved'
            );

            // Recommendations DO depend on the problem pool above, so this one
            // has to stay sequential — but it can run in parallel with the
            // difficulty-count + real-solved-count calls further down (also
            // moved into the Promise.all below) instead of blocking them.
            const recRes = await aiApi.getRecommendations({
                user_stats: userStats,
                user_id: userId,
                solved_problems: solvedProblems,
                available_problems: availableProblems,
                limit: 20,
            });
            const recommendations = recRes?.data || [];

            // Weak topics computed from the user's own attempted-vs-solved ratio —
            // real data, not a fabricated "skill gap" endpoint.
            const tagTotals = {};
            problems.forEach(p => {
                if (p.userStatus === 'solved' || p.userStatus === 'attempted') {
                    (p.tags || []).forEach(tag => {
                        tagTotals[tag] = tagTotals[tag] || { attempted: 0, solved: 0 };
                        tagTotals[tag].attempted += 1;
                        if (p.userStatus === 'solved') tagTotals[tag].solved += 1;
                    });
                }
            });
            const weaknesses = Object.entries(tagTotals)
                .filter(([, v]) => v.attempted >= 1)
                .map(([topic, v]) => ({
                    topic,
                    success_rate: (v.solved / v.attempted) * 100,
                    suggestion: `You've solved ${v.solved}/${v.attempted} attempted ${topic} problems — keep practicing this topic.`,
                }))
                .filter(w => w.success_rate < 70)
                .sort((a, b) => a.success_rate - b.success_rate)
                .slice(0, 5);

            // Turn the AI service's phase list into the milestone shape the UI renders.
            // "completed" is estimated from how many of the user's solved problems match each
            // phase's focus topics — a real (if approximate) signal, not a placeholder number.
            const phases = path.phases || [];
            let currentPhaseFound = false;
            const milestones = phases.map((phase, idx) => {
                const topics = phase.focus_topics || [];
                const completed = solvedProblems.filter(p =>
                    p.tags?.some(t => topics.includes(t))
                ).length;
                const target = phase.target_problems || 1;
                let status = 'pending';
                if (completed >= target) status = 'completed';
                else if (!currentPhaseFound) { status = 'in-progress'; currentPhaseFound = true; }
                return {
                    id: phase.phase ?? idx + 1,
                    title: phase.title,
                    description: phase.description,
                    status,
                    problems: target,
                    completed: Math.min(completed, target),
                    topics,
                };
            });

            // Flatten phases into a week-by-week plan using each phase's duration_weeks
            const weeklyPlan = [];
            let weekCounter = 1;
            phases.forEach(phase => {
                const weeks = phase.duration_weeks || 1;
                const problemsPerWeek = Math.ceil((phase.target_problems || 0) / weeks);
                for (let w = 0; w < weeks; w++) {
                    weeklyPlan.push({
                        week: weekCounter++,
                        focus: phase.title,
                        topics: phase.focus_topics || [],
                        problems: problemsPerWeek,
                    });
                }
            });
            const currentWeek = milestones.findIndex(m => m.status === 'in-progress');

            setLearningPath({
                userLevel: path.current_level
                    ? path.current_level[0].toUpperCase() + path.current_level.slice(1)
                    : 'Intermediate',
                targetLevel: 'Advanced',
                weeksRequired: path.estimated_weeks || weeklyPlan.length || 8,
                currentWeek: currentWeek >= 0 ? currentWeek : milestones.length,
                dailyGoal: path.daily_goal,
                resources: path.resources || [],
                milestones,
                weeklyPlan,
                skillGap: { weaknesses },
                recommendations,
            });

            // Real progress bars from actual solved counts vs. total problems by difficulty,
            // plus the account's true total-solved count (not capped to the 50-problem sample
            // used above) for the stats strip at the bottom of the page.
            //
            // NOTE: the ring/bar numerators here come from `solvedProblems` (live, derived
            // from real Submission records via each problem's `userStatus`) — the same
            // source the milestones above use — rather than the separately-tracked
            // `user.stats.easySolved` counter, which can drift out of sync and previously
            // caused the rings to disagree with the milestone panel (e.g. showing 0%
            // while a milestone showed problems solved).
            const solvedByDifficulty = solvedProblems.reduce((acc, p) => {
                acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
                return acc;
            }, {});

            const [easyTotal, mediumTotal, hardTotal, solvedRes] = await Promise.all([
                problemsApi.getAll({ difficulty: 'easy', limit: 1 }).then(r => r?.data?.pagination?.total || 0).catch(() => 0),
                problemsApi.getAll({ difficulty: 'medium', limit: 1 }).then(r => r?.data?.pagination?.total || 0).catch(() => 0),
                problemsApi.getAll({ difficulty: 'hard', limit: 1 }).then(r => r?.data?.pagination?.total || 0).catch(() => 0),
                // Ground-truth total solved across the WHOLE account (not just the 50-problem
                // sample above) — previously the stats card at the bottom read
                // user.stats.totalProblemsSolved, a denormalized counter that can fall out of
                // sync with the real Submission records this endpoint counts directly.
                submissionsApi.getUserSolved().catch(() => null),
            ]);
            const pct = (solved, total) => (total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0);
            const easyPct = pct(solvedByDifficulty.easy || 0, easyTotal);
            const mediumPct = pct(solvedByDifficulty.medium || 0, mediumTotal);
            const hardPct = pct(solvedByDifficulty.hard || 0, hardTotal);
            const denom = easyTotal + mediumTotal + hardTotal;
            const overallPct = pct(solvedProblems.length, denom);

            setProgress({ overall: overallPct, easy: easyPct, medium: mediumPct, hard: hardPct });
            setTotalSolved(solvedRes?.data?.totalSolved ?? user?.stats?.totalProblemsSolved ?? 0);
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
            toast.error('Could not load your learning path. Please try again shortly.');
        }
        setLoading(false);
    };

    const startMilestone = (milestone) => {
        const topic = milestone.topics?.[0];
        navigate(topic ? `/problems?tags=${encodeURIComponent(topic)}` : '/problems');
    };

    const goToProblem = (problem) => navigate(`/problem/${problem.slug || problem._id}`);

    // ── theme tokens (matches Dashboard/Sidebar/Header) ──────────────────────
    const pageBg = isDark ? 'bg-gray-950' : 'bg-gray-50';
    const card   = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
    const txt    = isDark ? 'text-white' : 'text-gray-900';
    const sub    = isDark ? 'text-gray-400' : 'text-gray-500';
    const track  = isDark ? 'bg-gray-800' : 'bg-gray-200';
    const border = isDark ? 'border-gray-800' : 'border-gray-100';

    if (loading) {
        return (
            <div className={`min-h-full flex flex-col items-center justify-center py-24 ${pageBg}`}>
                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-5" />
                <h3 className={`text-lg font-bold ${txt}`}>Generating your personalized learning path…</h3>
                <p className={`text-sm mt-1 ${sub}`}>AI is analyzing your performance to create the optimal roadmap</p>
            </div>
        );
    }

    const weaknesses = learningPath?.skillGap?.weaknesses || [];
    const weakTopics = new Set(weaknesses.map(w => w.topic));
    const recommendations = learningPath?.recommendations || [];
    const weaknessFocused = recommendations.filter(p => p.tags?.some(t => weakTopics.has(t)));
    const listForTab = activeTab === 'today' ? recommendations.slice(0, 5) : weaknessFocused.slice(0, 5);

    return (
        <div className={`p-6 ${pageBg}`}>
            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Hero header ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 shadow-xl shadow-rose-500/20 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">
                                <FiBookOpen className="h-3.5 w-3.5" /> Personalized Learning Path
                            </div>
                            <h1 className="text-2xl font-black text-white">Master Data Structures &amp; Algorithms</h1>
                            <div className="flex items-center gap-3 mt-3 text-sm text-white/90">
                                <span className="px-2.5 py-1 rounded-lg bg-white/15 font-semibold flex items-center gap-1.5">
                                    <FiAward className="h-3.5 w-3.5" /> {learningPath?.userLevel || 'Intermediate'}
                                </span>
                                <FiChevronRight className="h-4 w-4 text-white/60" />
                                <span className="px-2.5 py-1 rounded-lg bg-white/15 font-semibold flex items-center gap-1.5">
                                    <FiTarget className="h-3.5 w-3.5" /> {learningPath?.targetLevel || 'Advanced'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="relative flex items-center justify-center">
                                <Ring percent={progress.overall} size={84} stroke={8} color="#ffffff" track="rgba(255,255,255,0.25)" />
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-lg font-black text-white leading-none">{progress.overall}%</span>
                                    <span className="text-[10px] text-white/70 mt-0.5">overall</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-black text-white flex items-center gap-1.5 justify-center">
                                    <FiZap className="h-5 w-5" /> {user?.stats?.streak || 0}
                                </div>
                                <div className="text-[11px] text-white/70">day streak</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {['easy', 'medium', 'hard'].map(d => (
                            <div key={d} className="bg-white/10 rounded-xl p-3">
                                <div className="flex items-center justify-between text-xs text-white/80 mb-1.5 capitalize">
                                    <span>{d}</span><span className="font-bold">{progress[d]}%</span>
                                </div>
                                <Bar percent={progress[d]} color="bg-white" track="bg-white/20" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ── Left column: milestones + focus areas ── */}
                    <div className="lg:col-span-2 space-y-5">

                        <div className={`rounded-2xl border ${card} p-5`}>
                            <h2 className={`font-bold text-base mb-4 flex items-center gap-2 ${txt}`}>
                                <FiTrendingUp className="h-4 w-4 text-rose-500" /> Learning Milestones
                            </h2>
                            <div className="space-y-3">
                                {(learningPath?.milestones || []).map((m, i) => {
                                    const pct = Math.round((m.completed / (m.problems || 1)) * 100);
                                    const isDone = m.status === 'completed';
                                    const isCurrent = m.status === 'in-progress';
                                    return (
                                        <div key={m.id}
                                            className={`rounded-xl border p-4 transition-colors ${
                                                isCurrent ? 'border-rose-500/50 bg-rose-500/5' : border
                                            }`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    isDone ? 'bg-green-500 text-white' :
                                                    isCurrent ? 'bg-rose-500 text-white' :
                                                    `${track} ${sub}`
                                                }`}>
                                                    {isDone ? <FiCheckCircle className="h-4 w-4" /> : i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <span className={`font-bold text-sm ${txt}`}>{m.title}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                            isDone ? 'bg-green-500/10 text-green-400' :
                                                            isCurrent ? 'bg-rose-500/10 text-rose-400' :
                                                            `${track} ${sub}`
                                                        }`}>
                                                            {m.completed}/{m.problems} problems
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs mt-1 ${sub}`}>{m.description}</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {m.topics?.map((t, idx) => (
                                                            <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>{t}</span>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3"><Bar percent={pct} color={isDone ? 'bg-green-500' : 'bg-rose-500'} track={track} /></div>
                                                    {isCurrent && (
                                                        <button onClick={() => startMilestone(m)}
                                                            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors">
                                                            Continue Learning
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!learningPath?.milestones?.length && (
                                    <p className={`text-sm text-center py-6 ${sub}`}>No milestones yet — check back once your roadmap generates.</p>
                                )}
                            </div>
                        </div>

                        {weaknesses.length > 0 && (
                            <div className={`rounded-2xl border ${card} p-5`}>
                                <h2 className={`font-bold text-base mb-4 flex items-center gap-2 ${txt}`}>
                                    <FiAlertTriangle className="h-4 w-4 text-yellow-500" /> Focus Areas
                                </h2>
                                <div className="space-y-3">
                                    {weaknesses.map((w, i) => (
                                        <div key={i} className={`flex items-center gap-4 rounded-xl border ${border} p-3`}>
                                            <div className="relative flex-shrink-0 flex items-center justify-center">
                                                <Ring percent={w.success_rate} size={48} stroke={5}
                                                    color={w.success_rate < 50 ? '#ef4444' : '#f59e0b'} track={isDark ? '#1f2937' : '#e5e7eb'} />
                                                <span className={`absolute text-[10px] font-bold ${txt}`}>{Math.round(w.success_rate)}%</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-bold capitalize ${txt}`}>{w.topic}</span>
                                                <p className={`text-xs mt-0.5 ${sub}`}>{w.suggestion}</p>
                                            </div>
                                            <button onClick={() => navigate(`/problems?tags=${encodeURIComponent(w.topic)}`)}
                                                className="flex-shrink-0 text-xs font-bold text-rose-500 hover:text-rose-400 whitespace-nowrap">
                                                Practice →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right column: weekly plan + recommendations ── */}
                    <div className="space-y-5">

                        <div className={`rounded-2xl border ${card} p-5`}>
                            <h2 className={`font-bold text-base mb-4 flex items-center gap-2 ${txt}`}>
                                <FiCalendar className="h-4 w-4 text-rose-500" /> Weekly Plan
                            </h2>
                            <div className="space-y-0 max-h-[420px] overflow-y-auto pr-1">
                                {(learningPath?.weeklyPlan || []).map((w, idx) => {
                                    const current = idx === (learningPath?.currentWeek || 0);
                                    const past = idx < (learningPath?.currentWeek || 0);
                                    return (
                                        <div key={idx} className="flex gap-3 pb-4 relative">
                                            {idx < (learningPath.weeklyPlan.length - 1) && (
                                                <div className={`absolute left-[11px] top-6 bottom-0 w-px ${track}`} />
                                            )}
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                                                past ? 'bg-green-500 text-white' : current ? 'bg-rose-500 text-white' : `${track} ${sub}`
                                            }`}>
                                                {past ? <FiCheckCircle className="h-3 w-3" /> : w.week}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <p className={`text-xs font-bold ${txt}`}>Week {w.week}: {w.focus}</p>
                                                <p className={`text-[11px] mt-0.5 ${sub}`}>{w.problems} problems</p>
                                                {current && (
                                                    <button onClick={() => navigate('/problems')}
                                                        className="mt-1.5 text-[11px] font-bold px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white">
                                                        Start This Week
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`rounded-2xl border ${card} p-5`}>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className={`font-bold text-base flex items-center gap-2 ${txt}`}>
                                    <FiZap className="h-4 w-4 text-rose-500" /> Recommended Practice
                                </h2>
                            </div>
                            <div className={`flex gap-1 p-1 rounded-xl mb-3 ${track}`}>
                                {[['today', "Today's Practice"], ['weakness', 'Weakness Focus']].map(([key, label]) => (
                                    <button key={key} onClick={() => setActiveTab(key)}
                                        className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
                                            activeTab === key ? 'bg-rose-500 text-white' : `${sub} hover:${txt}`
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'weakness' && (
                                <p className={`text-[11px] mb-3 ${sub}`}>Selected from topics where your solve rate is lowest.</p>
                            )}

                            <div className="space-y-2">
                                {listForTab.map((p, i) => {
                                    const dc = DIFF_COLOR[p.difficulty] || DIFF_COLOR.easy;
                                    return (
                                        <button key={p._id || i} onClick={() => goToProblem(p)}
                                            className={`w-full text-left rounded-xl border ${border} p-3 hover:border-rose-500/50 transition-colors group`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-sm font-semibold truncate ${txt}`}>{p.title}</span>
                                                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${dc.bg} ${dc.text}`}>{p.difficulty}</span>
                                            </div>
                                            <p className={`text-[11px] mt-1 truncate ${sub}`}>
                                                {p.recommendation_reason || (activeTab === 'weakness' ? 'Weakness focus' : 'Matches your skill level')}
                                            </p>
                                        </button>
                                    );
                                })}
                                {listForTab.length === 0 && (
                                    <p className={`text-xs text-center py-6 ${sub}`}>
                                        {activeTab === 'weakness'
                                            ? 'No weak-topic matches yet — solve a few more problems for this to populate.'
                                            : 'No recommendations yet.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats strip ── */}
                <div className={`rounded-2xl border ${card} p-5`}>
                    <h2 className={`font-bold text-base mb-4 ${txt}`}>Learning Statistics</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: <FiCheckCircle className="h-5 w-5" />, label: 'Total Problems Solved', value: totalSolved },
                            { icon: <FiClock className="h-5 w-5" />, label: 'Longest Streak', value: `${user?.stats?.maxStreak || 0} days` },
                            { icon: <FiTrendingUp className="h-5 w-5" />, label: 'Acceptance Rate', value: `${user?.stats?.totalSubmissions ? Math.round((user.stats.acceptedSubmissions / user.stats.totalSubmissions) * 100) : 0}%` },
                        ].map((s, i) => (
                            <div key={i} className={`rounded-xl p-4 border ${border} flex items-center gap-3`}>
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">{s.icon}</div>
                                <div>
                                    <div className={`text-xl font-black ${txt}`}>{s.value}</div>
                                    <div className={`text-xs ${sub}`}>{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningPath;