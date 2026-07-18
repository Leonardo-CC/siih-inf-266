// lib/emailService.js
// ============================================================
// Servicio de envío de correos electrónicos
// Utiliza Resend o nodemailer según disponibilidad
// ============================================================
import nodemailer from 'nodemailer';

// Configuración desde variables de entorno
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'sistema@hospital.com';

// Crear transporter solo si hay credenciales
let transporter = null;
let emailConfigurado = false;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
  emailConfigurado = true;
  console.log('Servicio de email configurado correctamente');
} else {
  console.warn(' Email no configurado. Las notificaciones por email se simularán.');
}

// Enviar correo electrónico
export async function enviarEmail({ para, asunto, mensaje, html = null }) {
  // Si no está configurado, simular envío
  if (!emailConfigurado) {
    console.log(`[EMAIL SIMULADO] Para: ${para}`);
    console.log(`Asunto: ${asunto}`);
    console.log(`Mensaje: ${mensaje}`);
    return { exito: true, simulado: true, mensaje: 'Email simulado (sin configuración)' };
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: para,
      subject: asunto,
      text: mensaje,
      html: html || `<p>${mensaje.replace(/\n/g, '<br>')}</p>`,
    });

    return { exito: true, info: info.messageId, simulado: false };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { exito: false, error: error.message };
  }
}

// Enviar email con template de bienvenida
export async function enviarEmailBienvenida(email, nombre) {
  const asunto = '¡Bienvenido al Sistema de Salud!';
  const mensaje = `
Hola ${nombre},

¡Te damos la bienvenida al Sistema de Salud!

Tu registro ha sido completado exitosamente. A partir de ahora podrás:
- Solicitar citas médicas
- Consultar tus citas
- Recibir notificaciones importantes

Si tienes alguna duda, no dudes en contactarnos.

Saludos cordiales,
Sistema de Salud
  `;

  return await enviarEmail({
    para: email,
    asunto,
    mensaje,
  });
}

// Enviar email de confirmación de cita
export async function enviarEmailCita(email, nombre, fecha, hora, medico) {
  const asunto = ' Cita médica confirmada';
  const mensaje = `
Hola ${nombre},

Tu cita médica ha sido confirmada:

 Fecha: ${fecha}
 Hora: ${hora}
 Médico: ${medico || 'Asignado'}

Por favor, llega 15 minutos antes de tu hora programada.

Si necesitas cancelar o reprogramar, ingresa al sistema.

Saludos cordiales,
Sistema de Salud
  `;

  return await enviarEmail({
    para: email,
    asunto,
    mensaje,
  });
}

// Enviar email de recordatorio de cita
export async function enviarEmailRecordatorio(email, nombre, fecha, hora, medico) {
  const asunto = 'Recordatorio de cita médica';
  const mensaje = `
Hola ${nombre},

Te recordamos que mañana tienes una cita médica:

Fecha: ${fecha}
Hora: ${hora}
Médico: ${medico || 'Asignado'}

¡No olvides asistir!

Saludos cordiales,
Sistema de Salud
  `;

  return await enviarEmail({
    para: email,
    asunto,
    mensaje,
  });
}