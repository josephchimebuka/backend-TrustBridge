// src/tests/integration/notification.integration.test.ts

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import notificationRoutes from '../../src/routes/notificationRoutes';

const mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.user = { walletAddress: 'test-user-wallet' }; // Simulate a logged-in user
  next();
};

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/notifications', mockAuthMiddleware, notificationRoutes);

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Notification API Integration Tests', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      // Setup
      const mockNotifications = [
        { id: 'notification-1', message: 'Test notification 1' },
        { id: 'notification-2', message: 'Test notification 2' },
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      // Execute & Verify
      const response = await request(app)
        .get('/api/notifications//:userId')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.notifications).toEqual(mockNotifications);
    });
  })

  describe('GET /api/notifications/:userId/unread/count', () => {
    it('should return the count of unread notifications', async () => {
      // Setup
      const mockCount = 5; // Example count of unread notifications
      prisma.notification.count.mockResolvedValue(mockCount);

      // Execute & Verify
      const response = await request(app)
        .get('/api/notifications/test-user-wallet/unread/count')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.count).toEqual(mockCount);
    });
  });

  describe('PATCH /api/notifications/:notificationId/read', () => {
    it('should mark a notification as read', async () => {
      // Setup
      const notificationId = 'notification-1';
      prisma.notification.update.mockResolvedValue({ id: notificationId, read: true });

      // Execute & Verify
      const response = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .expect(200);


      expect(response.body.notification).toEqual({ id: notificationId, read: true });
    });
  });

  describe('PATCH /api/notifications/:userId/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Setup
      const userId = 'test-user-wallet';
      prisma.notification.updateMany.mockResolvedValue({ count: 2 }); // Example count of updated notifications

      // Execute & Verify
      const response = await request(app)
        .patch(`/api/notifications/${userId}/read-all`)
        .expect(200);

      expect(response.body).toEqual({ message: "Marked 2 notifications as read" });
    });
  });

  describe('DELETE /api/notifications/:notificationId', () => {
    it('should delete a notification', async () => {
      // Setup
      const notificationId = 'notification-1';
      prisma.notification.delete.mockResolvedValue({ id: notificationId });

      // Execute & Verify
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .expect(200);

      expect(response.body).toEqual({ message: "Notification deleted successfully" });
    });
  });

  describe('DELETE /api/notifications/:userId', () => {
    it('should delete all notifications for a user', async () => {
      // Setup
      const userId = 'test-user-wallet';
      prisma.notification.deleteMany.mockResolvedValue({ count: 2 }); // Example count of deleted notifications

      // Execute & Verify
      const response = await request(app)
        .delete(`/api/notifications/${userId}`)
        .expect(200);

      expect(response.body).toEqual({ message: "Notification deleted successfully" });
    });
  });
})