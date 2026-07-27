import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  logger.info('MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
