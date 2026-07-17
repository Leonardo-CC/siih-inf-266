// services/pagoService.js
// ============================================================
// SERVICIO DE LÓGICA DE NEGOCIO — Pago y Validación de Seguro
// Contiene reglas de negocio para:
//   - Validar vigencia de seguro
//   - Calcular monto de consulta (por especialidad)
//   - Procesar pagos (simulados)
//   - Generar comprobantes
// ============================================================

import { supabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * Valida la vigencia del seguro del paciente.
 * @param {number} id_paciente - ID del paciente
 * @returns {Object} { vigente: boolean, tipo_seguro: string, numero_seguro: string, fecha_vigencia: Date, razon: string }
 */
export async function validarVigemiaSeguro(id_paciente) {
  try {
    // Obtener datos de seguro del paciente
    const { data: paciente, error: errorPaciente } = await supabaseAdmin
      .from('paciente')
      .select('tipo_seguro, numero_seguro, fecha_vigencia_seguro')
      .eq('id_paciente', id_paciente)
      .single();

    if (errorPaciente || !paciente) {
      return {
        vigente: false,
        razon: 'Paciente no encontrado',
        tiene_seguro: false,
      };
    }

    // Si no tiene seguro registrado
    if (!paciente.tipo_seguro || !paciente.numero_seguro) {
      return {
        vigente: false,
        razon: 'Paciente sin seguro registrado',
        tiene_seguro: false,
      };
    }

    // Si no tiene fecha de vigencia
    if (!paciente.fecha_vigencia_seguro) {
      return {
        vigente: false,
        razon: 'Fecha de vigencia de seguro no registrada',
        tiene_seguro: true,
        tipo_seguro: paciente.tipo_seguro,
        numero_seguro: paciente.numero_seguro,
      };
    }

    // Validar vigencia
    const hoy = new Date();
    const fechaVigencia = new Date(paciente.fecha_vigencia_seguro);
    const vigente = fechaVigencia >= hoy;

    return {
      vigente,
      tipo_seguro: paciente.tipo_seguro,
      numero_seguro: paciente.numero_seguro,
      fecha_vigencia: paciente.fecha_vigencia_seguro,
      razon: vigente ? 'Seguro vigente' : 'Seguro vencido',
      tiene_seguro: true,
    };
  } catch (error) {
    console.error('[pagoService] Error validando vigencia de seguro:', error);
    throw error;
  }
}

/**
 * Obtiene el monto a pagar por una consulta según especialidad del médico.
 * @param {number} id_medico - ID del médico
 * @returns {Object} { monto: number, especialidad: string }
 */
export async function obtenerMontoCita(id_medico) {
  try {
    // Obtener especialidad del médico
    const { data: medico, error: errorMedico } = await supabaseAdmin
      .from('medico')
      .select('especialidad')
      .eq('id_medico', id_medico)
      .single();

    if (errorMedico || !medico) {
      throw new Error('Médico no encontrado');
    }

    // Obtener tarifa de la especialidad
    const { data: especialidad, error: errorEspecialidad } = await supabaseAdmin
      .from('especialidad')
      .select('tarifa')
      .eq('nombre', medico.especialidad)
      .single();

    if (errorEspecialidad || !especialidad) {
      // Retornar tarifa por defecto si especialidad no existe
      return { monto: 200.00, especialidad: medico.especialidad };
    }

    return {
      monto: parseFloat(especialidad.tarifa),
      especialidad: medico.especialidad,
    };
  } catch (error) {
    console.error('[pagoService] Error obteniendo monto de cita:', error);
    throw error;
  }
}

/**
 * Procesa un pago para una cita (simulado).
 * @param {Object} datosPago - { id_cita, id_paciente, id_medico, monto, metodo_pago }
 * @returns {Object} { exitoso: boolean, id_pago, comprobante, referencia_txn, razon }
 */
export async function procesarPago(datosPago) {
  const { id_cita, id_paciente, monto, metodo_pago } = datosPago;

  try {
    // Validaciones
    if (!['efectivo', 'qr', 'tarjeta'].includes(metodo_pago)) {
      return {
        exitoso: false,
        razon: 'Método de pago no válido',
      };
    }

    if (monto <= 0) {
      return {
        exitoso: false,
        razon: 'Monto inválido',
      };
    }

    // Simular procesamiento según método de pago
    // En producción, estos serían llamadas a APIs reales de proveedores de pago
    let aprobado = true;
    let referencia_txn = '';
    let razon_rechazo = '';

    if (metodo_pago === 'efectivo') {
      // Pago en efectivo: se aprueba automáticamente
      referencia_txn = `EFE-${Date.now()}`;
      aprobado = true;
    } else if (metodo_pago === 'qr') {
      // Pago por QR: se aprueba automáticamente (70% de éxito en simulación)
      aprobado = Math.random() > 0.3;
      referencia_txn = `QR-${Date.now()}`;
      if (!aprobado) {
        razon_rechazo = 'Transacción rechazada por el proveedor QR';
      }
    } else if (metodo_pago === 'tarjeta') {
      // Pago con tarjeta: se aprueba automáticamente (80% de éxito en simulación)
      aprobado = Math.random() > 0.2;
      referencia_txn = `TRX-${Date.now()}`;
      if (!aprobado) {
        razon_rechazo = 'Fondos insuficientes o tarjeta rechazada';
      }
    }

    if (!aprobado) {
      // Registrar pago rechazado
      const { data: pagoDatos, error: errorPago } = await supabaseAdmin
        .from('pago')
        .insert([
          {
            id_cita,
            id_paciente,
            monto,
            metodo_pago,
            estado_pago: 'rechazado',
            referencia_txn,
            razon_rechazo,
            fecha_pago: new Date().toISOString(),
          },
        ])
        .select('id_pago')
        .single();

      return {
        exitoso: false,
        razon: razon_rechazo || 'Pago rechazado',
        referencia_txn,
      };
    }

    // Generar comprobante
    const comprobante = generarComprobante({
      referencia_txn,
      monto,
      metodo_pago,
    });

    // Registrar pago aprobado
    const { data: pagoDatos, error: errorPago } = await supabaseAdmin
      .from('pago')
      .insert([
        {
          id_cita,
          id_paciente,
          monto,
          metodo_pago,
          estado_pago: 'aprobado',
          comprobante,
          referencia_txn,
          fecha_pago: new Date().toISOString(),
        },
      ])
      .select('id_pago')
      .single();

    if (errorPago) {
      throw new Error(`Error registrando pago: ${errorPago.message}`);
    }

    // Actualizar estado de la cita
    await actualizarEstadoCita(id_cita, 'pagado');

    return {
      exitoso: true,
      id_pago: pagoDatos.id_pago,
      comprobante,
      referencia_txn,
      razon: 'Pago procesado exitosamente',
    };
  } catch (error) {
    console.error('[pagoService] Error procesando pago:', error);
    throw error;
  }
}

/**
 * Registra la validación de seguro para una cita.
 * @param {number} id_cita - ID de la cita
 * @param {number} id_paciente - ID del paciente
 * @param {Object} datosSeguro - Datos de validación
 * @returns {Object} { registrado: boolean, id_validacion }
 */
export async function registrarValidacionSeguro(id_cita, id_paciente, datosSeguro) {
  try {
    const { validacion, tipo_seguro, numero_seguro, vigencia, estado_validacion } = datosSeguro;

    const { data, error } = await supabaseAdmin
      .from('validacion_seguro')
      .insert([
        {
          id_cita,
          id_paciente,
          tipo_seguro,
          numero_seguro,
          vigencia,
          estado_validacion,
        },
      ])
      .select('id_validacion')
      .single();

    if (error) {
      throw new Error(`Error registrando validación: ${error.message}`);
    }

    return {
      registrado: true,
      id_validacion: data.id_validacion,
    };
  } catch (error) {
    console.error('[pagoService] Error registrando validación de seguro:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de pagos de un paciente.
 * @param {number} id_paciente - ID del paciente
 * @returns {Array} Lista de pagos registrados
 */
export async function obtenerHistorialPagos(id_paciente) {
  try {
    const { data, error } = await supabaseAdmin
      .from('pago')
      .select('id_pago, id_cita, monto, metodo_pago, estado_pago, comprobante, referencia_txn, fecha_pago, created_at')
      .eq('id_paciente', id_paciente)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Error obteniendo historial: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[pagoService] Error obteniendo historial de pagos:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de pago de una cita.
 * @param {number} id_cita - ID de la cita
 * @param {string} estado - Nuevo estado ('sin_pagar', 'pendiente_validacion', 'pagado', 'cancelado')
 */
async function actualizarEstadoCita(id_cita, estado) {
  const { error } = await supabaseAdmin
    .from('cita')
    .update({ estado_pago: estado })
    .eq('id_cita', id_cita);

  if (error) {
    throw new Error(`Error actualizando cita: ${error.message}`);
  }
}

/**
 * Genera un comprobante de pago (formato simple de texto).
 * @param {Object} datos - { referencia_txn, monto, metodo_pago }
 * @returns {string} Comprobante formateado
 */
function generarComprobante(datos) {
  const { referencia_txn, monto, metodo_pago } = datos;
  const fecha = new Date().toLocaleString('es-BO');
  
  const comprobante = `
    ========================================
    COMPROBANTE DE PAGO - CONSULTA MÉDICA
    ========================================
    Referencia: ${referencia_txn}
    Fecha: ${fecha}
    Método: ${metodo_pago.toUpperCase()}
    Monto: Bs. ${monto.toFixed(2)}
    Estado: APROBADO
    ========================================
  `.trim();

  return comprobante;
}