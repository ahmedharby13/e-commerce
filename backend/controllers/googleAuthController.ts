import { Request, Response } from 'express';
import userModel, { User } from '../models/userModel';
import { createAccessToken, createRefreshToken } from './userController';
import logger from '../utils/logger';

export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());
    await userModel.findByIdAndUpdate(user._id, { refreshToken });
    logger.info(`Google OAuth login successful for ${user.email}`);
    res.redirect(`${process.env.FRONTEND_URL}/success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error: any) {
    logger.error(`Google auth callback error: ${error.message}`);
    res.redirect(`${process.env.FRONTEND_URL}/error`);
  }
};

