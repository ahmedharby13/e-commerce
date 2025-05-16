import { Response, NextFunction } from 'express';
import userModel from '../models/userModel';
import { AuthRequest } from './userAuth';
import logger from '../utils/logger';

const verifyEmailMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.authUser) {
      logger.warn(`Email verification check failed: User not found`);
      res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }
    const user = await userModel.findById(req.authUser._id);
    if (!user) {
      logger.warn(`Email verification check failed: User not found for ID ${req.authUser._id}`);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (!user.isVerified) {
      logger.warn(`Email verification check failed: Email not verified for ${user.email}`);
      res.status(403).json({ success: false, message: 'Please verify your email before proceeding' });
      return;
    }
    next();
  } catch (error: any) {
    logger.error(`Email verification middleware error: ${error.message}`);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export default verifyEmailMiddleware;