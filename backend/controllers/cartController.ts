import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import userModel, { User } from '../models/userModel';
import productModel from '../models/productModel';
import logger from '../utils/logger';

interface CartItem {
  [size: string]: number;
}

interface CartData {
  [id: string]: CartItem;
}

interface CartRequestBody {
  id: string;
  size: string;
  quantity?: number;
}

interface AuthRequest extends Request {
  user?: { id: string };
}

interface JwtPayload {
  id: string;
}

export const addToCart = async (req: AuthRequest & Request<{}, {}, CartRequestBody>, res: Response): Promise<void> => {
  try {
    const { id, size, quantity = 1 } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.user?.id;
    logger.debug('Processing addToCart', { productId: id, size, quantity, userId, hasAuthHeader: !!authHeader });

    // Process token if provided
    if (authHeader && authHeader.startsWith('Bearer ') && !userId) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
        const user = await userModel.findById(decoded.id);
        if (user) {
          userId = decoded.id;
          req.user = { id: userId };
          logger.debug('Token processed successfully', { userId });
        } else {
          logger.warn('User not found for token', { tokenId: decoded.id });
        }
      } catch (error: any) {
        logger.error('Token verification failed in addToCart', { error: error.message });
        // Continue without userId (use cookies)
      }
    }

    let cartData: CartData = {};

    if (!userId) {
      logger.debug('No userId, using cookies');
      try {
        cartData = req.cookies && req.cookies.cartData ? JSON.parse(req.cookies.cartData) : {};
        logger.debug('Parsed cookie cartData', { cartData });
      } catch (parseError) {
        logger.error('Error parsing cartData cookie in addToCart', { error: parseError });
        cartData = {};
      }
    } else {
      logger.debug('Processing authenticated user', { userId });
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn('Invalid userId', { userId });
        res.status(400).json({ success: false, message: 'Invalid userId' });
        return;
      }
      const userData: User | null = await userModel.findById(userId);
      if (!userData) {
        logger.warn('User not found', { userId });
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      cartData = userData.cartData || {};
      logger.debug('Fetched user cartData', { userId, cartData });
    }

    if (!id || !size || quantity < 1) {
      logger.warn('Invalid inputs', { id, size, quantity });
      res.status(400).json({ success: false, message: 'id, size, and quantity are required and must be valid' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid productId', { productId: id });
      res.status(400).json({ success: false, message: 'Invalid productId' });
      return;
    }

    const product = await productModel.findById(id);
    if (!product) {
      logger.warn('Product not found', { productId: id });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (!product.sizes.includes(size)) {
      logger.warn('Invalid size for product', { productId: id, size, availableSizes: product.sizes });
      res.status(400).json({ success: false, message: `Size ${size} is not available for this product` });
      return;
    }

    if (product.stock < quantity) {
      logger.warn('Insufficient stock', { productId: id, requested: quantity, available: product.stock });
      res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });
      return;
    }

    logger.debug('Updating cartData', { cartData });
    if (cartData[id]) {
      if (cartData[id][size]) {
        const newQuantity = cartData[id][size] + quantity;
        if (product.stock < newQuantity) {
          logger.warn('Insufficient stock after update', { productId: id, requested: newQuantity, available: product.stock });
          res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });
          return;
        }
        cartData[id][size] = newQuantity;
      } else {
        cartData[id][size] = quantity;
      }
    } else {
      cartData[id] = { [size]: quantity };
    }

    if (userId) {
      logger.debug('Saving cart to user', { userId });
      await userModel.findByIdAndUpdate(userId, { cartData });
      logger.info('Cart updated for user', { userId, productId: id, size, quantity });
    } else {
      logger.debug('Saving cart to cookie');
      res.cookie('cartData', JSON.stringify(cartData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Added for CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      logger.info('Cart updated in cookie', { productId: id, size, quantity });
    }

    res.json({ success: true, message: 'Added to cart', cartData });
  } catch (error: any) {
    logger.error('Error in addToCart', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ success: false, message: `Server error while adding to cart: ${error.message}` });
    }
  }
};

