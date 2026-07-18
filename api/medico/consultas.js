// api/medico/consultas.js
import { listarConsultasMedico } from '../../services/medicoService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }
  try {
    const id_medico = Number(req.query?.id_medico);
    const resultado = await listarConsultasMedico(id_medico);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/medico/consultas:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
