import {
  actualizarHospitalizacion,
  crearHospitalizacionClinica,
  listarHospitalizaciones,
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

function textoClinico({
  diagnostico_ingreso,
  observaciones_clinicas,
  rol,
  idProfesional,
  id_consulta,
  id_cita,
  tiempo_internacion_dias,
  fecha_estimada_alta,
  sala,
  cama,
}) {
  return [
    `Diagnostico de ingreso: ${diagnostico_ingreso}`,
    `Observaciones clinicas: ${observaciones_clinicas}`,
    tiempo_internacion_dias ? `Tiempo estimado de internacion: ${tiempo_internacion_dias} dia(s)` : null,
    fecha_estimada_alta ? `Fecha estimada de alta: ${fecha_estimada_alta}` : null,
    sala ? `Sala/Unidad: ${sala}` : null,
    cama ? `Cama: ${cama}` : null,
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
  const tiempoInternacion = toIntOrNull(payload.tiempo_internacion_dias);
  const fechaEstimadaAlta = payload.fecha_estimada_alta || null;
  const sala = payload.sala?.trim() || null;
  const cama = payload.cama?.trim() || null;
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
  if (!tiempoInternacion) errores.tiempo_internacion_dias = 'Debes indicar el tiempo estimado de internacion en dias.';
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

    const motivoIngreso = textoClinico({
      diagnostico_ingreso: diagnostico,
      observaciones_clinicas: observaciones,
      rol,
      idProfesional,
      id_consulta: idConsulta,
      id_cita: idCita,
      tiempo_internacion_dias: tiempoInternacion,
      fecha_estimada_alta: fechaEstimadaAlta,
      sala,
      cama,
    });

    const hospitalizacion = await crearHospitalizacionClinica({
      id_consulta: idConsulta,
      id_paciente: idPaciente,
      id_medico: idMedico,
      motivo_ingreso: motivoIngreso,
      tiempo_internacion_dias: tiempoInternacion,
      fecha_estimada_alta: fechaEstimadaAlta,
      sala,
      cama,
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

export async function listarHospitalizacionesAutorizadas() {
  try {
    const hospitalizaciones = await listarHospitalizaciones();
    return { ok: true, status: 200, hospitalizaciones };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: traducirError(err) } };
  }
}

export async function darAltaHospitalizacion(payload = {}) {
  const idHospitalizacion = toIntOrNull(payload.id_hospitalizacion);
  const motivoAlta = payload.motivo_alta?.trim();
  const indicacionesAlta = payload.indicaciones_alta?.trim();

  const errores = {};
  if (!idHospitalizacion) errores.id_hospitalizacion = 'Falta la hospitalizacion.';
  if (!motivoAlta) errores.motivo_alta = 'Debes registrar el motivo de alta.';
  if (!indicacionesAlta) errores.indicaciones_alta = 'Debes registrar indicaciones de alta.';

  if (Object.keys(errores).length) return { ok: false, status: 400, errores };

  try {
    const hospitalizacion = await actualizarHospitalizacion(idHospitalizacion, {
      estado: 'alta',
      fecha_alta: payload.fecha_alta || new Date().toISOString(),
      motivo_alta: motivoAlta,
      indicaciones_alta: indicacionesAlta,
    });

    return {
      ok: true,
      status: 200,
      mensaje: 'Alta hospitalaria registrada correctamente.',
      hospitalizacion,
    };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: traducirError(err) } };
  }
}
