import { body } from "express-validator";
import { validate } from "../middleware/validate";

export const registerValidation = [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
      body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
      validate,
    ];
    
    // Validation rules for user/admin login
    export const loginValidation = [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
      body('password').notEmpty().withMessage('Password is required'),
      validate,
    ];
    
    // Validation rules for refresh token
    export const refreshTokenValidation = [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
        .isString()
        .withMessage('Refresh token must be a string'),
      validate,
    ];