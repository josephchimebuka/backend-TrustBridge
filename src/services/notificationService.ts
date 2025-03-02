import { PrismaClient, Notification, NotificationType, User } from '@prisma/client';
import EmailNotificationService from './emailService';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create a new notification and optionally send an email
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    sendEmail: boolean = false
  ): Promise<Notification> {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        isRead: false,
      },
    });

    // Send email if requested
    if (sendEmail) {
      try {
        // Get user email and name
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user && user.email) {
          await EmailNotificationService.sendEmail(
            user.email,
            user.name || 'User',
            type,
            message
          );
        }
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    const { unreadOnly = false, limit = 10, offset = 0 } = options || {};

    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Count unread notifications for a user
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<Notification> {
    return prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
      },
    });

    return { count: result.count };
  }

  /**
   * Create a loan update notification
   */
  async createLoanUpdateNotification(userId: string, message: string, sendEmail: boolean = false): Promise<Notification> {
    return this.createNotification(userId, NotificationType.LOAN_UPDATE, message, sendEmail);
  }

  /**
   * Create an escrow update notification
   */
  async createEscrowUpdateNotification(userId: string, message: string, sendEmail: boolean = false): Promise<Notification> {
    return this.createNotification(userId, NotificationType.ESCROW_UPDATE, message, sendEmail);
  }

  /**
   * Create a payment received notification
   */
  async createPaymentReceivedNotification(userId: string, message: string, sendEmail: boolean = false): Promise<Notification> {
    return this.createNotification(userId, NotificationType.PAYMENT_RECEIVED, message, sendEmail);
  }

  /**
   * Create a system alert notification
   */
  async createSystemAlertNotification(userId: string, message: string, sendEmail: boolean = false): Promise<Notification> {
    return this.createNotification(userId, NotificationType.SYSTEM_ALERT, message, sendEmail);
  }
}

export default new NotificationService();