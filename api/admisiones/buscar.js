import { buscarPacientesPorNombre } from '../../repositories/admisionRepository.js';

export default async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  if (!q) return res.status(400).json({ ok: false, mensaje: 'Query `q` requerida.' });

  try {
    const matches = await buscarPacientesPorNombre(q);
    return res.status(200).json({ ok: true, results: matches });
  } catch (err) {
    console.error('Error en /api/admisiones/buscar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
