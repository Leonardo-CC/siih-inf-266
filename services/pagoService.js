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
export async function validarVigenciaSeguro(id_paciente) {
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
 * @returns {Object} { monto: number, especialidad: string, id_especialidad: number }
 */
export async function obtenerMontoCita(id_medico) {
  try {
    // Obtener especialidad del médico (ahora con FK a especialidad tabla)
    const { data: medico, error: errorMedico } = await supabaseAdmin
      .from('medico')
      .select('id_especialidad, especialidad:id_especialidad (nombre, tarifa)')
      .eq('id_medico', id_medico)
      .single();

    if (errorMedico || !medico) {
      throw new Error('Médico no encontrado');
    }

    if (!medico.id_especialidad || !medico.especialidad) {
      // Retornar tarifa por defecto si especialidad no está vinculada
      return { monto: 200.00, especialidad: 'Consulta General', id_especialidad: null };
    }

    return {
      monto: parseFloat(medico.especialidad.tarifa),
      especialidad: medico.especialidad.nombre,
      id_especialidad: medico.id_especialidad,
    };
  } catch (error) {
    console.error('[pagoService] Error obteniendo monto de cita:', error);
    throw error;
  }
}

/**
 * Procesa un pago para una cita (con validación en 2 fases).
 * Fase 1: Registra el pago en estado 'pendiente_validacion'
 * Fase 2: Se valida luego mediante webhook o polling
 * 
 * @param {Object} datosPago - { id_cita, id_consulta, id_paciente, id_medico, monto, metodo_pago }
 * @returns {Object} { exitoso: boolean, id_pago, estado, comprobante, razon }
 */
export async function procesarPago(datosPago) {
  let { id_cita, id_consulta, id_paciente, id_medico, monto, metodo_pago } = datosPago;

  try {
    // Validaciones
    if (!['efectivo', 'qr', 'tarjeta'].includes(metodo_pago)) {
      return { exitoso: false, razon: 'Método de pago no válido' };
    }

    if (monto <= 0) {
      return { exitoso: false, razon: 'Monto inválido' };
    }

    // Si no tiene id_consulta, intentar obtenerla de la cita
    if (!id_consulta && id_cita) {
      const { data: consultas } = await supabaseAdmin
        .from('consulta')
        .select('id_consulta')
        .eq('id_cita', id_cita)
        .limit(1);
      
      if (consultas && consultas.length > 0) {
        id_consulta = consultas[0].id_consulta;
      } else {
        // Si no existe consulta aún, crear una temporal
        const { data: citaData } = await supabaseAdmin
          .from('cita')
          .select('id_paciente, id_medico, motivo, fecha_hora')
          .eq('id_cita', id_cita)
          .single();

        if (citaData) {
          const { data: nuevaConsulta, error: errorConsulta } = await supabaseAdmin
            .from('consulta')
            .insert([{
              id_cita,
              id_paciente: citaData.id_paciente,
              id_medico: citaData.id_medico,
              motivo_consulta: citaData.motivo || 'Consulta programada',
              fecha_consulta: citaData.fecha_hora || new Date().toISOString(),
            }])
            .select('id_consulta')
            .single();

          if (!errorConsulta && nuevaConsulta) {
            id_consulta = nuevaConsulta.id_consulta;
          }
        }
      }
    }

    if (!id_consulta) {
      return { exitoso: false, razon: 'No se pudo obtener o crear la consulta para procesar el pago' };
    }

    // Generar referencia única (lo guardaremos en la columna comprobante)
    const comprobante_ref = `${metodo_pago.toUpperCase()}-${Date.now()}`;

    // FASE 1: Registrar el pago en la tabla pago
    const { data: pagoDatos, error: errorPago } = await supabaseAdmin
      .from('pago')
      .insert([
        {
          id_consulta,
          monto,
          metodo_pago,
          comprobante: comprobante_ref
        },
      ])
      .select('id_pago')
      .single();

    if (errorPago) {
      throw new Error(`Error registrando pago: ${errorPago.message}`);
    }

    // Actualizar estado_pago en la tabla cita a 'pendiente_validacion'
    await actualizarEstadoCita(id_cita, 'pendiente_validacion');

    // FASE 2: Simular validación de pago en background
    validarPagoEnBackground(pagoDatos.id_pago, id_cita, metodo_pago);

    return {
      exitoso: true,
      id_pago: pagoDatos.id_pago,
      estado: 'pendiente_validacion',
      comprobante: comprobante_ref,
      razon: 'Pago registrado, pendiente de validación',
      mensaje: 'Tu pago está siendo procesado. En breve recibirás confirmación.',
    };
  } catch (error) {
    console.error('[pagoService] Error procesando pago:', error);
    throw error;
  }
}
/**
 * Valida un pago de forma asincrónica (simula webhook de proveedor).
 * En producción, esto sería un webhook real del proveedor de pagos.
 */
async function validarPagoEnBackground(id_pago, id_cita, metodo_pago) {
  try {
    // Simular delay de validación (1-3 segundos)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Simular validación según método
    let aprobado = true;

    if (metodo_pago === 'efectivo') {
      // Efectivo: siempre se aprueba
      aprobado = true;
    } else if (metodo_pago === 'qr') {
      // QR: 70% de éxito
      aprobado = Math.random() > 0.3;
    } else if (metodo_pago === 'tarjeta') {
      // Tarjeta: 80% de éxito
      aprobado = Math.random() > 0.2;
    }

    // Actualizar estado de la cita
    const estado_cita = aprobado ? 'pagado' : 'sin_pagar';
    await actualizarEstadoCita(id_cita, estado_cita);

    const resultado = aprobado ? 'aprobado' : 'rechazado';
    console.log(`[pagoService] Pago #${id_pago} validado: ${resultado}`);

  } catch (error) {
    console.error('[pagoService] Error en validación de fondo:', error);
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
 * Obtiene el historial de pagos para una consulta.
 * @param {number} id_consulta - ID de la consulta
 * @returns {Array} Lista de pagos registrados
 */
export async function obtenerHistorialPagos(id_consulta) {
  try {
    const { data, error } = await supabaseAdmin
      .from('pago')
      .select('id_pago, id_consulta, id_inscripcion, monto, metodo_pago, comprobante, fecha_pago')
      .eq('id_consulta', id_consulta)
      .order('fecha_pago', { ascending: false });

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
