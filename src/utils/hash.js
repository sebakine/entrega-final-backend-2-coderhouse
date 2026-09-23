import bcrypt from 'bcrypt';
import { env } from '../config/env.config.js';

export const createHash = (plain) => bcrypt.hashSync(plain, env.BCRYPT_SALT_ROUNDS);

export const isValidPassword = (plain, hashed) => {
  if (!plain || !hashed) return false;
  return bcrypt.compareSync(plain, hashed);
};
