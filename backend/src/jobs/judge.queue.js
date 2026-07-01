import Queue from 'bull';
import { getBullRedisConnection } from '../config/redis.config.js';

/**
 * M6 fix — the judge previously ran inline with the HTTP request in
 * submitCode() (submission.controller.js): the request handler awaited
 * executeCode() directly, which meant every submission held an Express
 * request open for the full compile+run time, and a burst of submissions
 * (e.g. a contest going live) would try to run that many Docker containers
 * concurrently with no ceiling. `bull` was already a project dependency but
 * was never actually wired up — this queue activates it.
 *
 * Jobs are added by submitCode() and processed by judge.worker.js. The HTTP
 * response for a submission now returns immediately with verdict: "pending";
 * the client polls GET /submissions/:id (already existed) until the worker
 * updates the record.
 */
const judgeQueue = new Queue('judge-submissions', {
  createClient: (type) => {
    // Bull opens up to three roles per queue instance: 'client' (normal
    // commands), 'subscriber' (pub/sub for events), and 'bclient' (blocking
    // commands like BRPOPLPUSH). Each needs its own connection — see
    // redis.config.js for why we can't reuse the app's shared `redis` client.
    return getBullRedisConnection();
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: 200, // keep recent history for debugging without unbounded growth
    removeOnFail: 500,
  },
});

judgeQueue.on('error', (err) => {
  console.error('❌ Judge queue error:', err.message);
});

judgeQueue.on('failed', (job, err) => {
  console.error(`❌ Judge job ${job.id} (submission ${job.data?.submissionId}) failed:`, err.message);
});

export default judgeQueue;