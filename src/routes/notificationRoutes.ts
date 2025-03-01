import { Router } from 'express';
import notificationController from '../controllers/notificationController';

const router = Router();

// Get user notifications
router.get('/:userId', notificationController.getNotifications);

// Get unread notification count
router.get('/:userId/unread/count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/:userId/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/:userId', notificationController.deleteAllNotifications);

export default router;