// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const prisma = require('../prisma/client');
const emailService = require('../services/emailService');

// Mock the email service
jest.mock('../services/emailService');

describe('Email Verification', () => {
  let testUser;
  
  beforeAll(async () => {
    // Clear test data
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false
      }
    });
  });
  
  afterAll(async () => {
    // Clean up
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });
  
  describe('POST /auth/send-verification-email', () => {
    it('should send verification email', async () => {
      // Mock the sendVerificationEmail function
      emailService.sendVerificationEmail.mockResolvedValue({});
      
      const response = await request(app)
        .post('/auth/send-verification-email')
        .send({ email: testUser.email })
        .expect(200);
      
      expect(response.body.message).toBe('Verification email sent successfully');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      
      // Check if token was created
      const token = await prisma.token.findFirst({
        where: { 
          userId: testUser.id,
          type: 'verification'
        }
      });
      expect(token).toBeTruthy();
    });
    
    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/send-verification-email')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
      
      expect(response.body.message).toBe('User not found');
    });
  });
  
  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Get the token
      const token = await prisma.token.findFirst({
        where: { 
          userId: testUser.id,
          type: 'verification'
        }
      });
      
      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: token.token })
        .expect(200);
      
      expect(response.body.message).toBe('Email verified successfully');
      
      // Check if user's email is verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.isEmailVerified).toBe(true);
      
      // Check if token was deleted
      const deletedToken = await prisma.token.findUnique({
        where: { token: token.token }
      });
      expect(deletedToken).toBeFalsy();
    });
    
    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);
      
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
});