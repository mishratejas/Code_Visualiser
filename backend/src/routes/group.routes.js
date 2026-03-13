import express from 'express';
import {
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  joinGroup, leaveGroup, inviteMember, updateMemberRole, removeMember
} from '../controllers/group.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuth, getGroups);
router.get('/:id', optionalAuth, getGroup);

router.post('/', authenticate, createGroup);
router.put('/:id', authenticate, updateGroup);
router.delete('/:id', authenticate, deleteGroup);

router.post('/:id/join', authenticate, joinGroup);
router.post('/:id/leave', authenticate, leaveGroup);
router.post('/:id/invite', authenticate, inviteMember);
router.put('/:id/members/:userId/role', authenticate, updateMemberRole);
router.delete('/:id/members/:userId', authenticate, removeMember);

export default router;