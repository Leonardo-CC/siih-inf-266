// api/signos-vitales/listar.js
import { listarSignosVitales } from '../../services/signosVitalesService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const filtro = {};
    if (req.query?.id_enfermero) filtro.id_enfermero = Number(req.query.id_enfermero);
    const resultado = await listarSignosVitales(filtro);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/signos-vitales/listar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
