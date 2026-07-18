// services/signosVitalesService.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD - HU-10 / RF10
// Reglas:
//  - Registra presion arterial, temperatura y frecuencia cardiaca.
//  - Los signos se registran PREVIO a la atencion medica, sobre
//    una consulta ya creada por admision (HU-11).
//  - La consulta y el enfermero son obligatorios.
// ============================================================
import {
  obtenerConsultasParaSignos,
  obtenerEnfermeros,
  verificarConsultaExiste,
  obtenerEstadoConsulta,
  obtenerRolEnfermero,
  registrarSignosVitales,
  obtenerSignosVitales,
} from '../repositories/signosVitalesRepository.js';

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validarSignos(payload) {
  const errores = {};

  const idConsulta = toIntOrNull(payload.id_consulta);
  const idEnfermero = toIntOrNull(payload.id_enfermero);

  const presionArterial = payload.presion_arterial?.trim() || null;
  const temperatura = toNumberOrNull(payload.temperatura);
  const frecuenciaCardiaca = toIntOrNull(payload.frecuencia_cardiaca);

  if (!idConsulta) errores.id_consulta = 'Debes seleccionar la consulta del paciente.';
  if (!idEnfermero) errores.id_enfermero = 'Debes indicar el enfermero responsable.';

  if (!presionArterial && temperatura == null && frecuenciaCardiaca == null) {
    errores.signos = 'Debes registrar al menos un signo vital (presion, temperatura o frecuencia).';
  }

  if (presionArterial && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(presionArterial)) {
    errores.presion_arterial = 'Formato invalido. Usa sistolica/diastolica (ej. 120/80).';
  }

  if (temperatura != null && (temperatura < 34 || temperatura > 42)) {
    errores.temperatura = 'La temperatura debe estar entre 34 y 42 °C.';
  }

  if (frecuenciaCardiaca != null && (frecuenciaCardiaca < 30 || frecuenciaCardiaca > 220)) {
    errores.frecuencia_cardiaca = 'La frecuencia cardiaca debe estar entre 30 y 220 lpm.';
  }

  return {
    errores,
    normalizado: {
      id_consulta: idConsulta,
      id_enfermero: idEnfermero,
      presion_arterial: presionArterial,
      temperatura,
      frecuencia_cardiaca: frecuenciaCardiaca,
      observaciones: payload.observaciones?.trim() || null,
    },
  };
}

export async function listarOpcionesSignos() {
  const [consultas, enfermeros] = await Promise.all([
    obtenerConsultasParaSignos(),
    obtenerEnfermeros(),
  ]);

  return { ok: true, status: 200, consultas, enfermeros };
}

export async function listarSignosVitales() {
  const signos = await obtenerSignosVitales();
  return { ok: true, status: 200, signos };
}

export async function registrarSignos(payload = {}) {
  const { errores, normalizado } = validarSignos(payload);

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  try {
    // RNF01 - Control de accesos: solo usuarios con rol 'enfermero'.
    const rol = await obtenerRolEnfermero(normalizado.id_enfermero);
    if (rol !== 'enfermero') {
      return {
        ok: false,
        status: 403,
        errores: {
          general: 'Acceso denegado: solo el personal de enfermeria puede registrar signos vitales.',
        },
      };
    }

    // Trazabilidad HU-10 -> HU-11: la consulta debe existir y estar activa.
    const estado = await obtenerEstadoConsulta(normalizado.id_consulta);
    if (estado === null) {
      return {
        ok: false,
        status: 404,
        errores: { id_consulta: 'La consulta indicada no existe.' },
      };
    }

    if (estado !== 'pendiente' && estado !== 'confirmada') {
      return {
        ok: false,
        status: 409,
        errores: {
          id_consulta: `La consulta esta en estado "${estado}". Los signos vitales solo se registran en consultas pendientes o confirmadas.`,
        },
      };
    }

    const signos = await registrarSignosVitales(normalizado);
    return {
      ok: true,
      status: 201,
      mensaje: 'Signos vitales registrados correctamente.',
      signos,
    };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}
