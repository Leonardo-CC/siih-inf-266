// api/admisiones/opciones.js
import { listarOpcionesAdmision } from '../../services/admisionService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await listarOpcionesAdmision();
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/admisiones/opciones:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
