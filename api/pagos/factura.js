import { generarPdfFacturaPago } from '../../services/facturaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const id_pago = Number(req.query.id_pago);
    if (!id_pago) {
      return res.status(400).json({ ok: false, errores: { general: 'Falta id_pago.' } });
    }

    const resultado = await generarPdfFacturaPago(id_pago);
    if (!resultado.ok) return res.status(resultado.status).json(resultado);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombreArchivo}"`);
    return res.status(200).send(Buffer.from(resultado.pdfBytes));
  } catch (err) {
    console.error('[/api/pagos/factura] Error:', err);
    return res.status(500).json({ ok: false, errores: { general: err.message } });
  }
}
