import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Tries to connect to MongoDB. If it fails (not installed / not running),
 * we resolve to `false` so the app can fall back to an in-memory store and
 * still be fully runnable for local testing.
 */
export async function connectMongo() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    logger.info('[db] Connected to MongoDB:', config.mongoUri);
    return true;
  } catch (err) {
    logger.warn('[db] Could not connect to MongoDB:', err.message);
    logger.warn('[db] Falling back to in-memory store (data resets on restart).');
    logger.warn('[db] To persist data, install & run MongoDB or set MONGO_URI to a running instance.');
    return false;
  }
}
