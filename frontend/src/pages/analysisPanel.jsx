/**
 * AnalysisPanel — Full-page detailed AI code analysis
 * Bigger, more accurate, more detailed than before
 */
import React, { useState } from 'react';
import {
  Brain, Clock, MemoryStick, AlertTriangle, CheckCircle, Lightbulb,
  TrendingUp, Loader2, Zap, Shield, Code, BarChart3, Target, 
  ChevronDown, ChevronUp, Cpu, Star, AlertCircle, Info,
} from 'lucide-react';
import useAnalysisStore from '../store/analysisStore';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const QUALITY_COLORS = {
  excellent: { text:'text-green-400',  bg:'bg-green-500/10',  border:'border-green-500/20',  label:'Excellent'  },
  good:      { text:'text-blue-400',   bg:'bg-blue-500/10',   border:'border-blue-500/20',   label:'Good'       },
  fair:      { text:'text-yellow-400', bg:'bg-yellow-500/10', border:'border-yellow-500/20', label:'Fair'       },
  poor:      { text:'text-red-400',    bg:'bg-red-500/10',    border:'border-red-500/20',    label:'Poor'       },
};

const SEVERITY = {
  high:   'bg-red-900/30 border-red-500/30 text-red-300',
  medium: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300',
  low:    'bg-blue-900/30 border-blue-500/30 text-blue-300',
};

