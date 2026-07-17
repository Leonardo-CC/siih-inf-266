// api/pagos/procesar-pago.js
// ============================================================
// Endpoint: POST /api/pagos/procesar-pago
// Procesa un pago para una cita
// Body: { id_cita, id_paciente, id_medico, monto, metodo_pago }
// ============================================================

import { procesarPago } from '../../services/pagoService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_cita, id_paciente, id_medico, monto, metodo_pago } = req.body;

    // Validaciones básicas
    if (!id_cita || !id_paciente || !monto || !metodo_pago) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: id_cita, id_paciente, monto, metodo_pago' 
      });
    }

    // Procesar el pago
    const resultado = await procesarPago({
      id_cita,
      id_paciente,
      id_medico,
      monto,
      metodo_pago,
    });

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[/api/pagos/procesar-pago] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
