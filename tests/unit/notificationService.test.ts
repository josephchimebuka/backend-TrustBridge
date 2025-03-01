import { PrismaClient, NotificationType } from '@prisma/client';
import { NotificationService } from '../../src/services/notificationService';
import emailNotificationService from '../../src/services/emailService';

// Mock the Prisma client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    NotificationType: {
      LOAN_UPDATE: 'LOAN_UPDATE',
      ESCROW_UPDATE: 'ESCROW_UPDATE',
      PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
      SYSTEM_ALERT: 'SYSTEM_ALERT',
    },
  };
});

// Mock the email service
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();
    prisma = new PrismaClient();
  });

  describe('createNotification', () => {
    it('should create a notification without sending an email', async () => {
      // Setup
      const userId = 'user-123';
      const type = NotificationType.LOAN_UPDATE;
      const message = 'Loan has been updated';
      const mockNotification = { id: 'notification-1', userId, type, message, isRead: false };

      prisma.notification.create.mockResolvedValue(mockNotification);

      // Execute
      const result = await notificationService.createNotification(userId, type, message, false);

      // Verify
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId, type, message, isRead: false },
      });
      expect(emailNotificationService.sendEmail).not.toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should create a notification and send an email', async () => {
      // Setup
      const userId = 'user-123';
      const type = NotificationType.LOAN_UPDATE;
      const message = 'Loan has been updated';
      const mockNotification = { id: 'notification-1', userId, type, message, isRead: false };
      const mockUser = { id: userId, email: 'user@example.com', name: 'Test User' };

      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (emailNotificationService.sendEmail as jest.Mock).mockResolvedValue(true);

      // Execute
      const result = await notificationService.createNotification(userId, type, message, true);

      // Verify
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId, type, message, isRead: false },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { email: true, name: true },
      });
      expect(emailNotificationService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.name,
        type,
        message
      );
      expect(result).toEqual(mockNotification);
    });

    it('should create a notification even if email sending fails', async () => {
      // Setup
      const userId = 'user-123';
      const type = NotificationType.LOAN_UPDATE;
      const message = 'Loan has been updated';
      const mockNotification = { id: 'notification-1', userId, type, message, isRead: false };
      const mockUser = { id: userId, email: 'user@example.com', name: 'Test User' };

      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (emailNotificationService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email error'));

      // Execute
      const result = await notificationService.createNotification(userId, type, message, true);

      // Verify
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId, type, message, isRead: false },
      });
      expect(emailNotificationService.sendEmail).toHaveBeenCalled();
      expect(result).toEqual(mockNotification); // Notification should still be returned
    });
  });

  describe('getUserNotifications', () => {
    it('should get all notifications for a user with default options', async () => {
      // Setup
      const userId = 'user-123';
      const mockNotifications = [
        { id: 'notification-1', userId, type: NotificationType.LOAN_UPDATE, message: 'Test 1', isRead: false },
        { id: 'notification-2', userId, type: NotificationType.SYSTEM_ALERT, message: 'Test 2', isRead: true },
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      // Execute
      const result = await notificationService.getUserNotifications(userId);

      // Verify
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should get unread notifications with custom limit and offset', async () => {
      // Setup
      const userId = 'user-123';
      const options = { unreadOnly: true, limit: 5, offset: 10 };
      const mockNotifications = [
        { id: 'notification-1', userId, type: NotificationType.LOAN_UPDATE, message: 'Test 1', isRead: false },
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      // Execute
      const result = await notificationService.getUserNotifications(userId, options);

      // Verify
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        skip: 10,
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('countUnreadNotifications', () => {
    it('should count unread notifications for a user', async () => {
      // Setup
      const userId = 'user-123';
      prisma.notification.count.mockResolvedValue(5);

      // Execute
      const result = await notificationService.countUnreadNotifications(userId);

      // Verify
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      // Setup
      const notificationId = 'notification-1';
      const mockNotification = { id: notificationId, isRead: true };

      prisma.notification.update.mockResolvedValue(mockNotification);

      // Execute
      const result = await notificationService.markAsRead(notificationId);

      // Verify
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      // Setup
      const userId = 'user-123';
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      // Execute
      const result = await notificationService.markAllAsRead(userId);

      // Verify
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      // Setup
      const notificationId = 'notification-1';
      const mockNotification = { id: notificationId };

      prisma.notification.delete.mockResolvedValue(mockNotification);

      // Execute
      const result = await notificationService.deleteNotification(notificationId);

      // Verify
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for a user', async () => {
      // Setup
      const userId = 'user-123';
      prisma.notification.deleteMany.mockResolvedValue({ count: 5 });

      // Execute
      const result = await notificationService.deleteAllNotifications(userId);

      // Verify
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('Type-specific notification methods', () => {
    it('should create a loan update notification', async () => {
      // Setup
      const userId = 'user-123';
      const message = 'Loan update message';
      const sendEmail = true;

      // Mock the createNotification method
      jest.spyOn(notificationService, 'createNotification').mockResolvedValue({} as any);

      // Execute
      await notificationService.createLoanUpdateNotification(userId, message, sendEmail);

      // Verify
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        userId,
        NotificationType.LOAN_UPDATE,
        message,
        sendEmail
      );
    });

    it('should create an escrow update notification', async () => {
      // Setup
      const userId = 'user-123';
      const message = 'Escrow update message';
      const sendEmail = false;

      // Mock the createNotification method
      jest.spyOn(notificationService, 'createNotification').mockResolvedValue({} as any);

      // Execute
      await notificationService.createEscrowUpdateNotification(userId, message, sendEmail);

      // Verify
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        userId,
        NotificationType.ESCROW_UPDATE,
        message,
        sendEmail
      );
    });

    it('should create a payment received notification', async () => {
      // Setup
      const userId = 'user-123';
      const message = 'Payment received message';

      // Mock the createNotification method
      jest.spyOn(notificationService, 'createNotification').mockResolvedValue({} as any);

      // Execute
      await notificationService.createPaymentReceivedNotification(userId, message);

      // Verify
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        userId,
        NotificationType.PAYMENT_RECEIVED,
        message,
        false
      );
    });

    it('should create a system alert notification', async () => {
      // Setup
      const userId = 'user-123';
      const message = 'System alert message';
      const sendEmail = true;

      // Mock the createNotification method
      jest.spyOn(notificationService, 'createNotification').mockResolvedValue({} as any);

      // Execute
      await notificationService.createSystemAlertNotification(userId, message, sendEmail);

      // Verify
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        userId,
        NotificationType.SYSTEM_ALERT,
        message,
        sendEmail
      );
    });
  });
});