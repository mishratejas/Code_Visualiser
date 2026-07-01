import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiPlay, FiRefreshCw, FiClock, FiCode, FiCpu,
  FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiMessageSquare, FiAward, FiZap, FiTarget,
} from 'react-icons/fi';
import { BsLightningChargeFill, BsCheckCircleFill, BsXCircleFill, BsBraces } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import ThemeToggle from '../../components/common/ThemeToggle';
import CodeEditor from '../../components/editor/CodeEditor';

/* ─── Difficulty badge ──────────────────────────────────────────────────────── */
const DiffBadge = ({ d }) => {
  const map = { easy:'bg-green-500/15 text-green-400 border-green-500/30', medium:'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', hard:'bg-red-500/15 text-red-400 border-red-500/30' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${map[d]||map.medium}`}>{d}</span>;
};

/* ─── Circular timer ────────────────────────────────────────────────────────── */
const CircleTimer = ({ seconds, maxSeconds }) => {
  const pct = Math.max(0, seconds / maxSeconds);
  const r = 36, circ = 2 * Math.PI * r;
  const color = seconds < 60 ? '#ef4444' : seconds < 180 ? '#f59e0b' : '#10b981';
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <div className="text-center">
        <div className="text-lg font-black" style={{ color }}>{mm}:{ss}</div>
        <div className="text-xs text-gray-500">left</div>
      </div>
    </div>
  );
};

/* ─── Score badge ───────────────────────────────────────────────────────────── */
const ScoreBadge = ({ score }) => {
  const color = score >= 80 ? 'from-green-500 to-emerald-500' : score >= 50 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-rose-500';
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${color} text-white rounded-xl font-bold text-lg shadow-lg`}>
      <FiAward /> {score}/100
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const Interview = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Session state
  const [phase, setPhase]           = useState('setup');   // setup | active | result | history
  const [question, setQuestion]     = useState(null);
  const [code, setCode]             = useState('');
  const [language, setLanguage]     = useState('python');
  const [explanation, setExplanation] = useState('');
  const [hintLevel, setHintLevel]   = useState(0);
  const [hint, setHint]             = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft]     = useState(0);
  const [maxTime, setMaxTime]       = useState(0);
  const timerRef = useRef(null);

  // Session history
  const [history, setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('interview_history') || '[]'); } catch { return []; }
  });

  // Config
  const [config, setConfig] = useState({
    difficulty: 'medium',
    topic: '',
    timeLimit: 30,
  });

  const bg   = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';
  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-600';
  const inp  = isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';

  /* ── Timer ────────────────────────────────────────────────────────────────── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback((seconds) => {
    stopTimer();
    setTimeLeft(seconds);
    setMaxTime(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          toast.error("⏰ Time's up! Submitting your solution...");
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  /* ── Fetch Question ──────────────────────────────────────────────────────── */
  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/interview/question', {
        difficulty: config.difficulty,
        topic: config.topic || null,
        user_id: user?._id || user?.id || '',
      });
      const q = res?.data || res;
      setQuestion(q);
      setCode(getDefaultCode(language));
      setExplanation('');
      setHint(null);
      setHintLevel(0);
      setEvaluation(null);
      setPhase('active');
      startTimer(config.timeLimit * 60);
    } catch (err) {
      toast.error('Failed to load question. Check AI service connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Get Hint ────────────────────────────────────────────────────────────── */
  const getHint = async () => {
    if (!question) return;
    setHintLoading(true);
    try {
      const res = await api.post('/ai/interview/hint', {
        code,
        question,
        hint_level: hintLevel + 1,
      });
      setHint(res?.data || res);
      setHintLevel(l => l + 1);
    } catch {
      toast.error('Failed to get hint');
    } finally {
      setHintLoading(false);
    }
  };

  /* ── Submit / Evaluate ───────────────────────────────────────────────────── */
  const handleSubmit = async (forced = false) => {
    if (!question) return;
    if (!code.trim() && !forced) { toast.error('Write some code first!'); return; }
    stopTimer();
    setEvalLoading(true);
    try {
      const res = await api.post('/ai/interview/evaluate', {
        code: code || '# No code submitted',
        language,
        question,
        explanation,
      });
      const result = res?.data || res;
      setEvaluation(result);
      setPhase('result');

      // Save to history
      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        question: { title: question.title, difficulty: question.difficulty },
        score: result.overall_score || 0,
        passed: (result.overall_score || 0) >= 60,
        timeUsed: maxTime - timeLeft,
        language,
      };
      const newHistory = [entry, ...history.slice(0, 19)];
      setHistory(newHistory);
      localStorage.setItem('interview_history', JSON.stringify(newHistory));
    } catch (err) {
      toast.error('Evaluation failed — check AI service');
    } finally {
      setEvalLoading(false);
    }
  };

  const resetSession = () => {
    stopTimer();
    setPhase('setup');
    setQuestion(null);
    setCode('');
    setEvaluation(null);
    setHint(null);
    setHintLevel(0);
  };

  const getDefaultCode = (lang) => ({
    python:     '# Write your solution here\ndef solution():\n    pass\n',
    javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
    java:       '// Write your solution here\nclass Solution {\n    public void solve() {\n        \n    }\n}\n',
    cpp:        '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    \n}\n',
    c:          '#include <stdio.h>\n\nvoid solution() {\n    \n}\n',
  }[lang] || '// Write your solution here\n');

  const topics = ['Array','String','Linked List','Tree','Graph','DP','Backtracking','Greedy','Sorting','Binary Search','Hash Table','Stack','Queue','Math','Sliding Window'];

  /* ══════════════════════════════════════════════════════════════════════════ */
  /* SETUP SCREEN                                                              */
  /* ══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'setup') return (
    <div className={`min-h-screen ${bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-black ${txt}`}>AI Interview</h1>
            <p className={`text-sm ${sub} mt-1`}>Simulate real technical interviews with Gemini AI</p>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => setPhase('history')} className={`px-4 py-2 rounded-xl border text-sm font-medium ${card} ${sub} hover:text-rose-400`}>
              My History
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'Sessions', value: history.length, color:'text-blue-400' },
              { label:'Avg Score', value: Math.round(history.reduce((a,h)=>a+(h.score||0),0)/history.length), color:'text-yellow-400' },
              { label:'Pass Rate', value: `${Math.round((history.filter(h=>h.passed).length/history.length)*100)}%`, color:'text-green-400' },
            ].map(s => (
              <div key={s.label} className={`${card} border rounded-2xl p-4 text-center`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className={`text-xs ${sub} mt-1`}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Config Card */}
        <div className={`${card} border rounded-2xl p-6 space-y-6`}>
          <h2 className={`text-lg font-bold ${txt}`}>Configure Your Session</h2>

          {/* Difficulty */}
          <div>
            <label className={`block text-sm font-semibold ${txt} mb-3`}>Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {['easy','medium','hard'].map(d => (
                <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                  className={`py-3 rounded-xl border font-semibold text-sm capitalize transition-all ${
                    config.difficulty === d
                      ? d === 'easy' ? 'bg-green-500/20 border-green-500 text-green-400'
                      : d === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-red-500/20 border-red-500 text-red-400'
                      : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {d === 'easy' ? '😊 Easy' : d === 'medium' ? '🤔 Medium' : '🔥 Hard'}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className={`block text-sm font-semibold ${txt} mb-3`}>Topic (optional)</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setConfig(c => ({ ...c, topic: '' }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  !config.topic ? 'bg-rose-500/20 border-rose-500 text-rose-400' : isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
                }`}>
                Any Topic
              </button>
              {topics.map(t => (
                <button key={t} onClick={() => setConfig(c => ({ ...c, topic: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    config.topic === t ? 'bg-rose-500/20 border-rose-500 text-rose-400' : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-600'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label className={`block text-sm font-semibold ${txt} mb-3`}>
              Time Limit: <span className="text-rose-400">{config.timeLimit} minutes</span>
            </label>
            <input type="range" min="10" max="90" step="5" value={config.timeLimit}
              onChange={e => setConfig(c => ({ ...c, timeLimit: +e.target.value }))}
              className="w-full accent-rose-500" />
            <div className={`flex justify-between text-xs ${sub} mt-1`}>
              <span>10 min (Quick)</span>
              <span>45 min (Standard)</span>
              <span>90 min (Extended)</span>
            </div>
          </div>

          <button onClick={fetchQuestion} disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-bold text-lg hover:from-rose-600 hover:to-red-600 transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? <><FiRefreshCw className="animate-spin" /> Generating Question...</> : <><FiPlay /> Start Interview</>}
          </button>
        </div>

        {/* How it works */}
        <div className={`${card} border rounded-2xl p-6`}>
          <h3 className={`font-bold ${txt} mb-4`}>How It Works</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { icon:'1', label:'Get Question', desc:'Gemini generates a real DSA problem based on your config' },
              { icon:'2', label:'Write Solution', desc:'Code your solution in any language with our Monaco editor' },
              { icon:'3', label:'Ask Hints', desc:'Get progressive hints without spoiling the full solution' },
              { icon:'4', label:'AI Evaluation', desc:'Detailed analysis of correctness, complexity & code quality' },
            ].map(s => (
              <div key={s.icon} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-500 text-white font-black text-lg flex items-center justify-center mx-auto mb-2">
                  {s.icon}
                </div>
                <p className={`text-sm font-semibold ${txt}`}>{s.label}</p>
                <p className={`text-xs ${sub} mt-1`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════ */
  /* ACTIVE INTERVIEW                                                          */
  /* ══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'active') return (
    <div className={`min-h-screen ${bg}`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className={`text-sm font-bold ${txt}`}>{question?.title || 'Interview'}</span>
          {question?.difficulty && <DiffBadge d={question.difficulty} />}
        </div>
        <div className="flex items-center gap-4">
          <CircleTimer seconds={timeLeft} maxSeconds={maxTime} />
          <button onClick={() => { if (window.confirm('Abandon this session?')) resetSession(); }}
            className={`text-xs ${sub} hover:text-red-400`}>Exit</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 h-[calc(100vh-65px)]">
        {/* Left: Question */}
        <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r overflow-y-auto p-6 space-y-6`}>
          {question && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DiffBadge d={question.difficulty} />
                  {question.topics?.map(t => (
                    <span key={t} className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{t}</span>
                  ))}
                </div>
                <h2 className={`text-xl font-black ${txt} mb-4`}>{question.title}</h2>
                <p className={`text-sm leading-relaxed ${sub}`}>{question.description}</p>
              </div>

              {/* Examples */}
              {question.examples?.map((ex, i) => (
                <div key={i} className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-bold ${sub} mb-2`}>EXAMPLE {i+1}</p>
                  <div className="space-y-1 font-mono text-sm">
                    <p><span className={sub}>Input:</span> <span className={txt}>{ex.input}</span></p>
                    <p><span className={sub}>Output:</span> <span className="text-green-400">{ex.output}</span></p>
                    {ex.explanation && <p className={`text-xs ${sub} mt-1`}>{ex.explanation}</p>}
                  </div>
                </div>
              ))}

              {/* Sample input/output if no examples */}
              {!question.examples && question.sample_input && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-bold ${sub} mb-2`}>EXAMPLE</p>
                  <div className="space-y-1 font-mono text-sm">
                    <p><span className={sub}>Input:</span> <span className={txt}>{question.sample_input}</span></p>
                    <p><span className={sub}>Output:</span> <span className="text-green-400">{question.sample_output}</span></p>
                  </div>
                </div>
              )}

              {/* Constraints */}
              {question.constraints?.length > 0 && (
                <div>
                  <p className={`text-xs font-bold ${sub} mb-2`}>CONSTRAINTS</p>
                  <ul className="space-y-1">
                    {question.constraints.map((c, i) => (
                      <li key={i} className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hint section */}
              <div className={`rounded-xl border p-4 ${isDark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                {hint ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <FiZap className="text-yellow-400 h-4 w-4" />
                      <span className="text-xs font-bold text-yellow-400">HINT {hintLevel}</span>
                    </div>
                    <p className={`text-sm ${sub}`}>{hint.hint || hint.content || JSON.stringify(hint)}</p>
                    {hintLevel < 3 && (
                      <button onClick={getHint} disabled={hintLoading}
                        className="mt-3 text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 disabled:opacity-50">
                        {hintLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                        Get next hint (–5 points)
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={getHint} disabled={hintLoading}
                    className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm disabled:opacity-50">
                    {hintLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
                    Get a hint
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Editor */}
        <div className="flex flex-col overflow-hidden">
          {/* Language selector */}
          <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <FiCode className={sub} />
              <select value={language} onChange={e => { setLanguage(e.target.value); setCode(getDefaultCode(e.target.value)); }}
                className={`text-sm rounded-lg px-2 py-1 border ${inp} focus:outline-none focus:ring-1 focus:ring-rose-500`}>
                {['python','javascript','java','cpp','c'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <span className={`text-xs ${sub}`}>Lines: {code.split('\n').length}</span>
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={setCode} language={language} theme={isDark ? 'vs-dark' : 'light'} />
          </div>

          {/* Explanation */}
          <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} p-4`}>
            <label className={`text-xs font-bold ${sub} mb-2 block`}>
              EXPLAIN YOUR APPROACH (optional, improves score)
            </label>
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              rows={2}
              placeholder="Briefly explain your algorithm, time/space complexity..."
              className={`w-full text-xs rounded-xl border p-3 resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}
            />
          </div>

          {/* Actions */}
          <div className={`px-4 pb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex gap-3`}>
            <button onClick={() => handleSubmit(false)} disabled={evalLoading}
              className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-bold text-sm hover:from-rose-600 hover:to-red-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {evalLoading ? <><FiRefreshCw className="animate-spin" /> Evaluating...</> : <><BsLightningChargeFill /> Submit & Evaluate</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════ */
  /* RESULT SCREEN                                                             */
  /* ══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'result' && evaluation) return (
    <div className={`min-h-screen ${bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-black ${txt}`}>Interview Results</h1>
            <p className={`text-sm ${sub}`}>{question?.title}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={resetSession} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-bold text-sm">
              New Interview
            </button>
          </div>
        </div>

        {/* Score */}
        <div className={`${card} border rounded-2xl p-6 text-center`}>
          <ScoreBadge score={evaluation.overall_score || 0} />
          <p className={`text-sm ${sub} mt-3`}>
            {(evaluation.overall_score||0) >= 80 ? '🎉 Excellent! Ready for top tech companies.' :
             (evaluation.overall_score||0) >= 60 ? '👍 Good effort! A few areas to improve.' :
             '📚 Keep practicing — you\'re on the right track.'}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label:'Correctness', value: evaluation.correctness_score || 0, color:'text-green-400' },
              { label:'Code Quality', value: evaluation.code_quality_score || 0, color:'text-blue-400' },
              { label:'Efficiency', value: evaluation.efficiency_score || 0, color:'text-purple-400' },
            ].map(s => (
              <div key={s.label} className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-3`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}/100</div>
                <div className={`text-xs ${sub} mt-1`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Feedback */}
          <div className={`${card} border rounded-2xl p-6 space-y-4`}>
            <h3 className={`font-bold ${txt}`}>Detailed Feedback</h3>

            {evaluation.correctness_feedback && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FiCheck className="text-green-400 h-4 w-4" />
                  <span className={`text-xs font-bold ${txt}`}>Correctness</span>
                </div>
                <p className={`text-sm ${sub}`}>{evaluation.correctness_feedback}</p>
              </div>
            )}

            {evaluation.time_complexity && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FiClock className="text-yellow-400 h-4 w-4" />
                  <span className={`text-xs font-bold ${txt}`}>Complexity</span>
                </div>
                <div className="flex gap-4">
                  <span className={`text-sm font-mono ${sub}`}>Time: <span className="text-yellow-400">{evaluation.time_complexity}</span></span>
                  <span className={`text-sm font-mono ${sub}`}>Space: <span className="text-blue-400">{evaluation.space_complexity || 'N/A'}</span></span>
                </div>
              </div>
            )}

            {evaluation.code_quality_feedback && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <BsBraces className="text-blue-400 h-4 w-4" />
                  <span className={`text-xs font-bold ${txt}`}>Code Quality</span>
                </div>
                <p className={`text-sm ${sub}`}>{evaluation.code_quality_feedback}</p>
              </div>
            )}
          </div>

          {/* Improvements & Optimal solution hints */}
          <div className={`${card} border rounded-2xl p-6 space-y-4`}>
            <h3 className={`font-bold ${txt}`}>How to Improve</h3>

            {evaluation.improvements?.length > 0 && (
              <ul className="space-y-2">
                {evaluation.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiTarget className="text-rose-400 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className={`text-sm ${sub}`}>{imp}</span>
                  </li>
                ))}
              </ul>
            )}

            {evaluation.optimal_approach && (
              <div className={`rounded-xl p-4 border-l-4 border-green-500 ${isDark ? 'bg-green-500/5' : 'bg-green-50'}`}>
                <p className={`text-xs font-bold ${txt} mb-1`}>💡 Optimal Approach</p>
                <p className={`text-sm ${sub}`}>{evaluation.optimal_approach}</p>
              </div>
            )}

            {evaluation.hints_for_next_time?.length > 0 && (
              <div>
                <p className={`text-xs font-bold ${txt} mb-2`}>Next Time Tips</p>
                {evaluation.hints_for_next_time.map((h, i) => (
                  <p key={i} className={`text-xs ${sub} mb-1`}>• {h}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Your code */}
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          <div className={`px-5 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm font-bold ${txt}`}>Your Submitted Code</span>
          </div>
          <pre className={`p-5 overflow-x-auto text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'} max-h-64`}>
            {code}
          </pre>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════ */
  /* HISTORY SCREEN                                                            */
  /* ══════════════════════════════════════════════════════════════════════════ */
  if (phase === 'history') return (
    <div className={`min-h-screen ${bg} py-8 px-4`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-black ${txt}`}>Interview History</h1>
          <button onClick={() => setPhase('setup')} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-sm font-bold">
            New Interview
          </button>
        </div>

        {history.length === 0 ? (
          <div className={`${card} border rounded-2xl p-12 text-center`}>
            <FiTarget className={`h-12 w-12 mx-auto mb-4 ${sub} opacity-30`} />
            <p className={sub}>No interview sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className={`${card} border rounded-2xl p-4 flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${h.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {h.passed ? <BsCheckCircleFill className="text-green-400 h-6 w-6" /> : <BsXCircleFill className="text-red-400 h-6 w-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${txt} truncate`}>{h.question.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <DiffBadge d={h.question.difficulty} />
                    <span className={`text-xs ${sub}`}>{h.language}</span>
                    <span className={`text-xs ${sub}`}>{new Date(h.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black ${h.score >= 80 ? 'text-green-400' : h.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {h.score}
                  </div>
                  <div className={`text-xs ${sub}`}>score</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return <div className={`min-h-screen ${bg} flex items-center justify-center`}><Loader /></div>;
};

export default Interview;