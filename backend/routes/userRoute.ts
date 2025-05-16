import express from 'express';
import { userLogin, registerUser, adminLogin, getUserProfile, logout, refreshToken, forgotPassword, resetPassword, updatePassword, setPassword } from '../controllers/userController';
import { verifyEmail } from '../controllers/verifyEmail';
import userAuth from '../middleware/userAuth';
import adminAuth from '../middleware/adminAuth';
import verifyEmailMiddleware from '../middleware/verifyEmail';
import { loginLimiter, passwordResetLimiter, registerLimiter } from '../middleware/rateLimiter';
import userModel from '../models/userModel';
import { registerValidation, loginValidation, refreshTokenValidation } from '../validations/userValidation';

import { RequestHandler } from 'express';

const userRouter = express.Router();


const typedRegisterUser: RequestHandler = registerUser as RequestHandler;
const typedUserLogin: RequestHandler = userLogin as RequestHandler;
const typedAdminLogin: RequestHandler = userLogin as RequestHandler;
const typedVerifyEmail: RequestHandler = verifyEmail as RequestHandler;
const typedGetUserProfile: RequestHandler = getUserProfile as unknown as RequestHandler;
const typedLogout: RequestHandler = logout as RequestHandler;
const typedRefreshToken: RequestHandler = refreshToken as RequestHandler;
const typedSetPassword: RequestHandler = setPassword as unknown as RequestHandler;
const typedForgotPassword: RequestHandler = forgotPassword as RequestHandler;
const typedResetPassword: RequestHandler = resetPassword as RequestHandler;
const typedUpdatePassword: RequestHandler = updatePassword as unknown as RequestHandler;


userRouter.post('/register', registerLimiter, registerValidation, typedRegisterUser);
userRouter.post('/login', loginLimiter, loginValidation, typedUserLogin);
userRouter.post('/admin', loginLimiter, loginValidation, typedAdminLogin);
userRouter.get('/verify-email', typedVerifyEmail);
userRouter.post('/profile', userAuth, verifyEmailMiddleware, typedGetUserProfile);
userRouter.post('/logout', typedLogout);
userRouter.post('/refresh-token', refreshTokenValidation, typedRefreshToken);
userRouter.post('/set-password', userAuth, verifyEmailMiddleware, typedSetPassword);
userRouter.post('/forgot-password', passwordResetLimiter, typedForgotPassword);
userRouter.post('/reset-password', passwordResetLimiter, typedResetPassword);
userRouter.post('/update-password', passwordResetLimiter, userAuth, verifyEmailMiddleware, typedUpdatePassword);

userRouter.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await userModel.find().select('-password -refreshToken -verificationToken');
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
});

export default userRouter;