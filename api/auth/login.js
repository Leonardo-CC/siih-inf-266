// api/auth/login.js
import { iniciarSesion } from '../../services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await iniciarSesion(req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/auth/login:', err);
    return res.status(500).json({ ok: false, errores: { general: 'Error interno del servidor.' } });
  }
}
