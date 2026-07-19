// api/medico/receta-ver.js
import { verRecetaMedico } from '../../services/medicoService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const id_consulta = Number(req.query?.id_consulta);
    const resultado = await verRecetaMedico(id_consulta);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/medico/receta-ver:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
