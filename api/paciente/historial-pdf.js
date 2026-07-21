import { generarPdfHistorialPaciente } from '../../services/historialPacientePdf.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const idPaciente = Number(req.query?.id_paciente);
    const resultado = await generarPdfHistorialPaciente(idPaciente);
    if (!resultado.ok) return res.status(resultado.status).json(resultado);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
    return res.status(200).send(Buffer.from(resultado.pdfBytes));
  } catch (error) {
    console.error('Error en /api/paciente/historial-pdf:', error);
    return res.status(500).json({
      ok: false,
      mensaje: error.message || 'Error interno del servidor.',
      errores: { general: error.message || 'Error interno del servidor.' },
    });
  }
}
