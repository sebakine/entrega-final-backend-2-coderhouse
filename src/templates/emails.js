const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (title, body) => `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;padding:32px;">
          <tr><td>${body}</td></tr>
          <tr><td style="padding-top:24px;font-size:12px;color:#71717a;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const resetPasswordEmail = ({ firstName, resetUrl }) => ({
  subject: 'Restablece tu contraseña',
  text: `Hola ${firstName}. Para restablecer tu contraseña ingresa a: ${resetUrl} (el enlace expira en 1 hora).`,
  html: layout(
    'Restablece tu contraseña',
    `<h1 style="font-size:22px;margin:0 0 16px;">Hola ${escapeHtml(firstName)},</h1>
     <p style="line-height:1.5;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.
     Haz clic en el botón para crear una nueva contraseña.</p>
     <p style="text-align:center;margin:32px 0;">
       <a href="${resetUrl}"
          style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
         Restablecer contraseña
       </a>
     </p>
     <p style="line-height:1.5;"><strong>El enlace expira en 1 hora</strong> y solo puede usarse una vez.
     La nueva contraseña debe ser distinta a la anterior.</p>
     <p style="line-height:1.5;color:#71717a;">Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.</p>`,
  ),
});

export const passwordChangedEmail = ({ firstName }) => ({
  subject: 'Tu contraseña fue actualizada',
  text: `Hola ${firstName}. Tu contraseña fue actualizada correctamente.`,
  html: layout(
    'Contraseña actualizada',
    `<h1 style="font-size:22px;margin:0 0 16px;">Hola ${escapeHtml(firstName)},</h1>
     <p style="line-height:1.5;">Te confirmamos que la contraseña de tu cuenta fue actualizada correctamente.</p>
     <p style="line-height:1.5;color:#71717a;">Si no fuiste tú, solicita una nueva recuperación de contraseña de inmediato.</p>`,
  ),
});

export const purchaseEmail = ({ firstName, ticket, notProcessed }) => {
  const rows = ticket.products
    .map(
      (p) => `<tr>
        <td style="padding:6px 0;">${escapeHtml(p.title)}</td>
        <td style="padding:6px 0;text-align:center;">${p.quantity}</td>
        <td style="padding:6px 0;text-align:right;">$${p.subtotal.toFixed(2)}</td>
      </tr>`,
    )
    .join('');
  const pending = notProcessed.length
    ? `<p style="line-height:1.5;color:#b45309;">${notProcessed.length} producto(s) no tenían stock suficiente y quedaron en tu carrito.</p>`
    : '';
  return {
    subject: `Confirmación de compra ${ticket.code}`,
    text: `Hola ${firstName}. Tu compra ${ticket.code} por $${ticket.amount.toFixed(2)} fue registrada.`,
    html: layout(
      'Confirmación de compra',
      `<h1 style="font-size:22px;margin:0 0 16px;">¡Gracias por tu compra, ${escapeHtml(firstName)}!</h1>
       <p>Ticket: <strong>${escapeHtml(ticket.code)}</strong></p>
       <table width="100%" style="border-collapse:collapse;font-size:14px;">
         <thead><tr>
           <th align="left">Producto</th><th>Cantidad</th><th align="right">Subtotal</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <p style="text-align:right;font-size:18px;"><strong>Total: $${ticket.amount.toFixed(2)}</strong></p>
       ${pending}`,
    ),
  };
};
