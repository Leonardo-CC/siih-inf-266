// api/tecnico-laboratorio/analisis/eliminar.js
import { eliminarAnalisis } from '../../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const id_analisis = Number(req.body?.id_analisis);
    if (!id_analisis) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el ID del análisis.' });
    }
    const resultado = await eliminarAnalisis(id_analisis);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/analisis/eliminar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
