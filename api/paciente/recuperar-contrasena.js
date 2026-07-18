// api/paciente/recuperar-contrasena.js
import { recuperarContrasena } from '../../services/pacientePerfilService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await recuperarContrasena(req.body || {});
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/paciente/recuperar-contrasena:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
