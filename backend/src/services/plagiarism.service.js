/**
 * Plagiarism Detection Service — runs entirely in Node.js, no external AI service needed.
 *
 * Algorithms:
 *   1. Winnowing  — document fingerprinting via k-gram hashing + sliding window min-hash
 *   2. Structural — control-flow token counting
 *
 * Combined score: 60% Winnowing + 40% Structural
 * Default threshold: 0.75
 *
 * Rules:
 *   - Only compares submissions from DIFFERENT users (same-user pairs are skipped)
 *   - Per user per problem: only the best submission is used
 *     (accepted > latest attempt) to avoid noise from failed attempts
 */

import crypto from 'crypto';
import PlagiarismReport from '../models/plagiarism.models.js';
import Submission from '../models/submission.models.js';
import ContestSubmission from '../models/postgres/ContestSubmission.models.js';
import logger from '../config/logger.js';

// ── Winnowing ─────────────────────────────────────────────────────────────────

function normalize(code, language) {
  let c = code || '';
  if (['java', 'cpp', 'c', 'javascript', 'typescript'].includes(language)) {
    c = c.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (language === 'python') {
    c = c.replace(/#.*$/gm, '').replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
  }
  c = c.replace(/"[^"]*"|'[^']*'/g, 'STR');
  c = c.replace(/\b\d+(\.\d+)?\b/g, 'NUM');
  return c;
}

const KEYWORDS = new Set([
  'def','class','return','if','else','elif','for','while','import','from',
  'in','not','and','or','True','False','None','try','except','finally',
  'with','as','pass','break','continue','lambda','yield','print','range','len','self',
  'int','long','void','bool','boolean','string','String','char',
  'public','private','static','new','null','true','false',
  'this','extends','implements','interface',
  'const','let','var','function','async','await','undefined','typeof','instanceof',
  'STR','NUM',
]);

function tokenize(code, language) {
  const c = normalize(code, language);
  const raw = c.match(/\b\w+\b|[{}()[\];=+\-*/<>!&|]/g) || [];
  return raw.map(t => (KEYWORDS.has(t) || /^[{}()[\];=+\-*/<>!&|]$/.test(t)) ? t : 'ID');
}

function hashStr(s) {
  return parseInt(crypto.createHash('md5').update(s).digest('hex').slice(0, 8), 16);
}

function winnowFingerprint(code, language, k = 7, w = 5) {
  const tokens = tokenize(code, language);
  if (tokens.length < k) {
    return new Set(tokens.map(t => hashStr(t)));
  }
  const hashes = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    hashes.push(hashStr(tokens.slice(i, i + k).join(' ')));
  }
  const fingerprints = new Set();
  let prevMin = null;
  const window = [];
  for (const h of hashes) {
    window.push(h);
    if (window.length > w) window.shift();
    if (window.length === w) {
      const curMin = Math.min(...window);
      if (curMin !== prevMin) {
        fingerprints.add(curMin);
        prevMin = curMin;
      }
    }
  }
  return fingerprints;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersection = 0;
  for (const h of setA) { if (setB.has(h)) intersection++; }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// ── Structural similarity ─────────────────────────────────────────────────────

const CONTROL_PATTERNS = [
  /\bfor\b/g, /\bwhile\b/g, /\bif\b/g, /\belse\b/g,
  /\bswitch\b/g, /\breturn\b/g, /\bbreak\b/g, /\bcontinue\b/g,
];

function structuralSimilarity(code1, code2) {
  const vec = (c) => CONTROL_PATTERNS.map(p => (c.match(p) || []).length);
  const v1 = vec(code1);
  const v2 = vec(code2);
  const total = v1.reduce((s, a, i) => s + Math.max(a, v2[i]), 0);
  if (total === 0) return 0.5;
  const agree = v1.reduce((s, a, i) => s + Math.min(a, v2[i]), 0);
  return agree / total;
}

// ── Compare a pair ────────────────────────────────────────────────────────────

function comparePair(s1, s2, threshold = 0.75) {
  const lang1 = (s1.language || 'python').toLowerCase();
  const lang2 = (s2.language || 'python').toLowerCase();

  const fp1 = s1._fp || winnowFingerprint(s1.code, lang1);
  const fp2 = s2._fp || winnowFingerprint(s2.code, lang2);

  const winnowSim  = jaccardSimilarity(fp1, fp2);
  const structSim  = lang1 === lang2 ? structuralSimilarity(s1.code, s2.code) : 0.0;
  const overallSim = 0.6 * winnowSim + 0.4 * structSim;

  return { winnowSim, structSim, overallSim, isSuspicious: overallSim >= threshold };
}

// ── Main Service ──────────────────────────────────────────────────────────────

class PlagiarismService {
  constructor() {
    this.threshold = 0.75;
  }

  async checkContest(contestId, checkedBy = null) {
    try {
      // Step 1 — load ALL contest submissions from PostgreSQL
      const contestSubs = await ContestSubmission.findAll({
        where: { contest_id: contestId },
        attributes: ['submission_id', 'user_id', 'problem_id', 'language', 'status', 'submitted_at'],
        order: [['submitted_at', 'ASC']],
      });

      if (contestSubs.length < 2) {
        return {
          totalSubmissions: contestSubs.length,
          suspiciousPairs:  [],
          averageSimilarity: 0,
          message: 'Not enough submissions to run plagiarism check (need at least 2)',
        };
      }

      // Step 2 — pick the BEST submission per (user, problem)
      //   Priority: accepted > latest attempt
      //   This eliminates noise from failed attempts and prevents
      //   a single user's own submissions from being compared against each other
      const bestMap = new Map(); // key: `${user_id}:${problem_id}` → best row
      for (const cs of contestSubs) {
        const key = `${cs.user_id}:${cs.problem_id}`;
        const existing = bestMap.get(key);
        if (!existing) {
          bestMap.set(key, cs);
        } else {
          // Prefer accepted over any other status
          const csAccepted = cs.status === 'accepted';
          const exAccepted = existing.status === 'accepted';
          if (csAccepted && !exAccepted) {
            bestMap.set(key, cs); // take the accepted one
          } else if (csAccepted === exAccepted) {
            bestMap.set(key, cs); // both same status — take the later one
          }
          // if existing is accepted and cs is not — keep existing
        }
      }

      const bestSubs = Array.from(bestMap.values());

      // Step 3 — load code from MongoDB
      const submissionIds = bestSubs.map(s => s.submission_id).filter(id => {
        // Only include valid MongoDB ObjectId strings (24 hex chars)
        return id && /^[a-f\d]{24}$/i.test(id);
      });

      if (submissionIds.length < 2) {
        logger.warn(`Plagiarism check: only ${submissionIds.length} valid MongoDB submission IDs found for contest ${contestId}`);
        return {
          totalSubmissions: bestSubs.length,
          suspiciousPairs:  [],
          averageSimilarity: 0,
          message: 'Could not find enough valid submission references in database',
        };
      }

      const mongoSubs = await Submission.find({ _id: { $in: submissionIds } })
        .select('_id code language user')
        .populate('user', 'username')
        .lean();

      const subMap = Object.fromEntries(mongoSubs.map(s => [s._id.toString(), s]));

      // Step 4 — merge metadata + code, pre-compute fingerprints
      const submissions = bestSubs
        .map(cs => {
          const mongo = subMap[cs.submission_id];
          if (!mongo?.code) return null;
          const lang = (cs.language || mongo.language || 'python').toLowerCase();
          return {
            submission_id: cs.submission_id,
            user_id:       cs.user_id,
            problem_id:    cs.problem_id,
            code:          mongo.code,
            language:      lang,
            username:      mongo.user?.username || cs.user_id,
            _fp:           winnowFingerprint(mongo.code, lang),
          };
        })
        .filter(Boolean);

      logger.info(`Plagiarism check contest ${contestId}: ${submissions.length} best submissions from ${new Set(submissions.map(s => s.user_id)).size} users`);

      if (submissions.length < 2) {
        return {
          totalSubmissions: contestSubs.length,
          suspiciousPairs:  [],
          averageSimilarity: 0,
          message: 'Could not load code for enough submissions',
        };
      }

      // Step 5 — O(n²) pair comparison
      //   ONLY compare submissions from DIFFERENT users for the SAME problem
      //   Comparing cross-problem is meaningless (different problems have different solutions)
      const suspiciousPairs = [];
      const allSimilarities = [];

      for (let i = 0; i < submissions.length; i++) {
        for (let j = i + 1; j < submissions.length; j++) {
          const s1 = submissions[i];
          const s2 = submissions[j];

          // ✅ KEY FIX: skip same-user pairs — a user cannot plagiarise themselves
          if (s1.user_id === s2.user_id) continue;

          // Only compare submissions for the same problem
          if (s1.problem_id !== s2.problem_id) continue;

          // Skip cross-language pairs
          if (s1.language !== s2.language) continue;

          const { winnowSim, structSim, overallSim, isSuspicious } = comparePair(s1, s2, this.threshold);
          allSimilarities.push(overallSim);

          if (isSuspicious) {
            suspiciousPairs.push({
              submission1:          s1.submission_id,
              submission2:          s2.submission_id,
              user1:                s1.user_id,
              user2:                s2.user_id,
              similarityScore:      Math.round(overallSim * 1000) / 1000,
              tokenSimilarity:      Math.round(winnowSim  * 1000) / 1000,
              astSimilarity:        Math.round(structSim  * 1000) / 1000,
              structuralSimilarity: Math.round(structSim  * 1000) / 1000,
              isSuspicious:         true,
              verdict:              'pending',
            });
          }
        }
      }

      const averageSimilarity = allSimilarities.length
        ? allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length
        : 0;

      // Step 6 — save report (replace any existing for this contest)
      await PlagiarismReport.deleteOne({ contest: contestId });
      const report = await PlagiarismReport.create({
        contest:           contestId,
        totalSubmissions:  submissions.length,
        checkedBy,
        checkedAt:         new Date(),
        status:            'completed',
        averageSimilarity: Math.round(averageSimilarity * 1000) / 1000,
        threshold:         this.threshold,
        suspiciousPairs,
        metadata: {
          algorithmsUsed: ['winnowing', 'structural'],
          version:        '2.1-local',
        },
      });

      logger.info(`Plagiarism check done for contest ${contestId}: ${suspiciousPairs.length} suspicious pair(s) among ${submissions.length} best submissions`);
      return report;

    } catch (error) {
      logger.error('Plagiarism check failed:', error.message);
      throw new Error(`Plagiarism check failed: ${error.message}`);
    }
  }

  async autoCheckOnContestEnd(contestId) {
    try {
      logger.info(`Auto-running plagiarism check for contest ${contestId}`);
      const report = await this.checkContest(contestId, null);
      const suspicious = report.suspiciousPairs?.length || 0;
      logger.info(`Auto plagiarism check done: ${suspicious} suspicious pair(s) for contest ${contestId}`);
      return report;
    } catch (err) {
      logger.error(`Auto plagiarism check failed for contest ${contestId}:`, err.message);
    }
  }

  async getReport(contestId) {
    const report = await PlagiarismReport.findOne({ contest: contestId })
      .sort({ checkedAt: -1 })
      .populate('suspiciousPairs.user1', 'username email')
      .populate('suspiciousPairs.user2', 'username email');

    if (!report) {
      throw new Error('No plagiarism report found for this contest');
    }
    return report;
  }

  async compareTwo(submission1Id, submission2Id) {
    try {
      const [sub1, sub2] = await Promise.all([
        Submission.findById(submission1Id).select('code language user').lean(),
        Submission.findById(submission2Id).select('code language user').lean(),
      ]);
      if (!sub1 || !sub2) throw new Error('One or both submissions not found');

      const lang1 = (sub1.language || 'python').toLowerCase();
      const lang2 = (sub2.language || 'python').toLowerCase();
      const { winnowSim, structSim, overallSim, isSuspicious } = comparePair(
        { code: sub1.code, language: lang1 },
        { code: sub2.code, language: lang2 },
        this.threshold
      );

      return {
        submission1_id:       submission1Id,
        submission2_id:       submission2Id,
        overall_similarity:   Math.round(overallSim * 1000) / 1000,
        winnowing_similarity: Math.round(winnowSim  * 1000) / 1000,
        ast_similarity:       Math.round(structSim  * 1000) / 1000,
        is_suspicious:        isSuspicious,
        threshold:            this.threshold,
      };
    } catch (error) {
      logger.error('Comparison failed:', error.message);
      throw new Error('Failed to compare submissions');
    }
  }

  async reviewPair(contestId, submission1Id, submission2Id, verdict, notes, reviewedBy) {
    const report = await PlagiarismReport.findOne({ contest: contestId });
    if (!report) throw new Error('Report not found');

    const pair = report.suspiciousPairs.find(
      p =>
        (p.submission1?.toString() === submission1Id && p.submission2?.toString() === submission2Id) ||
        (p.submission1?.toString() === submission2Id && p.submission2?.toString() === submission1Id)
    );
    if (!pair) throw new Error('Pair not found in report');

    pair.reviewed    = true;
    pair.reviewedBy  = reviewedBy;
    pair.verdict     = verdict;
    pair.reviewNotes = notes;

    await report.save();
    return report;
  }
}

export default new PlagiarismService();