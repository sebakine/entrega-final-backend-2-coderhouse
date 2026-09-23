import mongoose from 'mongoose';
import { env } from './env.config.js';

export const connectDB = async (url = env.MONGO_URL) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url);
  console.log(`[db] Conectado a MongoDB (${mongoose.connection.name})`);
  return mongoose.connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
