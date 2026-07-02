/**
 * seedEverything.js
 * ─────────────────────────────────────────────────────────────────────────
 * The full-stack seed. Populates BOTH databases with realistic, connected
 * data:
 *
 *   MongoDB:
 *     - Users (30)              - Problems (~54, 24 tags — curated + generated)
 *     - Submissions (many)      - Notifications
 *     - Discuss threads + comments
 *
 *   PostgreSQL (including the newer models that had no seed coverage at all):
 *     - users (sync-cache row per Mongo user, linked via mongo_id)
 *     - contests (draft / upcoming / live / ended, referencing real Mongo
 *       problem _ids in problem_ids)
 *     - contest_participants (many users registered per contest)
 *     - contest_submissions (contest-scoped attempts per participant)
 *     - contest_rating_history (append-only rating deltas for ended,
 *       rated contests — this table previously had ZERO rows anywhere)
 *     - contest_rejudges (demo rows for the rejudge state-machine table)
 *     - groups + group_members
 *
 * WHY THIS EXISTS
 * The previous seed only ever touched MongoDB (20 problems, no Postgres
 * data at all), which is why recommendations felt thin and every
 * contest/group/leaderboard feature backed by Postgres had nothing to
 * show. This script is the "everything" version.
 *
 * USAGE
 *   npm run seed:everything
 *
 * Requires MONGODB_URI and POSTGRES_URI to be set in backend/.env — same
 * as running the app itself. Safe to re-run: it wipes and recreates all
 * seeded tables/collections after an explicit confirmation prompt.
 *
 * Login credentials after seeding:
 *   admin@codeforge.com          / 123456
 *   tejasmishra040907@gmail.com  / Tejas#04
 *   any other seeded email       / Test1234! (default)
 */

import 'dotenv/config';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { fileURLToPath } from 'url';

import Problem from '../src/models/problem.models.js';
import User from '../src/models/user.models.js';
import Submission from '../src/models/submission.models.js';
import Notification from '../src/models/notification.models.js';
import Discuss from '../src/models/discuss.models.js';

import { connectPostgreSQL, disconnectPostgreSQL, sequelize } from '../src/db/postgres/index.js';

import { USERS, PROBLEMS, CODE, LANGUAGES, VERDICTS_BAD } from './seedComplete.js';
import { generateProblemPool, randInt, rand } from './lib/problemGenerators.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeforge';
const PASSWORD = 'Test1234!';

const ask = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (ans) => { rl.close(); resolve(ans.trim().toLowerCase()); });
});

const toSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const daysAgo = (d) => new Date(Date.now() - d * 86400000);
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);

// Extra users on top of seedComplete's 25, to round out to a full 30 and
// give a couple more group/contest participants to work with.
const EXTRA_USERS = [
  { username: 'yara_y', email: 'yara@example.com', bio: 'Loves tree problems', country: 'Egypt', university: 'Cairo University' },
  { username: 'zack_z', email: 'zack@example.com', bio: 'Contest grinder', country: 'Israel', university: 'Technion' },
  { username: 'amara_a', email: 'amara@example.com', bio: 'New to DSA, learning fast', country: 'Nigeria', university: 'University of Lagos' },
  { username: 'ben_b', email: 'ben@example.com', bio: 'Backend + algorithms', country: 'Ireland', university: 'Trinity College Dublin' },
  { username: 'chen_c', email: 'chen@example.com', bio: 'Graph algorithms specialist', country: 'China', university: 'Tsinghua University' },
];

/**
 * Retries a database operation on transient connection errors (ETIMEDOUT,
 * connection reset, server selection timeout, etc.) instead of failing the
 * whole seed on one blip. Covers both Mongoose/MongoDB and Sequelize/Postgres
 * error shapes since this script talks to both. Not triggered for validation
 * errors or anything else that would just fail again identically.
 */
