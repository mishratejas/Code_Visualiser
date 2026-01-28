import cron from 'node-cron';
import { Op } from 'sequelize';
import Contest from '../models/postgres/Contest.models.js';
import { emitContestStatus } from '../socket/contestSocket.js';

// Run every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    // Start scheduled contests
    const contestsToStart = await Contest.findAll({
      where: {
        status: 'scheduled',
        start_time: { [Op.lte]: now }
      }
    });

    for (const contest of contestsToStart) {
      await contest.update({ status: 'live' });
      emitContestStatus(contest.id, 'live');
      console.log(`✅ Contest ${contest.id} started`);
    }

    // End live contests
    const contestsToEnd = await Contest.findAll({
      where: {
        status: 'live',
        end_time: { [Op.lte]: now }
      }
    });

    for (const contest of contestsToEnd) {
      await contest.update({ status: 'ended' });
      await finalizeContest(contest.id);
      emitContestStatus(contest.id, 'ended');
      console.log(`✅ Contest ${contest.id} ended`);
    }
  } catch (error) {
    console.error('Contest status update error:', error);
  }
});

async function finalizeContest(contestId) {
  // Calculate final rankings
  const participants = await ContestParticipant.findAll({
    where: { contest_id: contestId },
    order: [
      ['score', 'DESC'],
      ['penalty', 'ASC']
    ]
  });

  // Update final ranks
  for (let i = 0; i < participants.length; i++) {
    await participants[i].update({ final_rank: i + 1 });
  }
}