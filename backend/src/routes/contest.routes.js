import express from 'express';
import { 
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  registerForContest
} from '../controllers/contest.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getContests);
router.get('/:id', getContest);

// Protected routes
router.post('/', authenticate, createContest);
router.put('/:id', authenticate, updateContest);
router.delete('/:id', authenticate, deleteContest);
router.post('/:id/register', authenticate, registerForContest);

export default router;