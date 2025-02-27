import { Request, Response } from 'express';
import notificationService from '../services/notificationService';

export class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { unreadOnly, limit, offset } = req.query;

      const notifications = await notificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json({ notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }

  /**
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const count = await notificationService.countUnreadNotifications(userId);

      res.status(200).json({ count });
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      res.status(500).json({ message: 'Failed to count unread notifications' });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(notificationId);

      res.status(200).json({ notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  }

  /**
   * Mark all notifications as read for the authenticated user
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({ message: `Marked ${result.count} notifications as read` });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      await notificationService.deleteNotification(notificationId);

      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  }

  /**
   * Delete all notifications for the authenticated user
   */
  async deleteAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const result = await notificationService.deleteAllNotifications(userId);

      res.status(200).json({ message: `Deleted ${result.count} notifications` });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      res.status(500).json({ message: 'Failed to delete all notifications' });
    }
  }
}

export default new NotificationController();
