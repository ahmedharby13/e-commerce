import dotenv from "dotenv";
import { Request, Response } from "express";
import { Secret, SignOptions } from "jsonwebtoken";
import userModel, { User } from "../models/userModel";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/tokenBlacklist";
import zxcvbn from "zxcvbn";
import logger from "../utils/logger";
import { cleanBlacklist } from "../middleware/cleanBlacklist";
import { sendVerificationEmail } from "../utils/nodemailer";

dotenv.config();

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthRequest extends Request {
  authUser: any;
  user?: { id: string };
}

export const createAccessToken = (id: string): string => {
  const secret: Secret = process.env.JWT_SECRET_KEY as string;
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
    "12h") as unknown as SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, options);
};

export const createRefreshToken = (id: string): string => {
  const secret: Secret = process.env.JWT_REFRESH_SECRET_KEY as string;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
    "7d") as unknown as SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, options);
};

export const userLogin = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn(`Login attempt failed: Missing email or password`);
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    const user: User | null = await userModel.findOne({ email });
    if (!user) {
      logger.warn(
        `Login attempt failed: User with email ${email} does not exist`
      );
      res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
      return;
    }

    if (!user.isVerified) {
      logger.warn(`Login attempt failed: Email ${email} not verified`);
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
      return;
    }

    // Check if user is Google OAuth-only and has no password
    if (user.googleId && !user.password) {
      logger.warn(`Login attempt failed: User ${email} is Google OAuth-only`);
      res.status(403).json({
        success: false,
        message: "This account uses Google OAuth. Please log in with Google.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      logger.warn(`Login attempt failed: Invalid password for email ${email}`);
      res.status(401).json({ success: false, message: "Invalid password" });
      return;
    }

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());

    await userModel.findByIdAndUpdate(user._id, { refreshToken });

    logger.info(`User ${email} logged in successfully`);
    res.json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

export const registerUser = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input fields
    if (!name || !email || !password || !confirmPassword) {
      logger.warn(`Registration attempt failed: Missing fields`);
      res
        .status(400)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      logger.warn(`Registration attempt failed: Passwords do not match`);
      res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
      return;
    }

    // Check if user already exists
    const exists: User | null = await userModel.findOne({ email });
    if (exists) {
      logger.warn(`Registration attempt failed: Email ${email} already exists`);
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      logger.warn(
        `Registration attempt failed: Invalid email format for ${email}`
      );
      res.status(400).json({ success: false, message: "Invalid email format" });
      return;
    }

    // Validate password strength using zxcvbn
    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 3) {
      logger.warn(`Registration attempt failed: Weak password for ${email}`);
      res.status(400).json({
        success: false,
        message:
          "Password is too weak. It must include uppercase, lowercase, numbers, and special characters.",
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "24h",
    });

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      verificationToken,
    });

    const user = await newUser.save();

    // Send verification email using Nodemailer
    try {
      await sendVerificationEmail(email, verificationToken);
      logger.info(
        `User ${email} registered successfully, verification email sent`
      );
      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
      });
    } catch (emailError: any) {
      logger.error(
        `Failed to send verification email to ${email}: ${emailError.message}`
      );
      // Optionally, delete the user if email sending fails to maintain consistency
      await userModel.findByIdAndDelete(user._id);
      res.status(500).json({
        success: false,
        message:
          "Failed to send verification email. Please try registering again.",
      });
    }
  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

