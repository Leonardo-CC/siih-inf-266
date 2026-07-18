// api/pacientes/eliminar.js
import { borrarPaciente } from '../../services/pacienteService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const { id_paciente } = req.body;
    if (!id_paciente) {
      return res.status(400).json({ ok: false, mensaje: 'ID de paciente requerido.' });
    }

    const resultado = await borrarPaciente(id_paciente);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/pacientes/eliminar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
