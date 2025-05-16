import express from 'express';
import { placeOrder, placeOrderStripe, allOrders, userOrders, updateOrderStatus, verifyStripe, getOrderSummary } from '../controllers/orderController';
import adminAuth from '../middleware/adminAuth';
import userAuth from '../middleware/userAuth';
import { validate } from '../middleware/validate';
import { placeOrderValidation, verifyStripeValidation, userOrdersValidation, updateStatusValidation, summaryValidation } from '../validations/orderValidation';


const orderRouter = express.Router();


orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatusValidation, validate, updateOrderStatus);
orderRouter.post('/place', userAuth, placeOrderValidation, validate, placeOrder);
orderRouter.post('/stripe', userAuth, placeOrderValidation, validate, placeOrderStripe);
orderRouter.post('/userorders', userAuth, userOrdersValidation, validate, userOrders);
orderRouter.post('/verifyStripe', userAuth, verifyStripeValidation, validate, verifyStripe)
orderRouter.post('/summary', userAuth, summaryValidation, validate, getOrderSummary);

export default orderRouter;