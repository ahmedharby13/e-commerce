import { Request, Response } from 'express';
import mongoose from 'mongoose';
import orderModel, { Order } from '../models/orderModel';
import userModel from '../models/userModel';
import productModel from '../models/productModel';
import Stripe from 'stripe';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartData {
  [productId: string]: {
    [size: string]: number;
  };
}

const currency = 'egy';
const deliveryCharges = 50;

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

interface OrderRequestBody {
  userId: string;
  items: OrderItem[];
  amount: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface VerifyRequestBody {
  orderId: string;
  success?: string;
  userId: string;
}

export const placeOrder = async (req: Request<{}, {}, OrderRequestBody>, res: Response): Promise<void> => {
  try {
    const { userId, items, amount, address } = req.body;
    logger.debug('Processing placeOrder', { userId, itemCount: items.length, amount });

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid userId provided', { userId });
      res.json({ success: false, message: 'Invalid userId' });
      return;
    }
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn('User not found', { userId });
      res.json({ success: false, message: 'User not found' });
      return;
    }

    // Validate items, stock, and prices
    let calculatedAmount = 0;
    const itemsWithProductIds = await Promise.all(
      items.map(async (item) => {
        const product = await productModel.findOne({ name: item.name });
        if (!product) {
          logger.warn('Product not found', { productName: item.name });
          throw new Error(`Product ${item.name} not found`);
        }
        if (product.stock < item.quantity) {
          logger.warn('Insufficient stock', { productName: item.name, requested: item.quantity, available: product.stock });
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        if (product.price !== item.price) {
          logger.warn('Invalid price', { productName: item.name, provided: item.price, actual: product.price });
          throw new Error(`Invalid price for ${item.name}`);
        }
        if (item.size && !product.sizes.includes(item.size)) {
          logger.warn('Invalid size', { productName: item.name, size: item.size });
          throw new Error(`Invalid size ${item.size} for ${item.name}`);
        }
        calculatedAmount += product.price * item.quantity;
        return {
          productId: product._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        };
      })
    );

    calculatedAmount += deliveryCharges;
    if (calculatedAmount !== amount) {
      logger.warn('Invalid total amount', { calculated: calculatedAmount, provided: amount });
      res.json({ success: false, message: 'Invalid total amount' });
      return;
    }

    const orderData = {
      userId,
      items: itemsWithProductIds,
      totalAmount: amount,
      address,
      paymentMethod: 'COD',
      payment: false,
      date: Date.now(),
      status: 'Order Placed',
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();
    logger.info('Order created successfully', { orderId: newOrder._id, userId });

    // Update stock
    for (const item of itemsWithProductIds) {
      await productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
      logger.debug('Updated product stock', { productId: item.productId, quantity: item.quantity });
    }

    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    logger.debug('Cleared user cart', { userId });

    res.json({ success: true, message: 'Order Placed Successfully' });
  } catch (error: any) {
    logger.error('Error in placeOrder', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};

export const placeOrderStripe = async (req: Request<{}, {}, OrderRequestBody>, res: Response): Promise<void> => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;
    logger.debug('Processing placeOrderStripe', { userId, itemCount: items.length, amount });

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid userId provided', { userId });
      res.json({ success: false, message: 'Invalid userId' });
      return;
    }
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn('User not found', { userId });
      res.json({ success: false, message: 'User not found' });
      return;
    }

    // Validate items, stock, and prices
    let calculatedAmount = 0;
    const itemsWithProductIds = await Promise.all(
      items.map(async (item) => {
        const product = await productModel.findOne({ name: item.name });
        if (!product) {
          logger.warn('Product not found', { productName: item.name });
          throw new Error(`Product ${item.name} not found`);
        }
        if (product.stock < item.quantity) {
          logger.warn('Insufficient stock', { productName: item.name, requested: item.quantity, available: product.stock });
          throw new Error(`Insufficient stock for ${item.name}`);
        }
        if (product.price !== item.price) {
          logger.warn('Invalid price', { productName: item.name, provided: item.price, actual: product.price });
          throw new Error(`Invalid price for ${item.name}`);
        }
        if (item.size && !product.sizes.includes(item.size)) {
          logger.warn('Invalid size', { productName: item.name, size: item.size });
          throw new Error(`Invalid size ${item.size} for ${item.name}`);
        }
        calculatedAmount += product.price * item.quantity;
        return {
          productId: product._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        };
      })
    );

    calculatedAmount += deliveryCharges;
    if (calculatedAmount !== amount) {
      logger.warn('Invalid total amount', { calculated: calculatedAmount, provided: amount });
      res.json({ success: false, message: 'Invalid total amount' });
      return;
    }

