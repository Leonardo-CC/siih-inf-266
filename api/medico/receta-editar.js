// api/medico/receta-editar.js
import { editarRecetaMedico } from '../../services/medicoService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const { id_consulta } = req.body || {};
    const resultado = await editarRecetaMedico(Number(id_consulta) || null, req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/medico/receta-editar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
