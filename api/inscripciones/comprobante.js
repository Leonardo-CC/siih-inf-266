// api/inscripciones/comprobante.js
import { generarComprobante } from '../../services/inscripcionService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }
  try {
    const id_inscripcion = Number(req.query?.id_inscripcion);
    const resultado = await generarComprobante({ id_inscripcion });

    if (!resultado.ok) {
      return res.status(resultado.status).json(resultado);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
    return res.status(200).send(Buffer.from(resultado.pdfBytes));
  } catch (err) {
    console.error('Error en /api/inscripciones/comprobante:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}