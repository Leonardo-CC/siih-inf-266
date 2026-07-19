// api/pagos/completar-pago-y-seguro.js
// ============================================================
// Endpoint: POST /api/pagos/completar-pago-y-seguro
// 
// Flujo COMPLETO:
// 1. Validar vigencia de seguro
// 2. Procesar pago
// 3. Registrar validación de seguro
// 4. Retornar estado unificado
//
// Body: {
//   id_cita, id_paciente, id_medico, monto, metodo_pago,
//   id_tipo_seguro, numero_seguro, fecha_vigencia_seguro
// }
// ============================================================

import { 
  validarVigemiaSeguro, 
  procesarPago, 
  registrarValidacionSeguro,
  obtenerMontoCita,
} from '../../services/pagoService.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      id_cita,
      id_paciente,
      id_medico,
      monto,
      metodo_pago,
      id_tipo_seguro,
      numero_seguro,
      fecha_vigencia_seguro,
    } = req.body;

    // Validaciones básicas
    if (!id_cita || !id_paciente || !id_medico || !metodo_pago) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: id_cita, id_paciente, id_medico, metodo_pago',
      });
    }

    // PASO 1: Validar vigencia de seguro
    console.log(`[completar-pago] Validando seguro para paciente ${id_paciente}`);
    const validacionSeguro = await validarVigemiaSeguro(id_paciente);

    // PASO 2: Obtener monto correcto de la especialidad del médico
    const montoCita = await obtenerMontoCita(id_medico);
    const montoFinal = monto || montoCita.monto;

    console.log(
      `[completar-pago] Seguro: ${validacionSeguro.vigente ? 'VIGENTE' : 'NO VIGENTE'}, Monto: Bs. ${montoFinal}`
    );

    // PASO 3: Procesar pago
    const resultadoPago = await procesarPago({
      id_cita,
      id_paciente,
      id_medico,
      monto: montoFinal,
      metodo_pago,
    });

    console.log(`[completar-pago] Pago registrado: ${resultadoPago.id_pago}`);

    // PASO 4: Registrar validación de seguro
    let resultadoSeguro = null;
    if (id_tipo_seguro && numero_seguro) {
      const estado_validacion = validacionSeguro.vigente ? 'vigente' : 'vencido';
      
      resultadoSeguro = await registrarValidacionSeguro(
        id_cita,
        id_paciente,
        {
          id_tipo_seguro,
          numero_seguro,
          vigencia: fecha_vigencia_seguro,
          estado_validacion,
        }
      );

      console.log(`[completar-pago] Seguro registrado: ${resultadoSeguro.id_validacion}`);
    }

    // PASO 5: Respuesta unificada
    return res.status(200).json({
      exitoso: true,
      id_pago: resultadoPago.id_pago,
      id_validacion_seguro: resultadoSeguro?.id_validacion || null,
      referencia_txn: resultadoPago.referencia_txn,
      estado_pago: resultadoPago.estado,
      estado_seguro: validacionSeguro.vigente ? 'vigente' : validacionSeguro.tiene_seguro ? 'vencido' : 'sin_seguro',
      monto: montoFinal,
      especialidad: montoCita.especialidad,
      tarifa: montoCita.monto,
      mensaje: `
        Pago: ${resultadoPago.razon}
        Seguro: ${validacionSeguro.razon}
      `.trim(),
      detalles: {
        pago: resultadoPago,
        seguro: validacionSeguro,
      },
    });
  } catch (error) {
    console.error('[/api/pagos/completar-pago-y-seguro] Error:', error.message);
    return res.status(500).json({
      error: error.message,
      exitoso: false,
    });
  }
}
