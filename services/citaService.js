// services/citaService.js
// ============================================================
// CAPA DE LÓGICA Y SEGURIDAD
// Reglas de negocio de HU-03 / RF03:
//  - Permite elegir especialidad, fecha y horario libres.
//  - Bloquea horarios ocupados o fechas/horas pasadas.
//  - Deja estado visible: la cita nace en 'pendiente'.
// ============================================================
import {
  obtenerEspecialidades,
  obtenerMedicosPorEspecialidad,
  obtenerCitasOcupadas,
  existeCitaEnHorario,
  crearCita,
  listarTodasCitas,
  actualizarCita,
  eliminarCita,
  listarPacientesParaCita,
} from '../repositories/citaRepository.js';
import { traducirError } from '../lib/errorMessages.js';

// --- Configuración de horario de atención ---------------------------------
// AJUSTAR AQUÍ si el hospital define otro rango u otra duración de consulta.
// Por ahora: Lunes a Sábado, 08:00–18:00, slots de 30 minutos.
const HORA_INICIO = '08:00';
const HORA_FIN = '18:00';
const DURACION_SLOT_MIN = 30;
const DIA_NO_LABORAL = 0; // 0 = domingo (getDay())
// ---------------------------------------------------------------------------

function minutosDesdeHHMM(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function hhmmDesdeMinutos(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Genera todos los slots posibles del día (independiente de ocupación).
function generarSlotsDelDia() {
  const slots = [];
  const inicio = minutosDesdeHHMM(HORA_INICIO);
  const fin = minutosDesdeHHMM(HORA_FIN);
  for (let m = inicio; m < fin; m += DURACION_SLOT_MIN) {
    slots.push(hhmmDesdeMinutos(m));
  }
  return slots;
}

function esFechaValida(fechaStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fechaStr) && !Number.isNaN(new Date(`${fechaStr}T00:00:00`).getTime());
}

export async function listarEspecialidades() {
  const especialidades = await obtenerEspecialidades();
  return { ok: true, status: 200, especialidades };
}

export async function listarMedicos(especialidad) {
  if (!especialidad) {
    return { ok: false, status: 400, mensaje: 'Debes indicar una especialidad.' };
  }
  const medicos = await obtenerMedicosPorEspecialidad(especialidad);
  return { ok: true, status: 200, medicos };
}

// Devuelve los horarios del día, marcando cuáles están libres u ocupados,
// y descartando automáticamente los que ya pasaron si la fecha es hoy.
export async function listarHorariosDisponibles({ id_medico, fecha }) {
  if (!id_medico || !fecha) {
    return { ok: false, status: 400, mensaje: 'Debes indicar médico y fecha.' };
  }
  if (!esFechaValida(fecha)) {
    return { ok: false, status: 400, mensaje: 'Formato de fecha inválido.' };
  }

  const hoy = new Date();
  const fechaSeleccionada = new Date(`${fecha}T00:00:00`);
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  if (fechaSeleccionada < inicioHoy) {
    return { ok: false, status: 400, mensaje: 'No se pueden solicitar citas en fechas pasadas.' };
  }
  if (fechaSeleccionada.getDay() === DIA_NO_LABORAL) {
    return { ok: true, status: 200, horarios: [] }; // día no laboral: sin slots
  }

  const inicioISO = `${fecha}T00:00:00`;
  const finISO = `${fecha}T23:59:59`;
  const ocupados = new Set(await obtenerCitasOcupadas(id_medico, inicioISO, finISO));

  const esHoy = fechaSeleccionada.getTime() === inicioHoy.getTime();
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();

  const horarios = generarSlotsDelDia().map((hora) => {
    const fecha_hora = `${fecha}T${hora}:00`;
    const yaPaso = esHoy && minutosDesdeHHMM(hora) <= minutosAhora;
    return {
      hora,
      fecha_hora,
      disponible: !ocupados.has(fecha_hora) && !yaPaso,
    };
  });

  return { ok: true, status: 200, horarios };
}

export async function solicitarCita({ id_paciente, id_medico, fecha_hora, motivo }) {
  if (!id_paciente || !id_medico || !fecha_hora) {
    return {
      ok: false,
      status: 400,
      errores: { general: 'Faltan datos obligatorios (paciente, médico u horario).' },
    };
  }

  const cuandoSolicitada = new Date(fecha_hora);
  if (Number.isNaN(cuandoSolicitada.getTime())) {
    return { ok: false, status: 400, errores: { fecha_hora: 'Formato de fecha/hora inválido.' } };
  }
  if (cuandoSolicitada.getTime() < Date.now()) {
    return { ok: false, status: 400, errores: { fecha_hora: 'No se puede solicitar una cita en el pasado.' } };
  }

  // Re-verificación de disponibilidad justo antes de insertar (RF03: bloquear horarios ocupados)
  const ocupado = await existeCitaEnHorario(id_medico, fecha_hora);
  if (ocupado) {
    return {
      ok: false,
      status: 409,
      errores: { fecha_hora: 'Ese horario ya fue tomado. Por favor elige otro.' },
    };
  }

  const cita = await crearCita({ id_paciente, id_medico, fecha_hora, motivo });

  return {
    ok: true,
    status: 201,
    mensaje: 'Tu cita fue solicitada correctamente y quedó en estado pendiente.',
    cita, // { id_cita, fecha_hora, estado: 'pendiente' }
  };
}

export async function adminListarCitas() {
  const citas = await listarTodasCitas();
  return { ok: true, status: 200, citas };
}

export async function adminActualizarCita(id_cita, datos) {
  if (!id_cita) {
    return { ok: false, status: 400, mensaje: 'ID de cita requerido.' };
  }
  try {
    await actualizarCita(id_cita, datos);
    return { ok: true, status: 200, mensaje: 'Cita actualizada correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function adminEliminarCita(id_cita) {
  if (!id_cita) {
    return { ok: false, status: 400, mensaje: 'ID de cita requerido.' };
  }
  await eliminarCita(id_cita);
  return { ok: true, status: 200, mensaje: 'Cita eliminada correctamente.' };
}

export async function adminObtenerPacientesCita() {
  const pacientes = await listarPacientesParaCita();
  return { ok: true, status: 200, pacientes };
}

export async function adminObtenerEspecialidadesCita() {
  const especialidades = await obtenerEspecialidades();
  return { ok: true, status: 200, especialidades };
}

export async function adminObtenerMedicosCita(especialidad) {
  if (!especialidad) {
    return { ok: false, status: 400, mensaje: 'Debes indicar una especialidad.' };
  }
  const medicos = await obtenerMedicosPorEspecialidad(especialidad);
  return { ok: true, status: 200, medicos };
}