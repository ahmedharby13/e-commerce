import mongoose from 'mongoose';
import 'dotenv/config';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (error: unknown) {
    logger.error('Error connecting to MongoDB:', { error });
  }
};

export default connectDB;