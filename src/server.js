import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.config.js';
import { env } from './config/env.config.js';
import { isSmtpEnabled } from './services/mail.service.js';

const start = async () => {
  try {
    await connectDB();
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`[server] Escuchando en ${env.BASE_URL} (modo ${env.NODE_ENV})`);
      if (!isSmtpEnabled) {
        console.log('[mail] Sin credenciales SMTP: los correos se mostrarán en consola.');
      }
    });

    const shutdown = async (signal) => {
      console.log(`[server] ${signal} recibido, cerrando...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[server] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();
