import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel';
import { createAccessToken, createRefreshToken } from './userController';
import logger from '../utils/logger';

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    if (!token) {
      logger.warn(`Email verification failed: Missing token`);
      res.status(400).json({ success: false, message: 'Verification token is required' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token as string, process.env.JWT_SECRET_KEY!) as { email: string };
    } catch (error: any) {
      logger.warn(`Email verification failed: Invalid or expired token`);
      res.status(401).json({ success: false, message: 'Invalid or expired verification token' });
      return;
    }

    const user = await userModel.findOne({ email: decoded.email, verificationToken: token });
    if (!user) {
      logger.warn(`Email verification failed: User not found or token invalid for ${decoded.email}`);
      res.status(404).json({ success: false, message: 'User not found or token invalid' });
      return;
    }

    await userModel.findByIdAndUpdate(user._id, { isVerified: true, verificationToken: null });

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());
    await userModel.findByIdAndUpdate(user._id, { refreshToken });

    logger.info(`Email verified successfully for ${decoded.email}`);
    res.json({
      success: true,
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during email verification' });
  }
};