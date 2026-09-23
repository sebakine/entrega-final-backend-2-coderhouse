import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
  return value;
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toNumber(process.env.PORT, 8080),
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`,

  PERSISTENCE: (process.env.PERSISTENCE || 'MONGO').toUpperCase(),
  MONGO_URL: required('MONGO_URL', 'mongodb://127.0.0.1:27017/ecommerce_backend2'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  COOKIE_NAME: process.env.COOKIE_NAME || 'currentUser',
  COOKIE_SECRET: required('COOKIE_SECRET'),

  RESET_PASSWORD_SECRET: required('RESET_PASSWORD_SECRET'),
  RESET_PASSWORD_EXPIRES_IN: process.env.RESET_PASSWORD_EXPIRES_IN || '1h',

  BCRYPT_SALT_ROUNDS: toNumber(process.env.BCRYPT_SALT_ROUNDS, 10),

  MAIL_SERVICE: process.env.MAIL_SERVICE || 'gmail',
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASS: process.env.MAIL_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Ecommerce Coderhouse <no-reply@ecommerce.local>',

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin1234',
});

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
