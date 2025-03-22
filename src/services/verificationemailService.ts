const nodemailer = require('nodemailer');
const dbConfig = require('../config/db');

const transporter = nodemailer.createTransport({
  service: dbConfig.EMAIL_SERVICE,
  auth: {
    user: dbConfig.EMAIL_USER,
    pass: dbConfig.EMAIL_PASSWORD
  }
});

// Explicitly define parameter types
const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationLink = `${dbConfig.BASE_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: dbConfig.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html: `
      <h1>Verify Your Email</h1>
      <p>Please click on the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail
};