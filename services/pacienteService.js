// services/pacienteService.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD
// ============================================================
import bcrypt from 'bcryptjs';
import {
  buscarUsuarioPorCiOCorreo,
  crearPersona,
  crearUsuario,
  crearPaciente,
  eliminarPersona,
  listarPacientes,
  eliminarPaciente,
  actualizarPaciente,
} from '../repositories/pacienteRepository.js';

const CI_REGEX = /^[0-9]{5,10}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarDatos({ ci, correo, contrasena, nombre, apellido, contrasenaEsCI = false }) {
  const errores = {};

  if (!nombre || nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (!apellido || apellido.trim().length < 2) errores.apellido = 'El apellido es obligatorio.';
  if (!ci || !CI_REGEX.test(ci)) errores.ci = 'El CI debe tener entre 5 y 10 dígitos, sin puntos ni letras.';
  if (!correo || !CORREO_REGEX.test(correo)) errores.correo = 'El formato del correo no es válido.';
  if (!contrasenaEsCI && (!contrasena || contrasena.length < 6))
    errores.contrasena = 'La contraseña debe tener al menos 6 caracteres.';

  return errores;
}

export async function registrarPaciente(payload) {
  const {
    nombre,
    apellido,
    fecha_nac,
    sexo,
    telefono,
    ci,
    correo,
    contrasena,
    tipo_seguro,
    numero_seguro,
  } = payload || {};

  const contrasenaFinal = contrasena || ci;

  const errores = validarDatos({
    ci,
    correo,
    contrasena: contrasenaFinal,
    nombre,
    apellido,
    contrasenaEsCI: !contrasena,
  });
  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  const existentes = await buscarUsuarioPorCiOCorreo(ci, correo);
  if (existentes && existentes.length > 0) {
    const duplicaCi = existentes.some((u) => u.ci === ci);
    const duplicaCorreo = existentes.some((u) => u.correo === correo);
    return {
      ok: false,
      status: 409,
      errores: {
        ...(duplicaCi ? { ci: 'Ya existe un usuario registrado con este CI.' } : {}),
        ...(duplicaCorreo ? { correo: 'Ya existe un usuario registrado con este correo.' } : {}),
      },
    };
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  let personaId;
  try {
    personaId = await crearPersona({ nombre, apellido, fecha_nac, sexo, telefono });
    await crearUsuario({ persona_id: personaId, ci, correo, contrasenaHash });
    await crearPaciente({ persona_id: personaId, tipo_seguro, numero_seguro });
  } catch (err) {
    if (personaId) await eliminarPersona(personaId);
    return { ok: false, status: 500, errores: { general: err.message } };
  }

  await enviarNotificacionBienvenida(correo, nombre);

  return {
    ok: true,
    status: 201,
    mensaje: `¡Bienvenido(a), ${nombre}! Tu registro se completó correctamente.`,
  };
}

export async function obtenerPacientes() {
  const pacientes = await listarPacientes();
  return { ok: true, status: 200, pacientes };
}

export async function borrarPaciente(id_paciente) {
  try {
    await eliminarPaciente(id_paciente);
    return { ok: true, status: 200, mensaje: 'Paciente eliminado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

export async function editarPaciente(payload) {
  const { id_paciente, nombre, apellido, ci, telefono, correo, tipo_seguro, numero_seguro } = payload || {};

  if (!id_paciente) {
    return { ok: false, status: 400, errores: { general: 'ID de paciente requerido.' } };
  }

  try {
    await actualizarPaciente(id_paciente, { nombre, apellido, ci, telefono, correo, tipo_seguro, numero_seguro });
    return { ok: true, status: 200, mensaje: 'Paciente actualizado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

async function enviarNotificacionBienvenida(correo, nombre) {
  console.log(`[Notificación] Bienvenida enviada a ${correo} (${nombre}).`);
  return true;
}
