import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import userModel, { User } from '../models/userModel';
import TokenBlacklist from '../models/tokenBlacklist';

interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  authUser?: User;
}

const userAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      res.status(401).json({ success: false, message: 'Unauthorized: Token has been revoked' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
    } catch (error: any) {
      res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      return;
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
      return;
    }

    req.authUser = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: `Unauthorized: Invalid token - ${error.message}` });
  }
};

export default userAuth;