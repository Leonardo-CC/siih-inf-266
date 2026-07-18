// services/pacienteCitasService.js
// ============================================================
// CAPA DE LOGICA - Citas del paciente.
// Lista todas las citas propias del paciente con su estado.
// ============================================================
import { obtenerCitasPaciente, cancelarCitaPaciente } from '../repositories/pacienteDashboardRepository.js';

export async function obtenerCitasDelPaciente(id_paciente) {
  if (!id_paciente) {
    return { ok: false, status: 400, mensaje: 'Falta el identificador del paciente.' };
  }
  const citas = await obtenerCitasPaciente(id_paciente, { limite: 200 });
  return {
    ok: true,
    status: 200,
    citas: citas.map((c) => ({
      id_cita: c.id_cita,
      medico: c.medico_nombre,
      motivo: c.motivo,
      estado: c.estado,
      fecha_hora: c.fecha_hora,
    })),
  };
}

export async function cancelarCita(id_paciente, id_cita) {
  if (!id_paciente || !id_cita) {
    return { ok: false, status: 400, errores: { general: 'Faltan datos para cancelar la cita.' } };
  }
  try {
    await cancelarCitaPaciente(Number(id_paciente), Number(id_cita));
    return { ok: true, status: 200, mensaje: 'Cita cancelada correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}