export const adminLogin = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn(`Admin login attempt failed: Missing email or password`);
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    const user: User | null = await userModel.findOne({ email });
    if (!user || user.role !== "admin") {
      logger.warn(
        `Admin login attempt failed: Unauthorized access for ${email}`
      );
      res.status(401).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
      return;
    }

    if (!user.isVerified) {
      logger.warn(`Admin login attempt failed: Email ${email} not verified`);
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      logger.warn(`Admin login attempt failed: Invalid password for ${email}`);
      res.status(401).json({ success: false, message: "Invalid password" });
      return;
    }

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());

    await userModel.findByIdAndUpdate(user._id, { refreshToken });

    logger.info(`Admin ${email} logged in successfully`);
    res.json({
      success: true,
      message: "Admin logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Admin login error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during admin login" });
  }
};

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.authUser || !req.authUser._id) {
      logger.warn(`Profile fetch failed: User ID not found`);
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: User ID not found" });
      return;
    }

    const user = await userModel
      .findById(req.authUser._id)
      .select("-password -refreshToken -verificationToken");
    if (!user) {
      logger.warn(
        `Profile fetch failed: User not found for ID ${req.authUser._id}`
      );
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    logger.info(`Profile fetched successfully for user ${user.email}`);
    res.json({ success: true, user });
  } catch (error: any) {
    logger.error(`Profile fetch error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching profile" });
  }
};

export const logout = async (
  req: Request<{}, {}, { refreshToken?: string }>,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : null;

    const providedRefreshToken = req.body.refreshToken || null;

    let userId: string | null = null;

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.JWT_SECRET_KEY!
        ) as { id: string };
        userId = decoded.id;
      } catch (error) {
      }
    }

    if (!userId && providedRefreshToken) {
      try {
        const decoded = jwt.verify(
          providedRefreshToken,
          process.env.JWT_REFRESH_SECRET_KEY!
        ) as { id: string };
        userId = decoded.id;
      } catch (error) {
        logger.warn(`Logout failed: Invalid refresh token`);
        res
          .status(401)
          .json({ success: false, message: "Invalid refresh token" });
        return;
      }
    }

    if (!userId) {
      logger.warn(`Logout failed: No valid token provided`);
      res.status(401).json({
        success: false,
        message: "Unauthorized: No valid token provided",
      });
      return;
    }

    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn(`Logout failed: User not found for ID ${userId}`);
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await userModel.findByIdAndUpdate(userId, { refreshToken: null });

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { exp?: number } | null;
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 12 * 60 * 60 * 1000);
        await TokenBlacklist.create({ token: accessToken, expiresAt });
      } catch (error: any) {
        if (error.code !== 11000) {
          logger.error(`Blacklist error for access token: ${error.message}`);
        }
      }
    }

    if (providedRefreshToken) {
      try {
        const decoded = jwt.decode(providedRefreshToken) as {
          exp?: number;
        } | null;
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await TokenBlacklist.create({ token: providedRefreshToken, expiresAt });
      } catch (error: any) {
        if (error.code !== 11000) {
          logger.error(`Blacklist error for refresh token: ${error.message}`);
        }
      }
    }

    logger.info(`User ${user.email} logged out successfully`);
    res.json({
      success: true,
      message: "User logged out successfully",
      action: "clear_tokens",
    });
  } catch (error: any) {
    logger.error(`Logout error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during logout" });
  }
};

