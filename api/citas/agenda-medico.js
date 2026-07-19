// api/citas/agenda-medico.js
// ============================================================
// ENDPOINT: Obtener agenda del médico para un día específico
// HU: Como médico, quiero ver mi agenda del día actualizada
// para no chocar horarios ni perder pacientes.
// ============================================================
import { obtenerAgendaMedico } from '../../services/citaService.js';

export default async function handler(req, res) {
  // Permitir CORS si es necesario (ajustar según configuración del proyecto)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res
      .status(405)
      .json({ ok: false, status: 405, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_medico, fecha } = req.query;

    // Validaciones
    if (!id_medico) {
      return res.status(400).json({
        ok: false,
        status: 400,
        errores: { id_medico: 'El ID del médico es obligatorio.' },
      });
    }

    if (!fecha) {
      return res.status(400).json({
        ok: false,
        status: 400,
        errores: { fecha: 'La fecha es obligatoria (formato YYYY-MM-DD).' },
      });
    }

    const resultado = await obtenerAgendaMedico({
      id_medico: parseInt(id_medico, 10),
      fecha,
    });

    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('[v0] Error en /api/citas/agenda-medico:', err);
    return res.status(500).json({
      ok: false,
      status: 500,
      mensaje: 'Error interno del servidor.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
