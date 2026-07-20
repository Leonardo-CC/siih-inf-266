import {
  crearHospitalizacionClinica,
  obtenerCitaParaHospitalizacion,
  obtenerConsultaParaHospitalizacion,
} from '../repositories/hospitalizacionRepository.js';
import { traducirError } from '../lib/errorMessages.js';

const ROLES_AUTORIZADOS = ['medico', 'enfermero'];

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function textoClinico({ diagnostico_ingreso, observaciones_clinicas, rol, idProfesional, id_consulta, id_cita }) {
  return [
    `Diagnostico de ingreso: ${diagnostico_ingreso}`,
    `Observaciones clinicas: ${observaciones_clinicas}`,
    `Autorizado por: ${rol} #${idProfesional}`,
    id_consulta ? `Consulta origen: #${id_consulta}` : null,
    id_cita ? `Cita origen: #${id_cita}` : null,
    `Fecha de autorizacion: ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n');
}

export async function autorizarHospitalizacion(payload = {}) {
  const rol = String(payload.rol || '').trim().toLowerCase();
  const idConsulta = toIntOrNull(payload.id_consulta);
  const idCita = toIntOrNull(payload.id_cita);
  const diagnostico = payload.diagnostico_ingreso?.trim();
  const observaciones = payload.observaciones_clinicas?.trim();
  let idPaciente = toIntOrNull(payload.id_paciente);
  let idMedico = toIntOrNull(payload.id_medico);
  let idProfesional = rol === 'enfermero'
    ? toIntOrNull(payload.id_enfermero || payload.id_profesional)
    : toIntOrNull(payload.id_medico || payload.id_profesional);

  const errores = {};
  if (!ROLES_AUTORIZADOS.includes(rol)) errores.rol = 'Solo medico o enfermero pueden autorizar hospitalizacion.';
  if (!idProfesional) errores.id_profesional = 'Falta el ID del profesional que autoriza.';
  if (!diagnostico) errores.diagnostico_ingreso = 'Debes registrar el diagnostico de ingreso.';
  if (!observaciones) errores.observaciones_clinicas = 'Debes registrar observaciones clinicas detalladas.';
  if (!idConsulta && !idCita && !idPaciente) errores.id_paciente = 'Debes indicar el paciente o la consulta/cita de origen.';

  if (Object.keys(errores).length) {
    return { ok: false, status: 400, errores };
  }

  try {
    let origen = null;
    if (idConsulta) {
      origen = await obtenerConsultaParaHospitalizacion(idConsulta);
      if (!origen) return { ok: false, status: 404, errores: { id_consulta: 'Consulta no encontrada.' } };
    } else if (idCita) {
      origen = await obtenerCitaParaHospitalizacion(idCita);
      if (!origen) return { ok: false, status: 404, errores: { id_cita: 'Cita no encontrada.' } };
    }

    idPaciente = idPaciente || origen?.id_paciente || null;
    idMedico = idMedico || origen?.id_medico || null;

    if (rol === 'medico' && idMedico && idMedico !== idProfesional) {
      return { ok: false, status: 403, errores: { id_medico: 'No puedes autorizar por otro medico.' } };
    }

    if (rol === 'medico') idMedico = idProfesional;

    if (!idPaciente) {
      return { ok: false, status: 400, errores: { id_paciente: 'Falta el ID del paciente.' } };
    }
    if (!idMedico) {
      return {
        ok: false,
        status: 400,
        errores: { id_medico: 'La hospitalizacion requiere un medico responsable asociado.' },
      };
    }

    const hospitalizacion = await crearHospitalizacionClinica({
      id_consulta: idConsulta,
      id_paciente: idPaciente,
      id_medico: idMedico,
      motivo_ingreso: textoClinico({
        diagnostico_ingreso: diagnostico,
        observaciones_clinicas: observaciones,
        rol,
        idProfesional,
        id_consulta: idConsulta,
        id_cita: idCita,
      }),
      estado: 'activa',
    });

    return {
      ok: true,
      status: 201,
      mensaje: 'Hospitalizacion autorizada correctamente.',
      hospitalizacion,
    };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: traducirError(err) } };
  }
}
