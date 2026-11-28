import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const puerto = Number(process.env.SMTP_PORT || 587);

// Si no hay SMTP configurado (desarrollo), los correos se muestran en la consola
const transporte = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined
    })
  : null;

export const urlFrontend = (ruta) =>
  `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}${ruta}`;

const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const plantilla = ({ nombre, parrafo, enlace, boton, nota }) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <div style="background:#111;color:#fff;padding:16px 24px;border-bottom:4px solid #f07d1a">
    <strong style="font-size:20px">ResiITO</strong>
  </div>
  <div style="padding:24px">
    <p>Hola, ${escapar(nombre)}:</p>
    <p>${parrafo}</p>
    <p style="margin:28px 0">
      <a href="${enlace}" style="background:#f07d1a;color:#111;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${boton}</a>
    </p>
    <p style="font-size:13px;color:#555">${nota}</p>
    <p style="font-size:13px;color:#555">Si el botón no funciona, copia este enlace en tu navegador:<br>${enlace}</p>
  </div>
</div>`;

export async function enviarCorreo({ para, asunto, texto, html }) {
  if (!transporte) {
    console.log(`\n──── Correo (SMTP no configurado) ────\nPara: ${para}\nAsunto: ${asunto}\n\n${texto}\n──────────────────────────────────────\n`);
    return;
  }

  await transporte.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
    html
  });
}

export const correoActivacion = ({ nombre, correo, enlace, horas }) =>
  enviarCorreo({
    para: correo,
    asunto: 'Activa tu cuenta de ResiITO',
    texto: `Hola, ${nombre}:\n\nLa coordinación de residencias del Tecnológico de Oaxaca creó tu cuenta en ResiITO. Crea tu contraseña para entrar:\n\n${enlace}\n\nEl enlace vence en ${horas} horas.`,
    html: plantilla({
      nombre,
      parrafo: 'La coordinación de residencias del Tecnológico de Oaxaca creó tu cuenta en ResiITO. Crea tu contraseña para empezar a usarla.',
      enlace,
      boton: 'Crear mi contraseña',
      nota: `El enlace vence en ${horas} horas. Si no esperabas este correo, ignóralo.`
    })
  });

export const correoRestablecimiento = ({ nombre, correo, enlace, horas }) =>
  enviarCorreo({
    para: correo,
    asunto: 'Restablece tu contraseña de ResiITO',
    texto: `Hola, ${nombre}:\n\nLa coordinación solicitó restablecer tu contraseña de ResiITO. Para elegir una nueva, abre:\n\n${enlace}\n\nEl enlace vence en ${horas} horas. Si no lo abres, tu contraseña actual sigue funcionando.`,
    html: plantilla({
      nombre,
      parrafo: 'La coordinación solicitó restablecer tu contraseña de ResiITO. Abre el enlace para elegir una nueva.',
      enlace,
      boton: 'Elegir nueva contraseña',
      nota: `El enlace vence en ${horas} horas. Si no lo abres, tu contraseña actual sigue funcionando.`
    })
  });
