import Notification from '../models/notification.models.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all notifications for user
// @route   GET /api/v1/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread, read } = req.query;
  
  const query = { user: req.user._id };
  
  if (unread === 'true') {
    query.read = false;   // Unread tab → only unread
  } else if (read === 'true') {
    query.read = true;    // Read tab → only read
  }
  // else: all tab → no read filter, return everything
  
  const skip = (page - 1) * limit;
  
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.getUnreadCount(req.user._id)
  ]);
  
  // Add timeAgo to each notification
  const notificationsWithTimeAgo = notifications.map(notif => ({
    ...notif,
    timeAgo: getTimeAgo(notif.createdAt)
  }));
  
  res.status(200).json(
    ApiResponse.success({
      notifications: notificationsWithTimeAgo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    }, 'Notifications fetched successfully')
  );
});

// @desc    Get unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id);
  
  res.status(200).json(
    ApiResponse.success({ count }, 'Unread count fetched successfully')
  );
});

// @desc    Mark notification as read
// @route   POST /api/v1/notifications/mark-read/:id
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notification = await Notification.markAsRead(req.user._id, id);
  
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  
  res.status(200).json(
    ApiResponse.success({ notification }, 'Notification marked as read')
  );
});

// @desc    Mark all notifications as read
// @route   POST /api/v1/notifications/mark-all-read
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.user._id);
  
  res.status(200).json(
    ApiResponse.success({}, 'All notifications marked as read')
  );
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: req.user._id
  });
  
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  
  res.status(200).json(
    ApiResponse.success({}, 'Notification deleted successfully')
  );
});

// @desc    Delete all read notifications
// @route   DELETE /api/v1/notifications/clear-read
// @access  Private
export const clearReadNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    user: req.user._id,
    read: true
  });
  
  res.status(200).json(
    ApiResponse.success({ deletedCount: result.deletedCount }, 'Read notifications cleared')
  );
});

// Helper function
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}