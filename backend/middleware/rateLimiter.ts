import rateLimit from 'express-rate-limit';



// Rate limiter for login endpoints
// Rate limiter for login endpoints
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

// Rate limiter for registration endpoints
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message: { success: false, message: 'Too many registration attempts, please try again later' },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 requests per hour
  message: { success: false, message: 'Too many password reset attempts, please try again later' },
});