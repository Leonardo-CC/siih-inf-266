// api/tecnico-laboratorio/analisis/actualizar.js
import { editarAnalisis } from '../../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_analisis, ...resto } = req.body || {};
    if (!id_analisis) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el ID del análisis.' });
    }
    const resultado = await editarAnalisis(Number(id_analisis), resto);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/analisis/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
