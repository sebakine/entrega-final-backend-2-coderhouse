import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.config.js';
import passport, { initializePassport } from './config/passport.config.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  initializePassport();
  app.use(passport.initialize());

  app.use(express.static(publicDir));

  // Vista a la que apunta el botón del correo de recuperación.
  app.get('/reset-password', (_req, res) => res.sendFile(path.join(publicDir, 'reset-password.html')));
  app.get('/forgot-password', (_req, res) => res.sendFile(path.join(publicDir, 'forgot-password.html')));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
