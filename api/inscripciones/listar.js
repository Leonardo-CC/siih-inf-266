// api/inscripciones/listar.js
import { obtenerInscripciones } from '../../services/inscripcionService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }
  try {
    const resultado = await obtenerInscripciones();
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/inscripciones/listar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}