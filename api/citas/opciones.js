// api/citas/opciones.js
import { adminObtenerPacientesCita, adminObtenerEspecialidadesCita, adminObtenerMedicosCita } from '../../services/citaService.js';

export default async function handler(req, res) {
  const { accion } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    if (accion === 'pacientes') {
      const resultado = await adminObtenerPacientesCita();
      return res.status(resultado.status).json(resultado);
    }
    if (accion === 'especialidades') {
      const resultado = await adminObtenerEspecialidadesCita();
      return res.status(resultado.status).json(resultado);
    }
    if (accion === 'medicos') {
      const { especialidad } = req.query;
      const resultado = await adminObtenerMedicosCita(especialidad);
      return res.status(resultado.status).json(resultado);
    }

    return res.status(400).json({ ok: false, mensaje: 'Acción no válida.' });
  } catch (err) {
    console.error('Error en /api/citas/opciones:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
