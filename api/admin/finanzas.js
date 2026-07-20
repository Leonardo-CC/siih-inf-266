import { crearMovimientoFinanciero, listarFinanzas } from '../../services/finanzasService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const resultado = await listarFinanzas(req.query || {});
    return res.status(resultado.status).json(resultado);
  }

  if (req.method === 'POST') {
    const resultado = await crearMovimientoFinanciero(req.body || {});
    return res.status(resultado.status).json(resultado);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
}
