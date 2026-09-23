import nodemailer from 'nodemailer';
import { env, isTest } from '../config/env.config.js';

const hasSmtpCredentials = Boolean(env.MAIL_USER && env.MAIL_PASS);

// Con credenciales se usa SMTP real (Gmail por defecto, con contraseña de aplicación).
// Sin credenciales (desarrollo/test) se usa jsonTransport: el correo no sale, pero se registra en consola.
const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      service: env.MAIL_SERVICE,
      auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });

class MailService {
  constructor(transport) {
    this.transport = transport;
    this.outbox = []; // historial en memoria, útil para desarrollo y tests
  }

  async send({ to, subject, html, text }) {
    const info = await this.transport.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
    if (!hasSmtpCredentials) {
      this.outbox.push({ to, subject, html, text, sentAt: new Date() });
      if (this.outbox.length > 50) this.outbox.shift();
      if (!isTest) {
        console.log(`[mail] (modo desarrollo, sin SMTP) Para: ${to} | Asunto: ${subject}`);
        if (text) console.log(`[mail] ${text}`);
      }
    }
    return info;
  }

  lastMailTo(email) {
    return [...this.outbox].reverse().find((m) => m.to === email) ?? null;
  }
}

export const mailService = new MailService(transporter);
export const isSmtpEnabled = hasSmtpCredentials;
