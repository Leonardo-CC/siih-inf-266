// api/pacientes/actualizar.js
import { editarPaciente } from '../../services/pacienteService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await editarPaciente(req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/pacientes/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