    const orderData = {
      userId,
      items: itemsWithProductIds,
      totalAmount: amount,
      address,
      paymentMethod: 'Stripe',
      payment: false,
      date: Date.now(),
      status: 'Order Placed',
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();
    logger.info('Stripe order created', { orderId: newOrder._id, userId });

    const line_items = itemsWithProductIds.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency,
        product_data: { name: 'Delivery Charges' },
        unit_amount: deliveryCharges * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: 'payment',
    });

    logger.info('Stripe checkout session created', { sessionId: session.id, orderId: newOrder._id });
    res.json({ success: true, session_url: session.url });
  } catch (error: any) {
    logger.error('Stripe error in placeOrderStripe', { error: error.message, stack: error.stack });
    res.json({ success: false, message: `Stripe error: ${error.message}` });
  }
};

export const verifyStripe = async (req: Request<{}, {}, VerifyRequestBody>, res: Response): Promise<void> => {
  try {
    const { orderId, success, userId } = req.body;
    logger.debug('Processing verifyStripe', { orderId, success, userId });

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid orderId or userId', { orderId, userId });
      res.json({ success: false, message: 'Invalid orderId or userId' });
      return;
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      logger.warn('Order not found', { orderId });
      res.json({ success: false, message: 'Order not found' });
      return;
    }

    if (success === 'true') {
      for (const item of order.items) {
        await productModel.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } }
        );
        logger.debug('Updated product stock for Stripe payment', { productId: item.productId, quantity: item.quantity });
      }
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      logger.info('Stripe payment verified successfully', { orderId, userId });
      res.json({ success: true, message: 'Payment Successful' });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      logger.info('Stripe payment failed, order deleted', { orderId });
      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (error: any) {
    logger.error('Error in verifyStripe', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};

export const allOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.debug('Fetching all orders');
    const orders: Order[] = await orderModel
      .find({})
      .populate('userId', 'name email')
      .populate('items.productId', 'name');
    logger.info('Fetched all orders', { orderCount: orders.length });
    res.json({ success: true, orders });
  } catch (error: any) {
    logger.error('Error in allOrders', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};

export const userOrders = async (req: Request<{}, {}, { userId: string }>, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    logger.debug('Fetching user orders', { userId });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid userId provided', { userId });
      res.json({ success: false, message: 'Invalid userId' });
      return;
    }
    const orders: Order[] = await orderModel.find({ userId }).populate('items.productId', 'name');
    logger.info('Fetched user orders', { userId, orderCount: orders.length });
    res.json({ success: true, orders });
  } catch (error: any) {
    logger.error('Error in userOrders', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: Request<{}, {}, { orderId: string; status: string }>, res: Response): Promise<void> => {
  try {
    const { orderId, status } = req.body;
    logger.debug('Updating order status', { orderId, status });

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      logger.warn('Invalid orderId provided', { orderId });
      res.json({ success: false, message: 'Invalid orderId' });
      return;
    }
    if (!['Order Placed', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      logger.warn('Invalid status provided', { status });
      res.json({ success: false, message: 'Invalid status' });
      return;
    }
    await orderModel.findByIdAndUpdate(orderId, { status });
    logger.info('Order status updated', { orderId, status });
    res.json({ success: true, message: 'Status Updated Successfully' });
  } catch (error: any) {
    logger.error('Error in updateOrderStatus', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};

export const getOrderSummary = async (req: Request<{}, {}, { userId: string }>, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    logger.debug('Fetching order summary', { userId });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid userId provided', { userId });
      res.json({ success: false, message: 'Invalid userId' });
      return;
    }
    const userData = await userModel.findById(userId);
    if (!userData) {
      logger.warn('User not found', { userId });
      res.json({ success: false, message: 'User not found' });
      return;
    }

    const cartData: CartData = userData.cartData;
    let totalAmount = 0;
    const items: OrderItem[] = [];

    for (const productId in cartData) {
      const product = await productModel.findById(productId);
      if (product) {
        const sizes = cartData[productId];
        for (const size in sizes) {
          if (!product.sizes.includes(size)) {
            logger.warn('Invalid size in cart', { productId, size });
            res.json({ success: false, message: `Invalid size ${size} for ${product.name}` });
            return;
          }
          const quantity = sizes[size];
          if (product.stock < quantity) {
            logger.warn('Insufficient stock in cart', { productName: product.name, requested: quantity, available: product.stock });
            res.json({ success: false, message: `Insufficient stock for ${product.name}` });
            return;
          }
          const itemTotal = product.price * quantity;
          totalAmount += itemTotal;
          items.push({
            name: product.name,
            price: product.price,
            quantity,
            size,
          });
        }
      }
    }

    totalAmount += deliveryCharges;
    logger.info('Order summary generated', { userId, itemCount: items.length, totalAmount });

    res.json({ success: true, items, totalAmount });
  } catch (error: any) {
    logger.error('Error in getOrderSummary', { error: error.message, stack: error.stack });
    res.json({ success: false, message: error.message });
  }
};