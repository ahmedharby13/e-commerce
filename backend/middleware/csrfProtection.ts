// backend/middleware/csrfProtection.ts
import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// إعداد CSRF middleware
export const csrfProtection = csrf({ cookie: true });

// دالة لجلب CSRF token
export const generateCsrfToken = (req: Request, res: Response) => {
  try {
    const token = req.csrfToken();
    res.json({ success: true, csrfToken: token });
  } catch (error: any) {
    logger.error(`Error generating CSRF token: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to generate CSRF token' });
  }
};