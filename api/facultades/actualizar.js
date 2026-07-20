// api/facultades/actualizar.js
import { editarFacultad } from '../../services/inscripcionService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }
  try {
    const { id_area, ...datos } = req.body || {};
    const resultado = await editarFacultad(id_area, datos);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/facultades/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}