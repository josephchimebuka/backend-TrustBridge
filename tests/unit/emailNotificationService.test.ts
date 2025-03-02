import { NotificationType } from '@prisma/client';
import { EmailNotificationService } from '../../src/services/emailService';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}));

describe('EmailNotificationService', () => {
  let emailService: EmailNotificationService;
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_HOST = 'test.example.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_SECURE = 'false';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password123';
    process.env.EMAIL_FROM = 'noreply@example.com';

    emailService = new EmailNotificationService();
    mockTransporter = (nodemailer.createTransport as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_SECURE;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    delete process.env.EMAIL_FROM;
  });

  describe('constructor', () => {
    it('should initialize with correct config from environment variables', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'test.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      });
    });

    it('should use default values when environment variables are missing', () => {
      // Clear environment variables
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_PORT;
      delete process.env.EMAIL_SECURE;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      delete process.env.EMAIL_FROM;

      // Create new instance
      const newService = new EmailNotificationService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      // Setup
      const userEmail = 'user@example.com';
      const userName = 'Test User';
      const type = NotificationType.LOAN_UPDATE;
      const message = 'Your loan has been updated';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      // Execute
      const result = await emailService.sendEmail(userEmail, userName, type, message);

      // Verify
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: userEmail,
        subject: 'Loan Update',
        html: expect.stringContaining(userName),
      });
      expect(mockTransporter.sendMail.mock.calls[0][0].html).toContain(message);
      expect(result).toBe(true);
    });

    it('should handle errors when sending email', async () => {
      // Setup
      const userEmail = 'user@example.com';
      const userName = 'Test User';
      const type = NotificationType.SYSTEM_ALERT;
      const message = 'System alert message';

      mockTransporter.sendMail.mockRejectedValue(new Error('Failed to send email'));

      // Execute
      const result = await emailService.sendEmail(userEmail, userName, type, message);

      // Verify
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle unknown notification types', async () => {
      // Setup
      const userEmail = 'user@example.com';
      const userName = 'Test User';
      const type = 'UNKNOWN_TYPE' as NotificationType;
      const message = 'Test message';

      // Execute
      const result = await emailService.sendEmail(userEmail, userName, type, message);

      // Verify
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is verified', async () => {
      // Setup
      mockTransporter.verify.mockResolvedValue(true);

      // Execute
      const result = await emailService.verifyConnection();

      // Verify
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when connection verification fails', async () => {
      // Setup
      mockTransporter.verify.mockRejectedValue(new Error('Connection error'));

      // Execute
      const result = await emailService.verifyConnection();

      // Verify
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});