// api/pagos/registrar-validacion.js
// ============================================================
// Endpoint: POST /api/pagos/registrar-validacion
// Registra la validación de seguro para una cita
// Body: { id_cita, id_paciente, tipo_seguro, numero_seguro, vigencia, estado_validacion }

import { registrarValidacionSeguro } from '../../services/pagoService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { 
      id_cita, 
      id_paciente, 
      tipo_seguro, 
      numero_seguro, 
      vigencia, 
      estado_validacion 
    } = req.body;

    // Validaciones básicas
    if (!id_cita || !id_paciente) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: id_cita, id_paciente' 
      });
    }

    const resultado = await registrarValidacionSeguro(
      id_cita,
      id_paciente,
      {
        tipo_seguro,
        numero_seguro,
        vigencia,
        estado_validacion,
      }
    );

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[/api/pagos/registrar-validacion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}