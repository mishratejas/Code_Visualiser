import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// POST routes
router.post('/mark-read/:id', markAsRead);
router.post('/mark-all-read', markAllAsRead);

// DELETE routes
router.delete('/clear-read', clearReadNotifications);
router.delete('/:id', deleteNotification);

export default router;