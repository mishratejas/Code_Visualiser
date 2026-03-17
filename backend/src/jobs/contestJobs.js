import cron from 'node-cron';
import { Op } from 'sequelize';
import Contest from '../models/postgres/Contest.models.js';
import ContestParticipant from '../models/postgres/ContestParticipant.models.js';
import { emitContestStatus } from '../socket/contestSocket.js';
import notificationService from '../services/notification.service.js';
import plagiarismService from '../services/plagiarism.service.js';

// Import rating function from contest controller
// We inline it here to avoid circular deps — it's the same logic
import User from '../models/user.models.js';

function expectedScore(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }

function getRatingTier(rating) {
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2100) return 'Master';
  if (rating >= 1900) return 'Candidate Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Specialist';
  if (rating >= 1200) return 'Pupil';
  return 'Newbie';
}

async function applyRatings(contestId) {
  try {
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId, is_disqualified: false },
      order: [['score','DESC'],['penalty','ASC'],['joined_at','ASC']]
    });
    if (participants.length < 2) {
      console.log(`⚠️  Contest ${contestId}: only ${participants.length} participant(s), skipping ratings`);
      return;
    }

    const n = participants.length;

    // Ensure every participant has a valid rating_before — if it was never
    // snapshotted at join time, pull the current MongoDB rating now.
    for (const p of participants) {
      if (!p.rating_before || p.rating_before <= 0) {
        const mongoUser = await User.findById(p.user_id).select('stats.rating').lean();
        await p.update({ rating_before: mongoUser?.stats?.rating || 1500 });
      }
    }

    // Reload so expected-rank math uses correct rating_before values
    const refreshed = await ContestParticipant.findAll({
      where: { contest_id: contestId, is_disqualified: false },
      order: [['score','DESC'],['penalty','ASC'],['joined_at','ASC']]
    });

    const expectedRanks = refreshed.map((p, i) => {
      let expected = 1;
      for (let j = 0; j < n; j++) {
        if (i !== j) expected += expectedScore(refreshed[j].rating_before, p.rating_before);
      }
      return expected;
    });

    // Fetch contest title once for notifications
    const contestRow = await Contest.findByPk(contestId, { attributes: ['title'] });
    const contestTitle = contestRow?.title || `Contest #${contestId}`;

    const K = 32;
    for (let i = 0; i < n; i++) {
      const p = refreshed[i];
      const actualRank = i + 1;
      const expRank = expectedRanks[i];
      const delta = Math.round(K * (expRank - actualRank) / n * 10);
      const ratingBefore = p.rating_before || 1500;
      const newRating = Math.max(100, ratingBefore + delta);
      await p.update({ rating_after: newRating, rating_change: delta, rank: actualRank });

      const updateOp = {
        $inc: {
          'stats.score': delta > 0 ? delta : 0,
          'stats.contestsParticipated': 1,
          ...(actualRank === 1 ? { 'stats.contestsWon': 1 } : {}),
        },
        $set: { 'stats.rating': newRating },
      };

      const user = await User.findById(p.user_id).select('stats.bestContestRank').lean();
      const currentBest = user?.stats?.bestContestRank ?? Infinity;
      if (actualRank < currentBest) {
        updateOp.$set['stats.bestContestRank'] = actualRank;
      }

      await User.findByIdAndUpdate(p.user_id, updateOp);

      // Always notify (delta=0 still useful: confirms rank was as expected)
      notificationService.notifyContest(p.user_id, {
        type: 'rating_updated',
        contestId,
        contestTitle,
        delta,
        newRating,
        rank: actualRank,
        totalParticipants: n,
        tier: getRatingTier(newRating),
      }).catch(() => {});
    }
    console.log(`✅ Ratings applied for contest ${contestId} (${n} participants)`);
  } catch (e) {
    console.error(`Rating computation error for contest ${contestId}:`, e.message);
  }
}

// ─── Notify all participants of a contest ────────────────────────────────────
async function notifyParticipants(contestId, contestTitle, eventType) {
  try {
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId },
      attributes: ['user_id']
    });
    await Promise.allSettled(
      participants.map(p =>
        notificationService.notifyContest(p.user_id, {
          type: eventType,
          contestTitle,
          contestId,
        })
      )
    );
  } catch (err) {
    console.error(`notifyParticipants error (contest ${contestId}):`, err.message);
  }
}

// ─── Main cron: runs every minute ────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    // ── 1. Start scheduled contests ──────────────────────────────────────────
    const toStart = await Contest.findAll({
      where: { status: 'scheduled', start_time: { [Op.lte]: now } }
    });
    for (const contest of toStart) {
      await contest.update({ status: 'live' });
      emitContestStatus(contest.id, 'live');
      console.log(`✅ Contest ${contest.id} started`);
      await notifyParticipants(contest.id, contest.title, 'started');
    }

    // ── 2. End live contests ──────────────────────────────────────────────────
    const toEnd = await Contest.findAll({
      where: { status: 'live', end_time: { [Op.lte]: now } }
    });
    for (const contest of toEnd) {
      await contest.update({ status: 'ended' });
      await finalizeContest(contest.id);
      emitContestStatus(contest.id, 'ended');
      console.log(`✅ Contest ${contest.id} ended`);

      // Apply ratings (only for rated contests)
      if (contest.is_rated) {
        await applyRatings(contest.id);
      }

      await notifyParticipants(contest.id, contest.title, 'ended');

      // Auto-run plagiarism detection (background, non-blocking)
      plagiarismService.autoCheckOnContestEnd(contest.id)
        .catch(err => console.error(`Plagiarism auto-check failed for contest ${contest.id}:`, err.message));
    }

    // ── 3. "Starting soon" (1 hour warning) ──────────────────────────────────
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoMinBuffer   = new Date(now.getTime() + 58 * 60 * 1000); // prevent double-fire
    const startingSoon = await Contest.findAll({
      where: {
        status: 'scheduled',
        start_time: { [Op.between]: [twoMinBuffer, oneHourFromNow] },
        notified_start_soon: { [Op.or]: [null, false] }   // only once
      }
    });
    for (const contest of startingSoon) {
      await contest.update({ notified_start_soon: true }).catch(() => {}); // field may not exist yet — silent
      await notifyParticipants(contest.id, contest.title, 'starting_soon');
      console.log(`⏰ Contest ${contest.id} starting-soon notifications sent`);
    }

  } catch (error) {
    console.error('Contest status update error:', error);
  }
});

// ─── Finalize rankings ────────────────────────────────────────────────────────
async function finalizeContest(contestId) {
  try {
    const participants = await ContestParticipant.findAll({
      where: { contest_id: contestId },
      order: [['score', 'DESC'], ['penalty', 'ASC']]
    });
    for (let i = 0; i < participants.length; i++) {
      await participants[i].update({ rank: i + 1 }).catch(() => {});
    }
  } catch (err) {
    console.error(`finalizeContest error (${contestId}):`, err.message);
  }
}