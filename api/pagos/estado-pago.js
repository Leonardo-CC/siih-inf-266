// api/pagos/estado-pago.js
// ============================================================
// Endpoint: GET /api/pagos/estado-pago?id_pago=X
// 
// Permite al cliente consultar el estado de un pago en tiempo real.
// Útil para polling mientras se valida el pago en background.
// ============================================================

import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_pago } = req.query;

    if (!id_pago) {
      return res.status(400).json({ error: 'id_pago es requerido' });
    }

    // Obtener estado del pago
    const { data: pago, error: errorPago } = await supabaseAdmin
      .from('pago')
      .select(
        `
        id_pago, 
        id_consulta, 
        id_inscripcion, 
        monto, 
        metodo_pago, 
        comprobante, 
        fecha_pago
        `
      )
      .eq('id_pago', parseInt(id_pago))
      .single();

    if (errorPago || !pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Obtener estado de la consulta asociada si existe
    let consultaData = null;
    let citaData = null;
    
    if (pago.id_consulta) {
      const result = await supabaseAdmin
        .from('consulta')
        .select('id_consulta, id_cita, id_paciente, id_medico, fecha_consulta')
        .eq('id_consulta', pago.id_consulta)
        .single();
      
      if (!result.error && result.data) {
        consultaData = result.data;
        
        // Obtener estado de la cita si existe
        if (consultaData.id_cita) {
          const resultCita = await supabaseAdmin
            .from('cita')
            .select('id_cita, estado_pago, fecha_hora')
            .eq('id_cita', consultaData.id_cita)
            .single();
          
          if (!resultCita.error && resultCita.data) {
            citaData = resultCita.data;
          }
        }
      }
    }

    // Determinar el estado actual del pago
    // Prioridad: estado_pago de la cita > 'pendiente_validacion' (por defecto)
    const estadoPago = citaData?.estado_pago || 'pendiente_validacion';

    console.log(`[estado-pago] id_pago: ${pago.id_pago}, estado: ${estadoPago}, metodo: ${pago.metodo_pago}`);

    return res.status(200).json({
      ok: true,
      id_pago: pago.id_pago,
      estado_pago: estadoPago,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      comprobante: pago.comprobante,
      fecha_pago: pago.fecha_pago,
      
      // Información adicional
      id_consulta: pago.id_consulta,
      id_inscripcion: pago.id_inscripcion,
    });
  } catch (error) {
    console.error('[/api/pagos/estado-pago] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
