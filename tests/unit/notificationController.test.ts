// src/tests/controllers/notificationController.test.ts

import { Request, Response } from 'express';
import { NotificationController } from '../../src/controllers/notificationController';
import notificationService from '../../src/services/notificationService';

// Mock the notification service
jest.mock('../../src/services/notificationService', () => ({
  getUserNotifications: jest.fn(),
  countUnreadNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  deleteAllNotifications: jest.fn(),
}));

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificationController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getNotifications', () => {
    it('should return notifications with default options', async () => {
      // Setup
      const userId = 'user-123';
      const mockNotifications = [{ id: 'notification-1' }];

      mockRequest = {
        params: { userId },
        query: {},
      };

      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Execute
      await controller.getNotifications(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(userId, {
        unreadOnly: false,
        limit: undefined,
        offset: undefined,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    it('should return notifications with custom options', async () => {
      // Setup
      const userId = 'user-123';
      const mockNotifications = [{ id: 'notification-1' }];

      mockRequest = {
        params: { userId },
        query: {
          unreadOnly: 'true',
          limit: '5',
          offset: '10',
        },
      };

      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Execute
      await controller.getNotifications(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(userId, {
        unreadOnly: true,
        limit: 5,
        offset: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123' },
        query: {},
      };

      const error = new Error('Database error');
      (notificationService.getUserNotifications as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.getNotifications(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to fetch notifications' });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      // Setup
      const userId = 'user-123';

      mockRequest = {
        params: { userId },
      };

      (notificationService.countUnreadNotifications as jest.Mock).mockResolvedValue(5);

      // Execute
      await controller.getUnreadCount(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.countUnreadNotifications).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ count: 5 });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123' },
      };

      const error = new Error('Database error');
      (notificationService.countUnreadNotifications as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.getUnreadCount(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to count unread notifications' });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Setup
      const notificationId = 'notification-123';
      const mockNotification = { id: notificationId, isRead: true };

      mockRequest = {
        params: { userId: 'user-123', notificationId },
      };

      (notificationService.markAsRead as jest.Mock).mockResolvedValue(mockNotification);

      // Execute
      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ notification: mockNotification });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123', notificationId: 'notification-123' },
      };

      const error = new Error('Database error');
      (notificationService.markAsRead as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to mark notification as read' });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      // Setup
      const userId = 'user-123';

      mockRequest = {
        params: { userId },
      };

      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue({ count: 3 });

      // Execute
      await controller.markAllAsRead(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Marked 3 notifications as read' });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123' },
      };

      const error = new Error('Database error');
      (notificationService.markAllAsRead as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.markAllAsRead(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to mark all notifications as read' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      // Setup
      const notificationId = 'notification-123';

      mockRequest = {
        params: { userId: 'user-123', notificationId },
      };

      (notificationService.deleteNotification as jest.Mock).mockResolvedValue({ id: notificationId });

      // Execute
      await controller.deleteNotification(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.deleteNotification).toHaveBeenCalledWith(notificationId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Notification deleted successfully' });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123', notificationId: 'notification-123' },
      };

      const error = new Error('Database error');
      (notificationService.deleteNotification as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.deleteNotification(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete notification' });
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications', async () => {
      // Setup
      const userId = 'user-123';

      mockRequest = {
        params: { userId },
      };

      (notificationService.deleteAllNotifications as jest.Mock).mockResolvedValue({ count: 5 });

      // Execute
      await controller.deleteAllNotifications(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(notificationService.deleteAllNotifications).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Deleted 5 notifications' });
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {
        params: { userId: 'user-123' },
      };

      const error = new Error('Database error');
      (notificationService.deleteAllNotifications as jest.Mock).mockRejectedValue(error);

      // Execute
      await controller.deleteAllNotifications(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete all notifications' });
    });
  });
});