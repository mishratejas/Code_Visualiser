import express from 'express';
import {
  getThreads, getThread, createThread, updateThread, deleteThread,
  voteThread, addComment, updateComment, voteComment, getStats,
} from '../controllers/discuss.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/stats',                              getStats);
router.get('/',                      optionalAuth, getThreads);
router.get('/:id',                   optionalAuth, getThread);

router.post('/',                     authenticate, createThread);
router.put('/:id',                   authenticate, updateThread);
router.delete('/:id',                authenticate, deleteThread);
router.post('/:id/vote',             authenticate, voteThread);
router.post('/:id/comments',         authenticate, addComment);
router.put('/:id/comments/:commentId',        authenticate, updateComment);
router.post('/:id/comments/:commentId/vote',  authenticate, voteComment);

export default router;