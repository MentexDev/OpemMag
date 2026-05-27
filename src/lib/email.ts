import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendAmbassadorApproved({
  to,
  ambassadorName,
  tenantName,
  tenantSlug,
}: {
  to: string;
  ambassadorName: string;
  tenantName: string;
  tenantSlug: string;
}) {
  const resend = getResend();
  if (!resend) return; // silently skip if not configured

  const portalUrl = `https://${tenantSlug}.openmag.co/dashboard`;

  await resend.emails.send({
    from: "OpenMag <notificaciones@openmag.co>",
    to,
    subject: `¡Felicidades! Ya eres embajadora de ${tenantName}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">

              <!-- Header -->
              <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#141414 100%);padding:32px 32px 24px;border-bottom:1px solid #2a2a2a;">
                <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">OpenMag</p>
                <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                  ¡Bienvenida al equipo, ${ambassadorName}! 🎉
                </h1>
              </td></tr>

              <!-- Body -->
              <tr><td style="padding:32px;">
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#aaa;">
                  Tu solicitud para unirte al programa de embajadoras de
                  <strong style="color:#fff;">${tenantName}</strong> ha sido
                  <strong style="color:#22c55e;">aprobada</strong>.
                  Ya puedes acceder a tu panel y comenzar a compartir productos.
                </p>

                <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr><td style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:12px;padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Tu portal</p>
                    <p style="margin:0;font-size:14px;font-family:monospace;color:#a78bfa;">${tenantSlug}.openmag.co</p>
                  </td></tr>
                </table>

                <table cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
                  <tr><td style="background:#22c55e;border-radius:100px;">
                    <a href="${portalUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#000;text-decoration:none;letter-spacing:0.3px;">
                      Ir a mi panel →
                    </a>
                  </td></tr>
                </table>

                <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                  Desde tu panel podrás ver tu código de referido, tus ventas, tus comisiones y tu posición en el ranking.
                </p>
              </td></tr>

              <!-- Footer -->
              <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
                <p style="margin:0;font-size:12px;color:#555;text-align:center;">
                  Este correo fue enviado porque tu cuenta fue aprobada en el programa de ${tenantName} en OpenMag.
                </p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendAmbassadorRejected({
  to,
  ambassadorName,
  tenantName,
}: {
  to: string;
  ambassadorName: string;
  tenantName: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: "OpenMag <notificaciones@openmag.co>",
    to,
    subject: `Actualización sobre tu solicitud en ${tenantName}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">

              <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #2a2a2a;">
                <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">OpenMag</p>
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                  Hola, ${ambassadorName}
                </h1>
              </td></tr>

              <tr><td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#aaa;">
                  Lamentablemente, tu solicitud para unirte al programa de embajadoras de
                  <strong style="color:#fff;">${tenantName}</strong> no fue aprobada en este momento.
                </p>
                <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                  Si crees que hubo un error, comunícate directamente con el equipo de ${tenantName}.
                </p>
              </td></tr>

              <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
                <p style="margin:0;font-size:12px;color:#555;text-align:center;">OpenMag · Plataforma de embajadoras</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