export const refreshToken = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn(`Token refresh failed: Refresh token required`);
      res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
      return;
    }

    const blacklisted = await TokenBlacklist.findOne({ token: refreshToken });
    if (blacklisted) {
      logger.warn(`Token refresh failed: Token ${refreshToken} is blacklisted`);
      res
        .status(401)
        .json({ success: false, message: "Invalid or revoked refresh token" });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY!
      ) as { id: string };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        logger.warn(`Token refresh failed: Refresh token expired`);
        res
          .status(401)
          .json({ success: false, message: "Refresh token has expired" });
      } else {
        logger.warn(`Token refresh failed: Invalid refresh token`);
        res
          .status(401)
          .json({ success: false, message: "Invalid refresh token" });
      }
      return;
    }

    const user = await userModel.findOne({ _id: decoded.id, refreshToken });
    if (!user) {
      logger.warn(
        `Token refresh failed: Invalid or revoked refresh token for user ID ${decoded.id}`
      );
      res
        .status(401)
        .json({ success: false, message: "Invalid or revoked refresh token" });
      return;
    }

    const accessToken = createAccessToken(user._id.toString());
    const newRefreshToken = createRefreshToken(user._id.toString());

    await userModel.findByIdAndUpdate(user._id, {
      refreshToken: newRefreshToken,
    });

    logger.info(`Token refreshed successfully for user ${user.email}`);
    res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    logger.error(`Token refresh error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during token refresh" });
  }
};

export const setPassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;

    if (!req.authUser) {
      logger.warn("Set password failed: Unauthorized");
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!password || !confirmPassword) {
      logger.warn("Set password failed: Missing fields");
      res.status(400).json({
        success: false,
        message: "Password and confirmPassword are required",
      });
      return;
    }

    if (password !== confirmPassword) {
      logger.warn("Set password failed: Passwords do not match");
      res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
      return;
    }

    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 3) {
      logger.warn("Set password failed: Weak password");
      res.status(400).json({
        success: false,
        message:
          "Password is too weak. It must include uppercase, lowercase, numbers, and special characters.",
      });
      return;
    }

    const user = await userModel.findById(req.authUser._id);
    if (!user) {
      logger.warn("Set password failed: User not found");
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.password && !user.googleId) {
      if (!oldPassword) {
        logger.warn("Set password failed: Old password required");
        res.status(400).json({
          success: false,
          message: "Old password is required to update an existing password",
        });
        return;
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        logger.warn("Set password failed: Invalid old password");
        res
          .status(401)
          .json({ success: false, message: "Invalid old password" });
        return;
      }
    } else if (user.googleId && user.password) {
      if (oldPassword) {
        logger.warn(
          "Set password failed: Old password provided for Google OAuth user"
        );
        res.status(400).json({
          success: false,
          message: "Google OAuth users do not need to provide an old password.",
        });
        return;
      }
    } else if (!user.password) {
      if (oldPassword) {
        logger.warn(
          "Set password failed: Old password provided for user with no password"
        );
        res.status(400).json({
          success: false,
          message:
            "No password exists for this user. Do not provide an old password.",
        });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.findByIdAndUpdate(req.authUser._id, {
      password: hashedPassword,
    });

    logger.info(
      `Password set/updated successfully for user ${req.authUser.email}`
    );
    res.json({ success: true, message: "Password set/updated successfully" });
  } catch (error: any) {
    logger.error(`Set password error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during password set" });
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.warn("Forgot password failed: Email is required");
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      logger.warn(`Forgot password failed: User with email ${email} not found`);
      res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
      return;
    }

    if (user.googleId && !user.password) {
      logger.warn(`Forgot password failed: User ${email} is Google OAuth-only`);
      res.status(403).json({
        success: false,
        message: "This account uses Google OAuth. Please log in with Google.",
      });
      return;
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "1h",
    });

    await userModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
    });

    try {
      await sendVerificationEmail(email, resetToken, "reset-password");
      logger.info(`Password reset email sent to ${email}`);
      res.json({
        success: true,
        message: "Password reset email sent. Please check your inbox.",
      });
    } catch (emailError: any) {
      logger.error(
        `Failed to send password reset email to ${email}: ${emailError.message}`
      );
      res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }
  } catch (error: any) {
    logger.error(`Forgot password error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during password reset" });
  }
};

export const resetPassword = async (
  req: Request<
    {},
    {},
    { token: string; password: string; confirmPassword: string }
  >,
  res: Response
): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      logger.warn("Reset password failed: Missing fields");
      res.status(400).json({
        success: false,
        message: "Token, password, and confirmPassword are required",
      });
      return;
    }

    if (password !== confirmPassword) {
      logger.warn("Reset password failed: Passwords do not match");
      res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
      return;
    }

    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 3) {
      logger.warn("Reset password failed: Weak password");
      res.status(400).json({
        success: false,
        message:
          "Password is too weak. It must include uppercase, lowercase, numbers, and special characters.",
      });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
        email: string;
      };
    } catch (error: any) {
      logger.warn("Reset password failed: Invalid or expired token");
      res
        .status(401)
        .json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    const user = await userModel.findOne({
      email: decoded.email,
      resetPasswordToken: token,
    });
    if (!user) {
      logger.warn(
        `Reset password failed: User not found or token invalid for ${decoded.email}`
      );
      res
        .status(404)
        .json({ success: false, message: "User not found or token invalid" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
    });

    logger.info(`Password reset successfully for ${decoded.email}`);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    logger.error(`Reset password error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during password reset" });
  }
};

export const updatePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!req.authUser) {
      logger.warn("Update password failed: Unauthorized");
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      logger.warn("Update password failed: Missing fields");
      res.status(400).json({
        success: false,
        message:
          "Old password, new password, and confirm password are required",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      logger.warn("Update password failed: Passwords do not match");
      res
        .status(400)
        .json({ success: false, message: "New passwords do not match" });
      return;
    }

    const passwordStrength = zxcvbn(newPassword);
    if (passwordStrength.score < 3) {
      logger.warn("Update password failed: Weak password");
      res.status(400).json({
        success: false,
        message:
          "New password is too weak. It must include uppercase, lowercase, numbers, and special characters.",
      });
      return;
    }

    const user = await userModel.findById(req.authUser._id);
    if (!user) {
      logger.warn("Update password failed: User not found");
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!user.password) {
      logger.warn("Update password failed: No password set for user");
      res.status(400).json({
        success: false,
        message: "No password set. Use set-password to create a password.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn("Update password failed: Invalid old password");
      res.status(401).json({ success: false, message: "Invalid old password" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.findByIdAndUpdate(req.authUser._id, {
      password: hashedPassword,
    });

    logger.info(`Password updated successfully for user ${req.authUser.email}`);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    logger.error(`Update password error: ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Server error during password update" });
  }
};

cleanBlacklist();
