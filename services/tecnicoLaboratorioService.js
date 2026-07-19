// services/tecnicoLaboratorioService.js
// ============================================================
// CAPA DE LOGICA - Modulo de Laboratorio
// ============================================================
import bcrypt from 'bcryptjs';
import {
  obtenerIdTecnicoLaboratorioPorPersona,
  listarTecnicosLaboratorio,
  obtenerTecnicoLaboratorioPorId,
  listarAnalisisLaboratorio,
  obtenerAnalisisLaboratorioPorId,
  crearAnalisisLaboratorio,
  actualizarAnalisisLaboratorio,
  eliminarAnalisisLaboratorio,
  listarPacientesLaboratorio,
} from '../repositories/tecnicoLaboratorioRepository.js';
import { buscarUsuarioPorCiOCorreo } from '../repositories/pacienteRepository.js';
import { traducirError } from '../lib/errorMessages.js';

const CI_REGEX = /^[0-9]{5,10}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIPOS_ANALISIS = [
  'Hemograma completo',
  'Glucosa',
  'Perfil lipidico',
  'Perfil hepatico',
  'Perfil renal',
  'Orina',
  'Heces',
  'PCR',
  'Coagulacion',
  'Grupo sanguineo',
  'Serologia',
  'Microbiologia',
  'Otro',
];

const ESTADOS_ANALISIS = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

export async function obtenerDashboardLaboratorio(filtro = {}) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let analisis = await listarAnalisisLaboratorio(filtro);

  const analisisHoy = analisis.filter((a) => new Date(a.fecha_solicitud) >= hoy).length;
  const pendientes = analisis.filter((a) => a.estado === 'pendiente').length;
  const enProceso = analisis.filter((a) => a.estado === 'en_proceso').length;
  const completados = analisis.filter((a) => a.estado === 'completado').length;
  const cancelados = analisis.filter((a) => a.estado === 'cancelado').length;
  const total = analisis.length;

  const porEstado = {};
  analisis.forEach((a) => {
    porEstado[a.estado] = (porEstado[a.estado] || 0) + 1;
  });

  const porTipo = {};
  analisis.forEach((a) => {
    porTipo[a.tipo_analisis] = (porTipo[a.tipo_analisis] || 0) + 1;
  });

  const recientes = analisis.slice(0, 8);

  return {
    ok: true,
    status: 200,
    kpis: {
      analisisHoy,
      pendientes,
      enProceso,
      completados,
      cancelados,
      total,
    },
    porEstado,
    porTipo,
    recientes,
  };
}

