import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(isAuthenticated);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

export default router;