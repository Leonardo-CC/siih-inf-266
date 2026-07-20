// services/telegramService.js

export const enviarAlertaTelegram = async (mensaje) => {
  // El Token lo leemos de las variables de entorno (tu archivo .env o la config de Vercel)
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8788242724:AAH6ra0jrIkbx_U63o3yzwjiwqsx2r0fB6c'; 
  const CHAT_ID = '-1004455362125'; // El ID del grupo de la farmacia

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML' // Para negritas <b> y cursivas <i>
      }),
    });

    const data = await respuesta.json();
    
    if (!data.ok) {
      console.error('Error de Telegram al enviar alerta:', data.description);
    }
  } catch (error) {
    console.error('Falla de conexión con la API de Telegram:', error);
  }
};