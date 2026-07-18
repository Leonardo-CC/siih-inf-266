// api/admisiones/registrar.js
import { registrarAdmision } from '../../services/admisionService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await registrarAdmision(req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/admisiones/registrar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