export const updateCart = async (req: AuthRequest & Request<{}, {}, CartRequestBody>, res: Response): Promise<void> => {
  try {
    const { id, size, quantity } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.user?.id;
    logger.debug('Processing updateCart', { productId: id, size, quantity, userId, hasAuthHeader: !!authHeader });

    // Process token if provided
    if (authHeader && authHeader.startsWith('Bearer ') && !userId) {
      try {
        const token = authHeader.replace('Bearer ', '');
        if (!process.env.JWT_SECRET_KEY) {
          throw new Error('JWT_SECRET_KEY is not defined');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;
        const user = await userModel.findById(decoded.id);
        if (user) {
          userId = decoded.id;
          req.user = { id: userId };
          logger.debug('Token processed successfully', { userId });
        } else {
          logger.warn('User not found for token', { tokenId: decoded.id });
        }
      } catch (error: any) {
        logger.error('Token verification failed in updateCart', { error: error.message });
        // Continue without userId (use cookies)
      }
    }

    let cartData: CartData = {};

    if (!userId) {
      logger.debug('No userId, using cookies');
      try {
        cartData = req.cookies && req.cookies.cartData ? JSON.parse(req.cookies.cartData) : {};
        logger.debug('Parsed cookie cartData', { cartData });
      } catch (parseError) {
        logger.error('Error parsing cartData cookie in updateCart', { error: parseError });
        cartData = {};
      }
    } else {
      logger.debug('Processing authenticated user', { userId });
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn('Invalid userId', { userId });
        res.status(400).json({ success: false, message: 'Invalid userId' });
        return;
      }
      const userData: User | null = await userModel.findById(userId);
      if (!userData) {
        logger.warn('User not found', { userId });
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      cartData = userData.cartData || {};
      logger.debug('Fetched user cartData', { userId, cartData });
    }

    if (!id || !size || quantity === undefined || quantity < 0) {
      logger.warn('Invalid inputs', { id, size, quantity });
      res.status(400).json({ success: false, message: 'id, size, and quantity are required and must be valid' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid productId', { productId: id });
      res.status(400).json({ success: false, message: 'Invalid productId' });
      return;
    }

    const product = await productModel.findById(id);
    if (!product) {
      logger.warn('Product not found', { productId: id });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (!product.sizes.includes(size)) {
      logger.warn('Invalid size for product', { productId: id, size, availableSizes: product.sizes });
      res.status(400).json({ success: false, message: `Size ${size} is not available for this product` });
      return;
    }

    if (!cartData[id] || !cartData[id][size]) {
      logger.warn('Item not found in cart', { productId: id, size });
      res.status(400).json({ success: false, message: 'Item not found in cart' });
      return;
    }

    logger.debug('Updating cartData', { cartData });
    if (quantity === 0) {
      delete cartData[id][size];
      if (Object.keys(cartData[id]).length === 0) {
        delete cartData[id];
      }
    } else {
      if (product.stock < quantity) {
        logger.warn('Insufficient stock', { productId: id, requested: quantity, available: product.stock });
        res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });
        return;
      }
      cartData[id][size] = quantity;
    }

    if (userId) {
      logger.debug('Saving cart to user', { userId });
      await userModel.findByIdAndUpdate(userId, { cartData });
      logger.info('Cart updated for user', { userId, productId: id, size, quantity });
    } else {
      logger.debug('Saving cart to cookie');
      res.cookie('cartData', JSON.stringify(cartData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      logger.info('Cart updated in cookie', { productId: id, size, quantity });
    }

    res.json({ success: true, message: 'Cart updated', cartData });
  } catch (error: any) {
    logger.error('Error in updateCart', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ success: false, message: `Server error while updating cart: ${error.message}` });
    }
  }
};

export const getUserCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.user?.id;
    logger.debug('Processing getUserCart', { userId, hasAuthHeader: !!authHeader });

    if (authHeader && authHeader.startsWith('Bearer ') && !userId) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
        const user = await userModel.findById(decoded.id);
        if (user) {
          userId = decoded.id;
          req.user = { id: userId };
          logger.debug('Token processed successfully', { userId });
        } else {
          logger.warn('User not found for token', { tokenId: decoded.id });
        }
      } catch (error: any) {
        logger.error('Token verification failed in getUserCart', { error: error.message });
      }
    }

    let cartData: CartData = {};

    if (!userId) {
      logger.debug('No userId, using cookies');
      try {
        cartData = req.cookies && req.cookies.cartData ? JSON.parse(req.cookies.cartData) : {};
        logger.debug('Parsed cookie cartData', { cartData });
      } catch (parseError) {
        logger.error('Error parsing cartData cookie in getUserCart', { error: parseError });
        cartData = {};
      }
    } else {
      logger.debug('Processing authenticated user', { userId });
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn('Invalid userId', { userId });
        res.status(400).json({ success: false, message: 'Invalid userId' });
        return;
      }
      const userData = await userModel.findById(userId);
      if (!userData) {
        logger.warn('User not found', { userId });
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      cartData = userData.cartData || {};
      logger.debug('Fetched user cartData', { userId, cartData });
    }

    const cartItems = [];
    let totalCost = 0;

    const productIds = Object.keys(cartData).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const products = await productModel.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const productId in cartData) {
      const product = productMap.get(productId);
      if (product) {
        const sizes = cartData[productId];
        for (const size in sizes) {
          if (product.sizes.includes(size)) {
            const quantity = sizes[size];
            const itemTotal = product.price * quantity;
            totalCost += itemTotal;
            cartItems.push({
              productId,
              name: product.name,
              price: product.price,
              size,
              quantity,
              itemTotal,
            });
          }
        }
      }
    }

    logger.info('Fetched user cart', { userId, itemCount: cartItems.length, totalCost });
    res.json({ success: true, cartItems, totalCost });
  } catch (error: any) {
    logger.error('Error in getUserCart', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: `Server error while fetching cart: ${error.message}` });
  }
};