async function withRetry(fn, { retries = 3, delayMs = 3000, backoff = false, label = 'operation', onRetry } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isConnErr = [
        'SequelizeConnectionError', 'SequelizeConnectionRefusedError',
        'SequelizeHostNotFoundError', 'SequelizeConnectionTimedOutError',
        'MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError',
      ].includes(err.name) || /ETIMEDOUT|ECONNRESET|Connection terminated|timeout expired/i.test(err.message || '');
      if (!isConnErr || attempt === retries) throw err;
      const wait = backoff ? delayMs * attempt : delayMs;
      console.log(`   ⚠️  ${label} hit a connection error (attempt ${attempt}/${retries}): ${err.message} — retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      if (onRetry) await onRetry().catch(() => {});
    }
  }
  throw lastErr;
}

async function seed() {
  console.log('\n🌱 CodeForge — FULL Database Seeder (MongoDB + PostgreSQL)');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`\n🔑 Default password for most users: ${PASSWORD}  (admin and a couple of specific accounts have their own — see summary at the end)`);

  const ans = await ask(
    '\n⚠️  This will CLEAR MongoDB (users/problems/submissions/notifications/discuss)\n' +
    '    AND PostgreSQL (contests/participants/submissions/rating-history/rejudges/groups).\n' +
    'Type "yes" to continue: '
  );
  if (ans !== 'yes') { console.log('❌ Aborted.'); process.exit(0); }

  // ── Connect both databases ────────────────────────────────────────────
  await withRetry(
    () => mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 }),
    { label: 'MongoDB connection', retries: 5, delayMs: 5000, backoff: true }
  );
  console.log('✅ MongoDB connected');

  // connectPostgreSQL() catches its own errors and returns null (dev mode),
  // so retry on a null return rather than on a thrown error.
  let pg = null;
  const PG_ATTEMPTS = 6;
  for (let attempt = 1; attempt <= PG_ATTEMPTS && !pg; attempt++) {
    pg = await connectPostgreSQL();
    if (!pg && attempt < PG_ATTEMPTS) {
      const wait = 4000 * attempt;
      console.log(`   ⚠️  PostgreSQL connection failed (attempt ${attempt}/${PG_ATTEMPTS}) — retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  if (!pg) {
    console.error(`❌ Could not connect to PostgreSQL after ${PG_ATTEMPTS} attempts — check POSTGRES_URI in .env and your network. Aborting before touching any data.`);
    process.exit(1);
  }
  console.log('✅ PostgreSQL connected (tables synced)');

  const PgUser = (await import('../src/models/postgres/User.models.js')).default;
  const Contest = (await import('../src/models/postgres/Contest.models.js')).default;
  const ContestParticipant = (await import('../src/models/postgres/ContestParticipant.models.js')).default;
  const ContestSubmission = (await import('../src/models/postgres/ContestSubmission.models.js')).default;
  const ContestRatingHistory = (await import('../src/models/postgres/ContestRatingHistory.models.js')).default;
  const ContestRejudge = (await import('../src/models/postgres/Contestrejudge.models.js')).default;
  const Group = (await import('../src/models/postgres/Group.models.js')).default;
  const GroupMember = (await import('../src/models/postgres/GroupMember.models.js')).default;

  // ── Clear ────────────────────────────────────────────────────────────
  console.log('\n🗑️  Clearing MongoDB...');
  await Promise.all([
    Problem.deleteMany({}), Submission.deleteMany({}), User.deleteMany({}),
    Notification.deleteMany({}), Discuss.deleteMany({}),
  ]);

  console.log('🗑️  Clearing PostgreSQL...');
  // Child tables first (FK order), cascade covers the rest.
  await ContestRatingHistory.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await ContestRejudge.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await ContestSubmission.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await ContestParticipant.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await Contest.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await GroupMember.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await Group.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  await PgUser.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
  console.log('✅ Cleared both databases');

  // ── Password hashes ─────────────────────────────────────────────────
  // Most users share the default PASSWORD, but some (admin, tejas) have an
  // explicit `password` override in their USERS/EXTRA_USERS entry. Hash each
  // unique password once and cache it — using a single shared hash for
  // everyone (the previous bug) silently ignored those per-user overrides.
  const hashCache = new Map();
  const hashFor = (plain) => {
    if (!hashCache.has(plain)) {
      const h = bcrypt.hashSync(plain, 10);
      if (!bcrypt.compareSync(plain, h)) { console.error('❌ Hash verification failed!'); process.exit(1); }
      hashCache.set(plain, h);
    }
    return hashCache.get(plain);
  };

  // ══════════════════════════════════════════════════════════════════════
  // MONGODB
  // ══════════════════════════════════════════════════════════════════════

  // ── Users ────────────────────────────────────────────────────────────
  console.log('\n👥 Creating MongoDB users...');
  const now = new Date();
  const allUserDefs = [...USERS, ...EXTRA_USERS];
  const userDocs = allUserDefs.map((u) => {
    const easy = randInt(0, 25);
    const medium = randInt(0, 20);
    const hard = randInt(0, 10);
    const solved = easy + medium + hard;
    const subs = randInt(solved + 5, solved * 3 + 20);
    return {
      _id: new mongoose.Types.ObjectId(),
      username: u.username,
      email: u.email,
      password: hashFor(u.password || PASSWORD),
      role: u.role || 'user',
      isEmailVerified: true,
      isActive: true,
      isProfileComplete: true,
      profile: {
        name: u.username,
        bio: u.bio || 'Coding enthusiast',
        country: u.country || 'India',
        university: u.university || 'CodeForge University',
      },
      stats: {
        totalSubmissions: subs,
        acceptedSubmissions: solved,
        totalProblemsSolved: solved,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        streak: randInt(0, 45),
        maxStreak: randInt(5, 100),
        rank: randInt(1, 10000),
        score: easy * 10 + medium * 30 + hard * 50,
        rating: randInt(900, 2400),
        contestsParticipated: randInt(0, 12),
        lastActiveDate: new Date(now - randInt(0, 7 * 86400000)),
      },
      preferences: { theme: rand(['dark', 'light', 'auto']), defaultLanguage: rand(LANGUAGES) },
      security: { failedLoginAttempts: 0 },
      bookmarks: [],
      solvedProblems: [],
      attemptedProblems: [],
      createdAt: new Date(now - randInt(0, 180 * 86400000)),
      updatedAt: now,
    };
  });
  await withRetry(
    () => User.collection.insertMany(userDocs),
    { label: 'users bulk insert', retries: 4, delayMs: 4000, backoff: true }
  );
  const adminUser = userDocs.find((u) => u.role === 'admin');
  const regularUsers = userDocs.filter((u) => u.role !== 'admin');
  console.log(`✅ Created ${userDocs.length} users`);

  // ── Problems: curated + generated ───────────────────────────────────
  console.log('\n📚 Creating problems (curated + generated pool)...');
  const generatedProblems = generateProblemPool();
  const allProblemDefs = [...PROBLEMS, ...generatedProblems];
  const createdProblems = [];
  const usedSlugs = new Set();
  for (const p of allProblemDefs) {
    let slug = toSlug(p.title);
    let n = 2;
    while (usedSlugs.has(slug)) { slug = `${toSlug(p.title)}-${n++}`; }
    usedSlugs.add(slug);
    const prob = await withRetry(() => Problem.create({
      title: p.title, slug, description: p.description,
      difficulty: p.difficulty, tags: p.tags,
      inputFormat: p.inputFormat, outputFormat: p.outputFormat,
      sampleInput: p.sampleInput, sampleOutput: p.sampleOutput,
      sampleExplanation: p.sampleExplanation || [],
      testCases: p.testCases, hints: p.hints || [],
      constraints: p.constraints, metadata: p.metadata,
      createdBy: adminUser._id,
    }), { label: `problem "${p.title}"`, retries: 3, delayMs: 3000 });
    createdProblems.push(prob);
  }
  console.log(`✅ Created ${createdProblems.length} problems (${new Set(allProblemDefs.flatMap(p => p.tags)).size} unique tags)`);

  // ── Submissions ──────────────────────────────────────────────────────
  console.log('\n📝 Creating submissions...');
  // Built in memory, written with ONE insertMany instead of ~700 individual
  // create() round trips. insertMany skips the pre('save') hook, so the two
  // fields it computes (codeSize, executedAt) are set manually here.
  const submissionDocs = [];
  for (const user of regularUsers) {
    const n = randInt(5, Math.min(createdProblems.length, 40));
    const shuffled = [...createdProblems].sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const prob = shuffled[i];
      const accepted = Math.random() < 0.65;
      const lang = rand(LANGUAGES);
      const passed = accepted ? prob.testCases.length : randInt(0, prob.testCases.length - 1);
      const code = CODE[lang] || CODE.cpp;
      const createdAt = new Date(now - randInt(0, 90 * 86400000));
      submissionDocs.push({
        user: user._id, problem: prob._id, language: lang,
        code,
        codeSize: Buffer.byteLength(code, 'utf8'),
        executedAt: createdAt,
        verdict: accepted ? 'accepted' : rand(VERDICTS_BAD),
        executionTime: randInt(10, 800), memoryUsed: randInt(4, 128),
        testCasesPassed: passed, totalTestCases: prob.testCases.length,
        isContest: false,
        createdAt,
      });
    }
  }
  await withRetry(
    () => Submission.insertMany(submissionDocs, { ordered: false }),
    { label: 'submissions bulk insert', retries: 4, delayMs: 4000, backoff: true }
  );
  const totalSubs = submissionDocs.length;
  console.log(`✅ Created ${totalSubs} submissions`);

  console.log('\n📊 Updating problem stats from submissions...');
  // Counts computed from the in-memory docs we just inserted (no re-query
  // needed), written back in ONE bulkWrite instead of ~160 round trips.
  const statsByProblem = new Map();
  for (const s of submissionDocs) {
    const key = s.problem.toString();
    const entry = statsByProblem.get(key) || { total: 0, accepted: 0 };
    entry.total += 1;
    if (s.verdict === 'accepted') entry.accepted += 1;
    statsByProblem.set(key, entry);
  }
  const statOps = createdProblems.map((prob) => {
    const { total = 0, accepted = 0 } = statsByProblem.get(prob._id.toString()) || {};
    return {
      updateOne: {
        filter: { _id: prob._id },
        update: {
          $set: {
            'metadata.submissions': total,
            'metadata.acceptedSubmissions': accepted,
            'metadata.acceptanceRate': total > 0 ? Math.round((accepted / total) * 100) : 0,
          },
        },
      },
    };
  });
  await withRetry(
    () => Problem.bulkWrite(statOps, { ordered: false }),
    { label: 'problem stats bulk update', retries: 4, delayMs: 4000, backoff: true }
  );
  console.log('✅ Stats updated');

  // ── Notifications ────────────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...');
  const notifs = [
    { type: 'system', title: 'Welcome to CodeForge! 🎉', message: 'Start solving problems to build your coding streak.' },
    { type: 'achievement', title: 'First Problem Solved!', message: 'You solved your first problem. Keep going! 💪' },
    { type: 'system', title: 'New Contest Available', message: 'A new contest has been published. Register now!' },
    { type: 'system', title: 'Daily Streak Reminder 🔥', message: 'Keep your streak alive — solve a problem today.' },
    { type: 'achievement', title: '5-Day Streak!', message: "You've maintained a 5-day coding streak!" },
  ];
  const notifDocs = [];
  for (const user of regularUsers.slice(0, 18)) {
    for (let i = 0; i < randInt(1, 4); i++) {
      const t = notifs[i % notifs.length];
      notifDocs.push({ user: user._id, type: t.type, title: t.title, message: t.message, isRead: Math.random() > 0.5 });
    }
  }
  await withRetry(
    () => Notification.insertMany(notifDocs, { ordered: false }),
    { label: 'notifications bulk insert', retries: 3, delayMs: 3000 }
  );
  const notifCount = notifDocs.length;
  console.log(`✅ Created ${notifCount} notifications`);

  // ── Discuss threads ──────────────────────────────────────────────────
  console.log('\n💬 Creating discuss threads...');
  const discussTopics = [
    { title: 'Best approach for sliding window problems?', category: 'help', tags: ['sliding-window', 'array'] },
    { title: "My solution to Kadane's algorithm — feedback welcome", category: 'editorial', tags: ['dynamic-programming'] },
    { title: 'Struggling with bitmask DP, any resources?', category: 'help', tags: ['bitmask-dp'] },
    { title: 'Weekly contest discussion thread', category: 'general', tags: ['contest'] },
    { title: 'Tips for tree/graph interview questions', category: 'discussion', tags: ['tree', 'graph'] },
    { title: 'Trie implementation — recursive vs iterative?', category: 'help', tags: ['trie'] },
  ];
  let discussCount = 0;
  for (const topic of discussTopics) {
    const author = rand(regularUsers);
    const body = `Looking for input on "${topic.title.toLowerCase()}" — sharing my thinking so far and open to better approaches.`;
    const comments = [];
    const numComments = randInt(0, 4);
    for (let i = 0; i < numComments; i++) {
      comments.push({
        author: rand(regularUsers)._id,
        body: rand([
          'Have you tried breaking it down with a smaller example first?',
          'This helped me a lot — thanks for sharing!',
          'I ran into the same issue, following this thread.',
          'Consider the time complexity here — there might be a faster approach.',
        ]),
        createdAt: daysAgo(randInt(0, 10)),
      });
    }
    await withRetry(() => Discuss.create({
      title: topic.title,
      body,
      author: author._id,
      category: topic.category,
      tags: topic.tags,
      comments,
      createdAt: daysAgo(randInt(0, 30)),
    }), { label: `discuss thread`, retries: 3, delayMs: 3000 });
    discussCount++;
  }
  console.log(`✅ Created ${discussCount} discuss threads`);

  // ══════════════════════════════════════════════════════════════════════
  // POSTGRESQL
  // ══════════════════════════════════════════════════════════════════════
  // The MongoDB phase above can take a minute or more (hundreds of
  // sequential .create() calls) — long enough for a pooled/idle Postgres
  // connection (Neon in particular) to go stale. Re-verify before writing.
  console.log('\n🔄 Re-verifying PostgreSQL connection before writes...');
  await withRetry(() => sequelize.authenticate(), { label: 'PostgreSQL re-connect', retries: 6, delayMs: 4000, backoff: true });
  console.log('✅ PostgreSQL connection confirmed');

  // ── users (sync-cache table, linked to Mongo via mongo_id) ──────────
  console.log('\n👥 Syncing users into PostgreSQL...');
  const pgUserRows = userDocs.map((u) => ({
    username: u.username,
    mongo_id: u._id.toString(),
    name: u.profile.name,
    country_code: (u.profile.country || 'IN').slice(0, 2).toUpperCase(),
    score: u.stats.score,
    total_problems_solved: u.stats.totalProblemsSolved,
    easy_solved: u.stats.easySolved,
    medium_solved: u.stats.mediumSolved,
    hard_solved: u.stats.hardSolved,
    streak: u.stats.streak,
    rank: u.stats.rank,
    is_active: true,
    is_email_verified: true,
    is_profile_complete: true,
  }));
  const pgUsers = await withRetry(
    () => PgUser.bulkCreate(pgUserRows, { returning: true }),
    { label: 'syncing users into Postgres', onRetry: () => sequelize.authenticate() }
  );
  console.log(`✅ Synced ${pgUsers.length} users into Postgres`);

  // Map Mongo user _id string -> Postgres row, for convenience below
  const mongoIdToUser = new Map(userDocs.map((u) => [u._id.toString(), u]));

  // ── Contests ──────────────────────────────────────────────────────────
  console.log('\n🏆 Creating contests...');
  const contestProblemPool = createdProblems.map((p) => p._id.toString());
  const pickProblems = (n) => [...contestProblemPool].sort(() => Math.random() - 0.5).slice(0, n);

  const contestDefs = [
    {
      title: 'CodeForge Weekly #1', contest_type: 'weekly', status: 'ended',
      start_time: daysAgo(21), end_time: daysAgo(21 - 0.1), difficulty: 'mixed',
    },
    {
      title: 'CodeForge Weekly #2', contest_type: 'weekly', status: 'ended',
      start_time: daysAgo(14), end_time: daysAgo(14 - 0.1), difficulty: 'mixed',
    },
    {
      title: 'Beginner Sprint — Arrays & Strings', contest_type: 'practice', status: 'ended',
      start_time: daysAgo(7), end_time: daysAgo(7 - 0.05), difficulty: 'easy', is_rated: false,
    },
    {
      title: 'CodeForge Live Contest', contest_type: 'rated', status: 'live',
      start_time: daysAgo(0.02), end_time: daysFromNow(0.08), difficulty: 'mixed',
    },
    {
      title: 'Monthly Championship — March', contest_type: 'monthly', status: 'upcoming',
      start_time: daysFromNow(5), end_time: daysFromNow(5.1), difficulty: 'hard',
    },
    {
      title: 'Educational Round: DP Special', contest_type: 'educational', status: 'upcoming',
      start_time: daysFromNow(12), end_time: daysFromNow(12.15), difficulty: 'medium',
    },
  ];

  const createdContests = [];
  for (const c of contestDefs) {
    const problemIds = pickProblems(randInt(4, 6));
    const contest = await withRetry(() => Contest.create({
      title: c.title,
      slug: toSlug(c.title),
      description: `${c.title} — solve as many problems as you can within the time limit.`,
      contest_type: c.contest_type,
      difficulty: c.difficulty,
      status: c.status,
      start_time: c.start_time,
      end_time: c.end_time,
      registration_open: c.status !== 'ended',
      is_rated: c.is_rated !== false,
      scoring_type: 'icpc',
      problem_ids: problemIds,
      points_per_problem: Object.fromEntries(problemIds.map((id, i) => [id, (i + 1) * 100])),
      created_by: adminUser._id.toString(),
      tags: [c.difficulty, c.contest_type],
    }), { label: `contest "${c.title}"`, retries: 3, delayMs: 3000, onRetry: () => sequelize.authenticate() });
    createdContests.push(contest);
  }
  console.log(`✅ Created ${createdContests.length} contests (${contestDefs.filter(c => c.status === 'ended').length} ended, 1 live, ${contestDefs.filter(c => c.status === 'upcoming').length} upcoming)`);

  // ── Contest participants + contest submissions + rating history ─────
  // All rows are generated in memory first, then written in 3 batched
  // bulkCreate calls (wrapped in retry). Previously this was ~600 individual
  // .create() round trips — every one a chance to fail on a flaky network.
  console.log('\n🙋 Generating participants and contest submissions...');
  const participantRows = [];
  const submissionRows = [];
  const ratingRows = [];

  for (const contest of createdContests) {
    const isEnded = contest.status === 'ended';
    const isLive = contest.status === 'live';
    if (contest.status === 'upcoming') {
      // Upcoming contests get registrations only, no submissions/results yet.
      const registrants = [...regularUsers].sort(() => Math.random() - 0.5).slice(0, randInt(8, 15));
      for (const user of registrants) {
        participantRows.push({
          contest_id: contest.id, user_id: user._id.toString(),
          rating_before: user.stats.rating,
        });
      }
      continue;
    }

    const participantCount = randInt(10, 18);
    const participants = [...regularUsers].sort(() => Math.random() - 0.5).slice(0, participantCount);
    const problemIds = contest.problem_ids;

    const results = [];
    for (const user of participants) {
      let score = 0, solved = 0, totalTime = 0, penaltyTime = 0;
      const problemStats = {};

      for (const problemId of problemIds) {
        const willAttempt = isLive ? Math.random() < 0.5 : Math.random() < 0.85;
        if (!willAttempt) continue;
        const attempts = randInt(1, 3);
        const willSolve = isLive ? Math.random() < 0.4 : Math.random() < 0.6;

        for (let a = 0; a < attempts; a++) {
          const isLastAttempt = a === attempts - 1;
          const accepted = willSolve && isLastAttempt;
          const lang = rand(LANGUAGES);
          const timeFromStart = randInt(2, 90);

          submissionRows.push({
            contest_id: contest.id,
            user_id: user._id.toString(),
            problem_id: problemId,
            submission_id: new mongoose.Types.ObjectId().toString(),
            language: lang,
            status: accepted ? 'accepted' : rand(VERDICTS_BAD),
            score: accepted ? 100 : 0,
            time_taken: randInt(50, 2000),
            time_from_start: timeFromStart,
            memory_used: randInt(4000, 128000),
            test_cases_passed: accepted ? 10 : randInt(0, 9),
            total_test_cases: 10,
            submitted_at: new Date(contest.start_time.getTime() + timeFromStart * 60000),
            is_best_submission: accepted,
          });

          if (accepted) {
            solved++;
            score += 100;
            totalTime += timeFromStart;
            penaltyTime += (a) * 10; // 10-min penalty per wrong attempt before AC
            problemStats[problemId] = { attempts: a + 1, solved: true, solve_time: timeFromStart, penalty: a * 10 };
            break;
          } else if (isLastAttempt) {
            problemStats[problemId] = { attempts, solved: false, solve_time: null, penalty: 0 };
          }
        }
      }

      const ratingBefore = user.stats.rating;
      const ratingChange = isEnded && contest.is_rated ? randInt(-60, 90) : 0;
      const ratingAfter = ratingBefore + ratingChange;

      results.push({ user, score, solved, totalTime, penaltyTime, problemStats, ratingBefore, ratingAfter, ratingChange });
    }

    // Rank by score desc, then time asc (standard ICPC-style ordering)
    results.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      participantRows.push({
        contest_id: contest.id,
        user_id: r.user._id.toString(),
        score: r.score,
        problems_solved: r.solved,
        total_time: r.totalTime,
        penalty_time: r.penaltyTime,
        penalty: r.penaltyTime,
        problem_stats: r.problemStats,
        rating_before: r.ratingBefore,
        rating_after: isEnded ? r.ratingAfter : null,
        rating_change: isEnded ? r.ratingChange : 0,
        rank: i + 1,
        joined_at: new Date(contest.start_time.getTime() - randInt(60, 600) * 1000),
        last_submission_at: new Date(contest.start_time.getTime() + randInt(5, 100) * 60000),
      });

      if (isEnded && contest.is_rated) {
        ratingRows.push({
          contest_id: contest.id,
          user_id: r.user._id.toString(),
          rating_before: r.ratingBefore,
          rating_after: r.ratingAfter,
          rank: i + 1,
          delta: r.ratingChange,
          computed_at: contest.end_time,
        });
      }
    }
  }

  // Batched writes — 3 round trips instead of ~600
  console.log(`   Writing ${participantRows.length} participants, ${submissionRows.length} submissions, ${ratingRows.length} rating rows in 3 batches...`);
  await withRetry(
    () => ContestParticipant.bulkCreate(participantRows),
    { label: 'contest participants bulk insert', retries: 4, delayMs: 4000, backoff: true, onRetry: () => sequelize.authenticate() }
  );
  await withRetry(
    () => ContestSubmission.bulkCreate(submissionRows),
    { label: 'contest submissions bulk insert', retries: 4, delayMs: 4000, backoff: true, onRetry: () => sequelize.authenticate() }
  );
  await withRetry(
    () => ContestRatingHistory.bulkCreate(ratingRows),
    { label: 'rating history bulk insert', retries: 4, delayMs: 4000, backoff: true, onRetry: () => sequelize.authenticate() }
  );
  const totalParticipants = participantRows.length;
  const totalContestSubs = submissionRows.length;
  const totalRatingRows = ratingRows.length;
  console.log(`✅ Created ${totalParticipants} contest participants`);
  console.log(`✅ Created ${totalContestSubs} contest submissions`);
  console.log(`✅ Created ${totalRatingRows} rating history rows`);

  // ── Contest rejudges (demo rows for the state-machine table) ────────
  console.log('\n🔁 Creating demo rejudge records...');
  const endedContests = createdContests.filter((c) => c.status === 'ended');
  let rejudgeCount = 0;
  if (endedContests.length > 0) {
    const target = endedContests[0];
    const subCount = await ContestSubmission.count({ where: { contest_id: target.id } });
    await withRetry(() => ContestRejudge.create({
      contest_id: target.id,
      triggered_by: adminUser._id.toString(),
      reason: 'Fixed a bad test case on one of the contest problems',
      status: 'completed',
      total_submissions: subCount,
      completed_submissions: subCount,
      failed_submissions: 0,
      started_at: daysAgo(6),
      completed_at: daysAgo(6),
    }), { label: 'rejudge record (completed)', retries: 3, delayMs: 3000, onRetry: () => sequelize.authenticate() });
    rejudgeCount++;
  }
  if (endedContests.length > 1) {
    const target = endedContests[1];
    const subCount = await ContestSubmission.count({ where: { contest_id: target.id } });
    await withRetry(() => ContestRejudge.create({
      contest_id: target.id,
      triggered_by: adminUser._id.toString(),
      reason: 'Verifying judge consistency after a worker deploy',
      status: 'pending',
      total_submissions: subCount,
      completed_submissions: 0,
      failed_submissions: 0,
    }), { label: 'rejudge record (pending)', retries: 3, delayMs: 3000, onRetry: () => sequelize.authenticate() });
    rejudgeCount++;
  }
  console.log(`✅ Created ${rejudgeCount} rejudge records`);

  // ── Groups + group members ───────────────────────────────────────────
  console.log('\n👨‍👩‍👧‍👦 Creating groups...');
  const groupDefs = [
    { name: 'IIT Delhi Coders', type: 'organization', tags: ['university', 'india'], description: 'Official coding group for IIT Delhi students.' },
    { name: 'DP Study Group', type: 'club', tags: ['dynamic-programming', 'study'], description: 'Weekly dynamic programming problem sessions.' },
    { name: 'ICPC Prep Squad', type: 'team', tags: ['icpc', 'competitive'], description: 'Training together for ICPC regionals.' },
    { name: 'Beginners Welcome', type: 'group', tags: ['beginner-friendly'], description: 'A friendly space for people just starting out with DSA.' },
  ];
  let groupMemberCount = 0;
  const memberRows = [];
  for (const g of groupDefs) {
    const owner = rand(regularUsers);
    const group = await withRetry(() => Group.create({
      name: g.name,
      slug: toSlug(g.name),
      description: g.description,
      visibility: 'public',
      type: g.type,
      owner_id: owner._id.toString(),
      tags: g.tags,
      is_active: true,
    }), { label: `group "${g.name}"`, retries: 3, delayMs: 3000, onRetry: () => sequelize.authenticate() });

    memberRows.push({ group_id: group.id, user_id: owner._id.toString(), role: 'owner', status: 'active' });

    const members = [...regularUsers].filter((u) => u._id.toString() !== owner._id.toString())
      .sort(() => Math.random() - 0.5).slice(0, randInt(4, 9));
    for (const m of members) {
      memberRows.push({
        group_id: group.id, user_id: m._id.toString(),
        role: Math.random() < 0.15 ? 'moderator' : 'member',
        status: 'active',
      });
    }
    await withRetry(
      () => group.update({ member_count: members.length + 1 }),
      { label: `member count for "${g.name}"`, retries: 3, delayMs: 3000, onRetry: () => sequelize.authenticate() }
    );
  }
  await withRetry(
    () => GroupMember.bulkCreate(memberRows),
    { label: 'group members bulk insert', retries: 4, delayMs: 4000, backoff: true, onRetry: () => sequelize.authenticate() }
  );
  groupMemberCount = memberRows.length;
  console.log(`✅ Created ${groupDefs.length} groups with ${groupMemberCount} memberships`);

  // ── Done ─────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🎉 Full seed complete!');
  console.log('\n  MongoDB:');
  console.log(`    👥 Users:                ${userDocs.length}`);
  console.log(`    📚 Problems:             ${createdProblems.length}`);
  console.log(`    📝 Submissions:          ${totalSubs}`);
  console.log(`    🔔 Notifications:        ${notifCount}`);
  console.log(`    💬 Discuss threads:      ${discussCount}`);
  console.log('\n  PostgreSQL:');
  console.log(`    👥 Synced users:         ${pgUsers.length}`);
  console.log(`    🏆 Contests:             ${createdContests.length}`);
  console.log(`    🙋 Contest participants: ${totalParticipants}`);
  console.log(`    📝 Contest submissions:  ${totalContestSubs}`);
  console.log(`    📈 Rating history rows:  ${totalRatingRows}`);
  console.log(`    🔁 Rejudge records:      ${rejudgeCount}`);
  console.log(`    👨‍👩‍👧‍👦 Groups:                ${groupDefs.length} (${groupMemberCount} memberships)`);
  console.log('\n🔑 Login with:');
  console.log(`   admin@codeforge.com          /  123456`);
  console.log(`   tejasmishra040907@gmail.com  /  Tejas#04`);
  console.log(`   alice@example.com            /  ${PASSWORD}   (default for everyone else)`);
  console.log('════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  await disconnectPostgreSQL();
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err.message || err);
    console.error(err.stack);
    process.exit(1);
  });
}

export default seed;