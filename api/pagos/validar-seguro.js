// api/pagos/validar-seguro.js
// ============================================================
// Endpoint: GET /api/pagos/validar-seguro?id_paciente=X
// Valida la vigencia del seguro del paciente
// ============================================================

import { validarVigenciaSeguro } from '../../services/pagoService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_paciente } = req.query;

    if (!id_paciente) {
      return res.status(400).json({ error: 'id_paciente es requerido' });
    }

    const resultado = await validarVigenciaSeguro(parseInt(id_paciente));
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[/api/pagos/validar-seguro] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}