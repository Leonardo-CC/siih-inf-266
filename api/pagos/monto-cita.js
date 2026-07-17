// api/pagos/monto-cita.js
// ============================================================
// Endpoint: GET /api/pagos/monto-cita?id_medico=X
// Retorna el monto a pagar por una consulta según especialidad
// ============================================================

import { obtenerMontoCita } from '../../services/pagoService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_medico } = req.query;

    if (!id_medico) {
      return res.status(400).json({ error: 'id_medico es requerido' });
    }

    const resultado = await obtenerMontoCita(parseInt(id_medico));
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[/api/pagos/monto-cita] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
