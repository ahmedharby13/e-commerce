import { body, ValidationChain } from 'express-validator';

export const reviewValidation: ValidationChain[] = [
  body('productId').isMongoId().withMessage('Invalid productId'),
  body('userId').isMongoId().withMessage('Invalid userId'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string'),
];