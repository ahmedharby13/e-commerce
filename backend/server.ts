// backend/app.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongoDB';
import connectCloudinary from './config/cloudinary';
import userRouter from './routes/userRoute';
import productRouter from './routes/productRoute';
import cartRouter from './routes/cartRoute';
import orderRouter from './routes/orderRoute';
import googleAuthRoutes from './routes/googleAuth';
import logger from './utils/logger';
import { csrfProtection, generateCsrfToken } from './middleware/csrfProtection';

dotenv.config();

const app: Express = express();
const port: number = parseInt(process.env.PORT || '3000', 10);

connectDB();
connectCloudinary();

const corsOrigins = [
  process.env.FRONTEND_URL_DEV,
  process.env.FRONTEND_URL_PROD,
].filter(Boolean) as string[];

if (corsOrigins.length === 0) {
  throw new Error('No CORS origins defined in environment variables');
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, generateCsrfToken);

// Routes
app.use('/api/auth', userRouter); // No CSRF for auth routes
app.use('/api/user', csrfProtection, userRouter); // CSRF for user routes
app.use('/api/product', productRouter); // No CSRF for product listing
app.use('/api/cart', csrfProtection, cartRouter); // CSRF for cart routes
app.use('/api/order', csrfProtection, orderRouter); // CSRF for order routes
app.use('/api/auth/google', googleAuthRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is working');
});

app.listen(port, () => {
  logger.info(`Listening on PORT: ${port}`);
});