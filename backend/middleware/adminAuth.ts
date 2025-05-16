import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import userModel, { User } from '../models/userModel';
import TokenBlacklist from '../models/tokenBlacklist';
import logger from '../utils/logger';

interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  authUser?: User;
}

const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    logger.info('Checking authorization header', { authHeader });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No token provided in request');
      res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    logger.debug('Extracted token', { token: token.substring(0, 10) + '...' });

    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      logger.warn('Token is blacklisted', { token: token.substring(0, 10) + '...' });
      res.status(401).json({ success: false, message: 'Unauthorized: Token has been revoked' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
      logger.info('Token verified successfully', { userId: decoded.id });
    } catch (error: any) {
      logger.error('Token verification failed', { error: error.message });
      res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      return;
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      logger.warn('User not found for token', { userId: decoded.id });
      res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

    if (user.role !== 'admin') {
      logger.warn('Non-admin user attempted access', { userId: user._id, role: user.role });
      res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
      return;
    }

    logger.info('Admin authentication successful', { userId: user._id });
    req.authUser = user;
    next();
  } catch (error: any) {
    logger.error('Admin authentication error', { error: error.message, stack: error.stack });
    res.status(401).json({ success: false, message: `Unauthorized: Invalid token - ${error.message}` });
  }
};

export default adminAuth;