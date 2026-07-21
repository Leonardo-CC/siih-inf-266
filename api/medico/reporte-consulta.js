// api/medico/reporte-consulta.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD (punto de entrada HTTP)
// HU-09: GET /api/medico/reporte-consulta?id_consulta=X&id_medico=Y
// Devuelve el PDF como archivo adjunto (application/pdf).
// Delega la generación a services/reporteConsultaService.js
// ============================================================
import { generarReporteConsulta } from '../../services/reporteConsultaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const id_consulta = Number(req.query?.id_consulta);
    const id_medico = Number(req.query?.id_medico);

    const resultado = await generarReporteConsulta({ id_consulta, id_medico });

    if (!resultado.ok) {
      return res.status(resultado.status).json(resultado);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
    return res.status(200).send(Buffer.from(resultado.pdfBytes));
  } catch (err) {
    console.error('Error en /api/medico/reporte-consulta:', err);
    return res.status(500).json({
      ok: false,
      mensaje: err.message || 'Error interno del servidor.',
      errores: { general: err.message || 'Error interno del servidor.' },
    });
  }
}
