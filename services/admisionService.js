// services/admisionService.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD - HU-11 / RF11
// Reglas:
//  - Registra ingreso del paciente.
//  - Verifica datos y motivo de consulta.
//  - Asigna medico o sala.
//  - Guarda la información en la tabla consulta existente.
// ============================================================
import {
  ejecutarRegistroAdmision,
  obtenerAdmisiones,
  obtenerCitasParaAdmision,
  obtenerEnfermeros,
  obtenerMedicos,
  obtenerPacientes,
  buscarPacientesPorNombre,
  crearPersonaYPaciente,
  actualizarAdmision,
  borrarAdmision,
} from '../repositories/admisionRepository.js';

const TIPOS_ADMISION = ['consulta_externa', 'emergencia', 'hospitalizacion'];
const ESTADOS_ADMISION = ['registrada', 'en_triage', 'asignada', 'atendida', 'cancelada'];

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validarAdmision(payload) {
  const errores = {};

  const idPaciente = toIntOrNull(payload.id_paciente);
  const pacienteNombre = payload.paciente_nombre?.trim() || null;
  const idEnfermero = toIntOrNull(payload.id_enfermero);
  const idCita = toIntOrNull(payload.id_cita);
  const idMedico = toIntOrNull(payload.id_medico);
  const salaAsignada = payload.sala_asignada?.trim() || null;
  const motivoConsulta = payload.motivo_consulta?.trim();
  const tipoAdmision = payload.tipo_admision || 'consulta_externa';

  if (!idPaciente && !pacienteNombre) errores.id_paciente = 'Debes indicar el paciente.';
  if (!idEnfermero) errores.id_enfermero = 'Debes indicar el enfermero responsable.';
  if (!motivoConsulta) errores.motivo_consulta = 'Debes registrar el motivo de consulta.';
  if (!TIPOS_ADMISION.includes(tipoAdmision)) errores.tipo_admision = 'Tipo de admision no valido.';
  if (!idCita && !idMedico) {
    errores.asignacion = 'Debes seleccionar una cita o asignar un medico.';
  }

  return {
    errores,
    normalizado: {
      id_paciente: idPaciente,
      paciente_nombre: pacienteNombre,
      id_enfermero: idEnfermero,
      motivo_consulta: motivoConsulta,
      tipo_admision: tipoAdmision,
      id_cita: idCita,
      id_medico: idMedico,
      sala_asignada: salaAsignada,
      datos_verificados: Boolean(payload.datos_verificados),
      observaciones: payload.observaciones?.trim() || null,
    },
  };
}

export async function listarOpcionesAdmision() {
  const [citas, enfermeros, medicos, pacientes] = await Promise.all([
    obtenerCitasParaAdmision(),
    obtenerEnfermeros(),
    obtenerMedicos(),
    obtenerPacientes(),
  ]);

  return {
    ok: true,
    status: 200,
    citas,
    enfermeros,
    medicos,
    pacientes,
    tipos_admision: TIPOS_ADMISION,
    estados_admision: ESTADOS_ADMISION,
  };
}

export async function listarAdmisiones(filtro = {}) {
  const admisiones = await obtenerAdmisiones(filtro);
  return { ok: true, status: 200, admisiones };
}

export async function registrarAdmision(payload = {}) {
  const { errores, normalizado } = validarAdmision(payload);

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  // Si no llega id_paciente, intentar resolver por nombre
  if (!normalizado.id_paciente && normalizado.paciente_nombre) {
    try {
      const matches = await buscarPacientesPorNombre(normalizado.paciente_nombre);
      if (matches.length === 1) {
        normalizado.id_paciente = matches[0].id_paciente;
      } else if (matches.length > 1) {
        return {
          ok: false,
          status: 409,
          errores: { id_paciente: 'Nombre coincide con varias personas.' , sugerencias: matches },
        };
      } else {
        // no matches
        if (payload.confirmar_creacion) {
          const creado = await crearPersonaYPaciente(normalizado.paciente_nombre);
          normalizado.id_paciente = creado.id_paciente;
        } else {
          return {
            ok: false,
            status: 404,
            errores: { id_paciente: 'Paciente no encontrado. Enviar `confirmar_creacion=true` para crear un registro mínimo y continuar.' },
          };
        }
      }
    } catch (e) {
      return { ok: false, status: 500, errores: { general: e.message } };
    }
  }

  try {
    const admision = await ejecutarRegistroAdmision(normalizado);
    return {
      ok: true,
      status: 201,
      mensaje: 'Admision registrada correctamente.',
      admision,
    };
  } catch (err) {
    // traducir errores conocidos
    if (err.message === 'NO_ID_PACIENTE') {
      return { ok: false, status: 400, errores: { id_paciente: 'Debes indicar el paciente.' } };
    }
    if (err.message === 'PACIENTE_YA_ADMITIDO') {
      return { ok: false, status: 409, errores: { general: 'Paciente ya tiene una admisión reciente.' } };
    }

    return { ok: false, status: 500, errores: { general: err.message } };
  }
}

export async function editarAdmision(id_consulta, payload = {}) {
  if (!id_consulta) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador de la admisión.' } };
  }

  if (payload.tipo_admision !== undefined && !TIPOS_ADMISION.includes(payload.tipo_admision)) {
    return { ok: false, status: 400, errores: { tipo_admision: 'Tipo de admisión no válido.' } };
  }

  if (payload.estado !== undefined && !ESTADOS_ADMISION.includes(payload.estado)) {
    return { ok: false, status: 400, errores: { estado: 'Estado de admisión no válido.' } };
  }

  if (payload.motivo_consulta !== undefined && !payload.motivo_consulta?.trim()) {
    return { ok: false, status: 400, errores: { motivo_consulta: 'El motivo de consulta no puede quedar vacío.' } };
  }

  try {
    const admision = await actualizarAdmision(id_consulta, payload);
    return {
      ok: true,
      status: 200,
      mensaje: 'Admision actualizada correctamente.',
      admision,
    };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: err.message } };
  }
}

export const ESTADOS_ADMISION_DISPONIBLES = ESTADOS_ADMISION;

export async function eliminarAdmision(id_consulta) {
  try {
    await borrarAdmision(id_consulta);
    return {
      ok: true,
      status: 200,
      mensaje: 'Admision eliminada correctamente.',
    };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: err.message } };
  }
}
