import { autorizarHospitalizacion } from '../../services/hospitalizacionService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await autorizarHospitalizacion(req.body || {});
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/hospitalizaciones/autorizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
