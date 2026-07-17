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
        id_cita, 
        id_paciente, 
        monto, 
        metodo_pago, 
        estado_pago, 
        comprobante, 
        referencia_txn,
        razon_rechazo,
        fecha_pago, 
        created_at,
        updated_at
        `
      )
      .eq('id_pago', parseInt(id_pago))
      .single();

    if (errorPago || !pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Obtener estado de la cita asociada
    const { data: cita, error: errorCita } = await supabaseAdmin
      .from('cita')
      .select('id_cita, estado, estado_pago, fecha_hora, motivo')
      .eq('id_cita', pago.id_cita)
      .single();

    // Obtener validación de seguro asociada
    const { data: seguro, error: errorSeguro } = await supabaseAdmin
      .from('validacion_seguro')
      .select('id_validacion, estado_validacion, tipo_seguro, fecha_validacion')
      .eq('id_cita', pago.id_cita)
      .order('created_at', { ascending: false })
      .limit(1);

    return res.status(200).json({
      id_pago: pago.id_pago,
      estado_pago: pago.estado_pago,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      referencia_txn: pago.referencia_txn,
      comprobante: pago.comprobante,
      razon_rechazo: pago.razon_rechazo,
      fecha_pago: pago.fecha_pago,
      created_at: pago.created_at,
      
      // Estado de la cita
      cita: cita ? {
        id_cita: cita.id_cita,
        estado: cita.estado,
        estado_pago: cita.estado_pago,
        fecha_hora: cita.fecha_hora,
        motivo: cita.motivo,
      } : null,

      // Validación de seguro
      seguro: seguro && seguro.length > 0 ? {
        id_validacion: seguro[0].id_validacion,
        estado_validacion: seguro[0].estado_validacion,
        tipo_seguro: seguro[0].tipo_seguro,
        fecha_validacion: seguro[0].fecha_validacion,
      } : null,

      // Interpretación del estado
      interpretacion: {
        pagado: pago.estado_pago === 'aprobado',
        pendiente: pago.estado_pago === 'pendiente_validacion',
        rechazado: pago.estado_pago === 'rechazado',
        listo_consulta: pago.estado_pago === 'aprobado' && cita?.estado === 'confirmada',
      },
    });
  } catch (error) {
    console.error('[/api/pagos/estado-pago] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