export async function registrarAnalisis(payload) {
  const {
    id_paciente,
    id_tecnico_laboratorio,
    tipo_analisis,
    fecha_solicitud,
    fecha_resultado,
    estado,
    resultado,
    observaciones,
  } = payload || {};

  const errores = {};
  if (!id_paciente) errores.id_paciente = 'Selecciona un paciente.';
  if (!id_tecnico_laboratorio) errores.id_tecnico_laboratorio = 'Selecciona un técnico.';
  if (!tipo_analisis || !tipo_analisis.trim()) errores.tipo_analisis = 'El tipo de análisis es obligatorio.';
  if (!estado || !ESTADOS_ANALISIS.includes(estado)) errores.estado = 'Selecciona un estado válido.';

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  try {
    const analisis = await crearAnalisisLaboratorio({
      id_paciente,
      id_tecnico_laboratorio,
      tipo_analisis: tipo_analisis.trim(),
      fecha_solicitud: fecha_solicitud || new Date().toISOString(),
      fecha_resultado: fecha_resultado || null,
      estado: estado || 'pendiente',
      resultado: resultado || null,
      observaciones: observaciones || null,
    });

    return {
      ok: true,
      status: 201,
      mensaje: 'Análisis registrado correctamente.',
      analisis,
    };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function editarAnalisis(id_analisis, payload) {
  if (!id_analisis) {
    return { ok: false, status: 400, errores: { general: 'ID de análisis requerido.' } };
  }

  try {
    await actualizarAnalisisLaboratorio(id_analisis, payload);
    return { ok: true, status: 200, mensaje: 'Análisis actualizado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function eliminarAnalisis(id_analisis) {
  try {
    await eliminarAnalisisLaboratorio(id_analisis);
    return { ok: true, status: 200, mensaje: 'Análisis eliminado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function obtenerAnalisis(filtro = {}) {
  try {
    const analisis = await listarAnalisisLaboratorio(filtro);
    return { ok: true, status: 200, analisis };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function obtenerPacientes() {
  try {
    const pacientes = await listarPacientesLaboratorio();
    return { ok: true, status: 200, pacientes };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function obtenerTecnicos() {
  try {
    const tecnicos = await listarTecnicosLaboratorio();
    return { ok: true, status: 200, tecnicos };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function obtenerPerfilTecnico(id_tecnico_laboratorio) {
  if (!id_tecnico_laboratorio) {
    return { ok: false, status: 400, mensaje: 'Falta el identificador del técnico.' };
  }
  const perfil = await obtenerTecnicoLaboratorioPorId(id_tecnico_laboratorio);
  if (!perfil) {
    return { ok: false, status: 404, mensaje: 'No se encontró el perfil del técnico.' };
  }
  return { ok: true, status: 200, perfil };
}

export async function actualizarPerfilTecnico(id_tecnico_laboratorio, payload = {}) {
  if (!id_tecnico_laboratorio) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador del técnico.' } };
  }

  const perfilActual = await obtenerTecnicoLaboratorioPorId(id_tecnico_laboratorio);
  if (!perfilActual) {
    return { ok: false, status: 404, errores: { general: 'No se encontró el perfil del técnico.' } };
  }

  const correo = (payload.correo || '').trim();
  const telefono = (payload.telefono || '').trim();
  const contrasenaActual = payload.contrasenaActual || '';
  const contrasenaNueva = payload.contrasenaNueva || '';

  const errores = {};

  if (!correo || !CORREO_REGEX.test(correo)) {
    errores.correo = 'El formato del correo no es válido.';
  }

  if (correo && correo.toLowerCase() !== perfilActual.correo?.toLowerCase()) {
    const duplicados = await buscarUsuarioPorCiOCorreo(perfilActual.ci, correo);
    if (duplicados && duplicados.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      errores.correo = 'Ya existe otro usuario registrado con este correo.';
    }
  }

  let contrasenaHash = null;
  if (contrasenaNueva) {
    if (contrasenaNueva.length < 6) {
      errores.contrasenaNueva = 'La nueva contraseña debe tener al menos 6 caracteres.';
    }

    const { leerContrasenaPorPersona } = await import('../repositories/authRepository.js');
    const { hash: hashActual, error: errorLectura } = await leerContrasenaPorPersona(perfilActual.persona_id);

    if (errorLectura || !hashActual) {
      errores.general = 'No se pudo verificar la contraseña actual.';
    } else {
      const coincide = await bcrypt.compare(contrasenaActual, hashActual);
      if (!coincide) {
        errores.contrasenaActual = 'La contraseña actual no es correcta.';
      } else {
        contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
      }
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  try {
    const updatesPersona = {};
    if (telefono !== undefined) updatesPersona.telefono = telefono || null;

    if (Object.keys(updatesPersona).length > 0) {
      const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
      const { error } = await supabaseAdmin
        .from('persona')
        .update(updatesPersona)
        .eq('persona_id', perfilActual.persona_id);

      if (error) throw new Error(`Error actualizando persona: ${error.message}`);
    }

    const updatesUsuario = {};
    if (correo !== undefined && correo !== '') updatesUsuario.correo = correo;

    if (Object.keys(updatesUsuario).length > 0) {
      const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
      const { error } = await supabaseAdmin
        .from('usuario')
        .update(updatesUsuario)
        .eq('persona_id', perfilActual.persona_id);

      if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
    }

    if (contrasenaHash) {
      const { actualizarContrasenaPorPersona } = await import('../repositories/authRepository.js');
      const { error: errorUpdate } = await actualizarContrasenaPorPersona(perfilActual.persona_id, contrasenaHash);
      if (errorUpdate) throw new Error(`Error actualizando contraseña: ${errorUpdate.message}`);
    }

    const perfilActualizado = await obtenerTecnicoLaboratorioPorId(id_tecnico_laboratorio);
    return {
      ok: true,
      status: 200,
      mensaje: 'Perfil actualizado correctamente.',
      perfil: perfilActualizado,
    };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

export async function recuperarContrasenaTecnico({ ci, correo, nuevaContrasena }) {
  if (!ci || !correo || !nuevaContrasena) {
    return { ok: false, status: 400, errores: { general: 'Faltan datos para recuperar la contraseña.' } };
  }
  if (nuevaContrasena.length < 6) {
    return { ok: false, status: 400, errores: { contrasena: 'La nueva contraseña debe tener al menos 6 caracteres.' } };
  }

  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  const { data: usuario, error } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, ci, correo')
    .eq('ci', ci)
    .eq('correo', correo)
    .maybeSingle();

  if (error) return { ok: false, status: 500, errores: { general: error.message } };
  if (!usuario) {
    return { ok: false, status: 404, errores: { general: 'No se encontró una cuenta con ese CI y correo.' } };
  }

  const hash = await bcrypt.hash(nuevaContrasena, 10);
  const { actualizarContrasenaPorPersona } = await import('../repositories/authRepository.js');
  const { error: errorUpdate } = await actualizarContrasenaPorPersona(usuario.persona_id, hash);

  if (errorUpdate) {
    return { ok: false, status: 400, errores: { general: errorUpdate.message } };
  }

  return { ok: true, status: 200, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}