export const removeFromCart = async (req: AuthRequest & Request<{}, {}, { id: string; size: string }>, res: Response): Promise<void> => {
  try {
    const { id, size } = req.body;
    const authHeader = req.headers.authorization;
    let userId = req.user?.id;
    logger.debug('Processing removeFromCart', { productId: id, size, userId, hasAuthHeader: !!authHeader });

    if (authHeader && authHeader.startsWith('Bearer ') && !userId) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
        const user = await userModel.findById(decoded.id);
        if (user) {
          userId = decoded.id;
          req.user = { id: userId };
          logger.debug('Token processed successfully', { userId });
        } else {
          logger.warn('User not found for token', { tokenId: decoded.id });
        }
      } catch (error: any) {
        logger.error('Token verification failed in removeFromCart', { error: error.message });
      }
    }

    let cartData: CartData = {};

    if (!userId) {
      logger.debug('No userId, using cookies');
      try {
        cartData = req.cookies && req.cookies.cartData ? JSON.parse(req.cookies.cartData) : {};
        logger.debug('Parsed cookie cartData', { cartData });
      } catch (parseError) {
        logger.error('Error parsing cartData cookie in removeFromCart', { error: parseError });
        cartData = {};
      }
    } else {
      logger.debug('Processing authenticated user', { userId });
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn('Invalid userId', { userId });
        res.status(400).json({ success: false, message: 'Invalid userId' });
        return;
      }
      const userData = await userModel.findById(userId);
      if (!userData) {
        logger.warn('User not found', { userId });
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      cartData = userData.cartData || {};
      logger.debug('Fetched user cartData', { userId, cartData });
    }

    if (!id || !size) {
      logger.warn('Invalid inputs', { id, size });
      res.status(400).json({ success: false, message: 'id and size are required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid productId', { productId: id });
      res.status(400).json({ success: false, message: 'Invalid productId' });
      return;
    }

    const product = await productModel.findById(id);
    if (!product) {
      logger.warn('Product not found', { productId: id });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (!product.sizes.includes(size)) {
      logger.warn('Invalid size for product', { productId: id, size, availableSizes: product.sizes });
      res.status(400).json({ success: false, message: `Size ${size} is not available for this product` });
      return;
    }

    if (!cartData[id]) {
      logger.warn('Product not found in cart', { productId: id });
      res.status(400).json({ success: false, message: 'Product not found in cart' });
      return;
    }

    if (!cartData[id][size]) {
      logger.warn('Item not found in cart', { productId: id, size });
      res.status(400).json({ success: false, message: 'Item not found in cart' });
      return;
    }

    logger.debug('Updating cartData', { cartData });
    delete cartData[id][size];
    if (Object.keys(cartData[id]).length === 0) {
      delete cartData[id];
    }

    if (userId) {
      logger.debug('Saving cart to user', { userId });
      await userModel.findByIdAndUpdate(userId, { cartData });
      logger.info('Item removed from cart for user', { userId, productId: id, size });
    } else {
      logger.debug('Saving cart to cookie');
      res.cookie('cartData', JSON.stringify(cartData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      logger.info('Item removed from cart in cookie', { productId: id, size });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    logger.error('Error in removeFromCart', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ success: false, message: `Server error while removing from cart: ${error.message}` });
    }
  }
};

export const mergeCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.user?.id;
    logger.debug('Processing mergeCart', { userId, hasAuthHeader: !!authHeader });

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
        const user = await userModel.findById(decoded.id);
        if (user) {
          userId = decoded.id;
          req.user = { id: userId };
          logger.debug('Token processed successfully', { userId });
        } else {
          logger.warn('User not found for token', { tokenId: decoded.id });
          res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
          return;
        }
      } catch (error: any) {
        logger.error('Token verification failed in mergeCart', { error: error.message });
        res.status(401).json({ success: false, message: `Unauthorized: Invalid token - ${error.message}` });
        return;
      }
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid userId', { userId });
      res.status(400).json({ success: false, message: 'Invalid userId' });
      return;
    }

    logger.debug('Processing authenticated user', { userId });
    const userData = await userModel.findById(userId);
    if (!userData) {
      logger.warn('User not found', { userId });
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let cartData: CartData = userData.cartData || {};
    logger.debug('Fetched user cartData', { userId, cartData });

    let cookieCart: CartData = {};
    try {
      cookieCart = req.cookies && req.cookies.cartData ? JSON.parse(req.cookies.cartData) : {};
      logger.debug('Parsed cookie cartData', { cookieCart });
    } catch (parseError) {
      logger.error('Error parsing cartData cookie in mergeCart', { error: parseError });
      cookieCart = {};
    }

    for (const productId in cookieCart) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn('Invalid productId in cookie cart', { productId });
        continue;
      }

      const product = await productModel.findById(productId);
      if (!product) {
        logger.warn('Product not found', { productId });
        continue;
      }

      const sizes = cookieCart[productId];
      for (const size in sizes) {
        if (!product.sizes.includes(size)) {
          logger.warn('Invalid size for product', { productId, size, availableSizes: product.sizes });
          continue;
        }

        const quantity = sizes[size];
        if (product.stock < quantity) {
          logger.warn('Insufficient stock for product', { productId, size, requested: quantity, available: product.stock });
          continue;
        }

        if (cartData[productId]) {
          if (cartData[productId][size]) {
            cartData[productId][size] += quantity;
            if (cartData[productId][size] > product.stock) {
              cartData[productId][size] = product.stock;
            }
          } else {
            cartData[productId][size] = quantity;
          }
        } else {
          cartData[productId] = { [size]: quantity };
        }
      }
    }

    logger.debug('Saving merged cart to user', { userId, cartData });
    await userModel.findByIdAndUpdate(userId, { cartData });
    res.clearCookie('cartData');
    logger.info('Cart merged successfully, cookie cleared', { userId });

    res.json({ success: true, message: 'Cart merged successfully' });
  } catch (error: any) {
    logger.error('Error in mergeCart', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: `Server error while merging cart: ${error.message}` });
  }
};