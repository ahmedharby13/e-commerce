import express from 'express';
import { addToCart, updateCart, getUserCart, removeFromCart, mergeCart } from '../controllers/cartController';
import userAuth from '../middleware/userAuth';
import { RequestHandler } from 'express';


const cartRouter = express.Router();

const typedGetUserCart: RequestHandler = getUserCart as RequestHandler;
const typedAddToCart: RequestHandler = addToCart as RequestHandler;
const typedUpdateCart: RequestHandler = updateCart as RequestHandler;
const typedRemoveFromCart: RequestHandler = removeFromCart as RequestHandler;
const typedMergeCart: RequestHandler = mergeCart as RequestHandler;

cartRouter.get('/', typedGetUserCart);
cartRouter.post('/add', typedAddToCart);
cartRouter.post('/update', typedUpdateCart);
cartRouter.post('/remove', typedRemoveFromCart);
cartRouter.post('/merge', userAuth, typedMergeCart);



export default cartRouter;