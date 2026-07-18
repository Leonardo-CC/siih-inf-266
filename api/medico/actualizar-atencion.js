// api/medico/actualizar-atencion.js
import { editarAtencionMedico } from '../../services/medicoService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }
  try {
    const { id_consulta, id_medico } = req.body || {};
    const resultado = await editarAtencionMedico(id_consulta, Number(id_medico) || null, req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/medico/actualizar-atencion:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
