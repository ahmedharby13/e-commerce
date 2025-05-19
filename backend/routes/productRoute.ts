import express from 'express';
import { addProduct, addProductReview, listProduct, removeProduct, singleProduct, updateProduct, getCategories, getProductRatings } from '../controllers/productController';
import upload from '../middleware/multer';
import adminAuth from '../middleware/adminAuth';
import userAuth from '../middleware/userAuth';
import rateLimit from 'express-rate-limit';
import { reviewValidation } from '../validations/productValidation';
import { validate } from '../middleware/validate';


const productRouter = express.Router();





const listLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const singleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});

productRouter.post(
  '/add',
  adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  addProduct
);
productRouter.put(
  '/:productId',
  adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  updateProduct
);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.get('/list', listLimiter, listProduct);
productRouter.get('/categories', listLimiter, getCategories);
productRouter.get('/:productId', singleLimiter, singleProduct);
productRouter.get('/:id/ratings', getProductRatings);
productRouter.post('/review', userAuth, reviewValidation, validate, addProductReview);

export default productRouter;