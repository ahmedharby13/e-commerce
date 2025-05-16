import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

export const sendVerificationEmail = async (
  email: string,
  token: string,
  type: 'verify-email' | 'reset-password' = 'verify-email'
): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const link =
      type === 'verify-email'
        ? `${baseUrl}/api/auth/verify-email?token=${token}`
        : `${baseUrl}/api/auth/reset-password?token=${token}`;

    const subject =
      type === 'verify-email'
        ? 'Verify Your Email'
        : 'Reset Your Password';
    const html =
      type === 'verify-email'
        ? `<p>Please verify your email by clicking <a href="${link}">here</a>.</p>`
        : `<p>Reset your password by clicking <a href="${link}">here</a>. This link expires in 1 hour.</p>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });

    logger.info(`Email sent to ${email} for ${type}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${email}: ${error.message}`);
    throw error;
  }
};