const RATING_BADGE = {
  optimized:   'bg-green-500/20 text-green-400 border border-green-500/30',
  acceptable:  'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  inefficient: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const Tag = ({ children, color = 'purple' }) => {
  const colors = { purple:'bg-purple-500/20 text-purple-300 border-purple-500/30', green:'bg-green-500/20 text-green-300 border-green-500/30', blue:'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>{children}</span>;
};

const SectionHeader = ({ icon: Icon, title, badge }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2 text-gray-300 font-semibold text-sm">
      <Icon className="w-4 h-4" />
      <span>{title}</span>
    </div>
    {badge}
  </div>
);

const ScoreBar = ({ label, value, max = 100, color = 'bg-purple-500' }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-bold text-white">{value}{max === 100 ? '%' : `/${max}`}</span>
    </div>
    <div className="h-1.5 bg-gray-700 rounded-full">
      <div className={`h-full ${color} rounded-full transition-all duration-500`}
           style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function AnalysisPanel({
  code, language, submissionId, runtimeMs = 0,
  testCasesPassed = 0, totalTestCases = 0,
}) {
  const { analyzeCode, currentAnalysis, loading, error } = useAnalysisStore();
  const [analysisKey] = useState(submissionId || `${language}:${code?.slice(0, 20)}`);
  const [expandedSection, setExpandedSection] = useState(null);

  const isLoading = loading[analysisKey];
  const errMsg    = error[analysisKey];
  const analysis  = useAnalysisStore(s => s.analyses[analysisKey]) || currentAnalysis;

  const handleAnalyze = () => {
    analyzeCode({ code, language, submissionId, runtimeMs, testCasesPassed, totalTestCases });
  };

  const toggleSection = (sec) => setExpandedSection(s => s === sec ? null : sec);

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-4 text-gray-400 min-h-[300px]">
      <div className="relative">
        <Loader2 className="animate-spin w-12 h-12 text-purple-400" />
        <Brain className="absolute inset-0 m-auto w-5 h-5 text-purple-300" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-purple-300">Analyzing with Gemini AI...</p>
        <p className="text-sm text-gray-500 mt-1">This may take 5–15 seconds</p>
      </div>
    </div>
  );

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (!analysis) return (
    <div className="p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
        <Brain className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">AI Code Analysis</h3>
      <p className="text-gray-400 text-sm mb-2">Get detailed Gemini-powered analysis:</p>
      <ul className="text-xs text-gray-500 mb-6 space-y-1">
        <li>• Time & space complexity with explanation</li>
        <li>• Code quality score & style feedback</li>
        <li>• Anti-patterns & bugs detected in your code</li>
        <li>• Specific, actionable improvement suggestions</li>
        <li>• Edge cases you may have missed</li>
      </ul>
      {errMsg && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-500/30 text-red-400 text-xs rounded-xl space-y-1">
          <p className="font-bold">⚠ {errMsg.includes('offline') ? 'AI Service Offline' : 'Error'}</p>
          <p className="text-gray-400">{errMsg}</p>
          {errMsg.includes('offline') && (
            <div className="mt-2 bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-green-400 border border-gray-700">
              pip install google-generativeai<br/>
              cd ai-service && uvicorn src.main:app --port 8001
            </div>
          )}
        </div>
      )}
      <button onClick={handleAnalyze}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto">
        <Zap className="w-4 h-4" />
        Analyze Code
      </button>
    </div>
  );

  const m = analysis.metrics || {};
  const q = QUALITY_COLORS[analysis.quality_label] || QUALITY_COLORS.fair;
  const qScore = Math.round((analysis.quality_score || 0) * 100);
  const aiPowered = analysis.ai_powered !== false;

  return (
    <div className="p-5 space-y-5 text-sm overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-purple-300 font-bold">AI Analysis</span>
          {aiPowered && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
              Gemini
            </span>
          )}
        </div>
        <button onClick={handleAnalyze}
          className="text-xs text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-1">
          <Loader2 className="w-3 h-3" /> Re-analyze
        </button>
      </div>

      {/* ── Complexity Overview ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
            <Clock className="w-3 h-3" /> Time Complexity
          </div>
          <div className="text-white font-mono font-bold text-base">
            {analysis.time_complexity?.split(' — ')[0] || '—'}
          </div>
          {analysis.time_complexity?.includes('—') && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {analysis.time_complexity.split(' — ')[1]}
            </div>
          )}
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
            <MemoryStick className="w-3 h-3" /> Space Complexity
          </div>
          <div className="text-white font-mono font-bold text-base">
            {analysis.space_complexity?.split(' — ')[0] || '—'}
          </div>
          {analysis.space_complexity?.includes('—') && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {analysis.space_complexity.split(' — ')[1]}
            </div>
          )}
        </div>
      </div>

      {/* Best / Worst case */}
      {(analysis.best_case || analysis.worst_case) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
            <div className="text-xs text-green-400 mb-1">Best Case</div>
            <div className="font-mono text-xs text-gray-300">{analysis.best_case || '—'}</div>
          </div>
          <div className="bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/30">
            <div className="text-xs text-red-400 mb-1">Worst Case</div>
            <div className="font-mono text-xs text-gray-300">{analysis.worst_case || '—'}</div>
          </div>
        </div>
      )}

      {/* ── Quality + Performance ────────────────────────────────────────── */}
      <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 space-y-3">
        <SectionHeader icon={BarChart3} title="Code Quality" />
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${q.bg} border ${q.border} flex flex-col items-center justify-center`}>
            <span className={`text-2xl font-black ${q.text}`}>{qScore}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
          <div className="flex-1 space-y-2">
            <ScoreBar label="Overall Quality" value={qScore} color={qScore >= 80 ? 'bg-green-500' : qScore >= 60 ? 'bg-blue-500' : qScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'} />
            {analysis.performance_rating && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Performance:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${RATING_BADGE[analysis.performance_rating]}`}>
                  {analysis.performance_rating}
                </span>
              </div>
            )}
            {analysis.algorithm_detected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Algorithm:</span>
                <span className="text-xs text-purple-300 capitalize">{analysis.algorithm_detected}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Test Cases ──────────────────────────────────────────────────── */}
      {totalTestCases > 0 && (
        <div className={`rounded-xl p-3 border ${testCasesPassed === totalTestCases ? 'bg-green-900/20 border-green-500/20' : 'bg-red-900/20 border-red-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${testCasesPassed === totalTestCases ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-xs font-semibold text-gray-300">Test Cases</span>
            </div>
            <span className={`text-sm font-bold ${testCasesPassed === totalTestCases ? 'text-green-400' : 'text-red-400'}`}>
              {testCasesPassed}/{totalTestCases}
            </span>
          </div>
          {runtimeMs > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Zap className="w-3 h-3" /> Runtime: {runtimeMs}ms
            </div>
          )}
        </div>
      )}

      {/* ── Structural Metrics ───────────────────────────────────────────── */}
      {Object.keys(m).length > 0 && (
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <button className="flex items-center justify-between w-full"
            onClick={() => toggleSection('metrics')}>
            <div className="flex items-center gap-2 text-gray-300 font-semibold text-sm">
              <Cpu className="w-4 h-4" />
              <span>Structural Metrics</span>
            </div>
            {expandedSection === 'metrics' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {expandedSection === 'metrics' && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {[
                  ['Lines of code',       m.lines_of_code],
                  ['Code lines',          m.code_lines],
                  ['Comment lines',       m.comment_lines],
                  ['Functions',           m.function_count],
                  ['Loops',               m.loop_count],
                  ['Max nesting',         m.max_nesting_depth],
                  ['Cyclomatic CC',       m.cyclomatic_complexity],
                  ['Avg line length',     m.avg_line_length != null ? `${m.avg_line_length.toFixed(1)} chars` : null],
                  ['Comment density',     m.comment_density != null ? `${(m.comment_density*100).toFixed(1)}%` : null],
                ].filter(([,v]) => v != null).map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-gray-700/30 pb-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-mono">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.uses_recursion     && <Tag>Recursive</Tag>}
                {m.uses_dp            && <Tag color="green">Dynamic Programming</Tag>}
                {m.uses_binary_search && <Tag color="blue">Binary Search</Tag>}
                {m.uses_sorting       && <Tag>Sorting</Tag>}
                {m.uses_hashmap       && <Tag color="green">Hash Map</Tag>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Code Strengths ───────────────────────────────────────────────── */}
      {analysis.code_strengths?.length > 0 && (
        <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/20">
          <SectionHeader icon={Star} title="What's Good" />
          <ul className="space-y-1.5">
            {analysis.code_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-green-300">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Correctness Issues ───────────────────────────────────────────── */}
      {analysis.correctness_issues?.length > 0 && (
        <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20">
          <SectionHeader icon={AlertCircle} title="Correctness Issues" />
          <ul className="space-y-1.5">
            {analysis.correctness_issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Anti-patterns ────────────────────────────────────────────────── */}
      {analysis.anti_patterns?.length > 0 && (
        <div>
          <SectionHeader icon={AlertTriangle} title={`Anti-patterns (${analysis.anti_patterns.length})`} />
          <div className="space-y-2">
            {analysis.anti_patterns.map((ap, i) => (
              <div key={i} className={`rounded-xl p-3 border text-xs ${SEVERITY[ap.severity] || SEVERITY.low}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold capitalize">{ap.type?.replace(/_/g, ' ')}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ap.severity === 'high' ? 'bg-red-500/20' : ap.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                    {ap.severity}
                  </span>
                </div>
                <p>{ap.description}</p>
                {ap.line_hint && <p className="text-gray-500 mt-1 italic text-xs">{ap.line_hint}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edge Cases Missed ────────────────────────────────────────────── */}
      {analysis.edge_cases_missed?.length > 0 && (
        <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-500/20">
          <SectionHeader icon={Target} title="Edge Cases to Consider" />
          <ul className="space-y-1.5">
            {analysis.edge_cases_missed.map((ec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-orange-300">
                <Info className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                {ec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Suggestions ──────────────────────────────────────────────────── */}
      {analysis.suggestions?.length > 0 && (
        <div>
          <SectionHeader icon={Lightbulb} title="Specific Suggestions" />
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center font-bold mt-0.5">
                  {i + 1}
                </div>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Bottleneck Analysis ──────────────────────────────────────────── */}
      {analysis.bottleneck_analysis?.length > 0 && (
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
          <button className="flex items-center justify-between w-full"
            onClick={() => toggleSection('bottleneck')}>
            <div className="flex items-center gap-2 text-gray-300 font-semibold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Bottleneck Analysis</span>
            </div>
            {expandedSection === 'bottleneck' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {expandedSection === 'bottleneck' && (
            <ul className="mt-3 space-y-2">
              {analysis.bottleneck_analysis.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-yellow-300">
                  <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Data structures ──────────────────────────────────────────────── */}
      {analysis.data_structures_used?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 self-center">Data structures:</span>
          {analysis.data_structures_used.map((ds, i) => (
            <Tag key={i} color="blue">{ds}</Tag>
          ))}
        </div>
      )}

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      {analysis.explanation && (
        <div className={`rounded-xl p-4 border ${q.bg} ${q.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`w-3.5 h-3.5 ${q.text}`} />
            <span className={`text-xs font-bold ${q.text}`}>AI Summary</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{analysis.explanation}</p>
        </div>
      )}
    </div>
  );
}