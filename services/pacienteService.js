// services/pacienteService.js
// ============================================================
// CAPA DE LÓGICA Y SEGURIDAD
// Reglas de negocio de HU-01 / RF01:
//  - Valida CI no duplicado y correo con formato válido.
//  - Nunca guarda la contraseña en texto plano (RNF01, RNF06).
//  - Orquesta la escritura en persona -> usuario -> paciente.
//  - Envía una notificación automática al finalizar el registro.
// ============================================================

import bcrypt from 'bcryptjs';

import {
  buscarUsuarioPorCiOCorreo,
  crearPersona,
  crearUsuario,
  crearPaciente,
  eliminarPersona,
} from '../repositories/pacienteRepository.js';

import { enviarNotificacion } from './notificacionService.js';

const CI_REGEX = /^[0-9]{5,10}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarDatos({ ci, correo, contrasena, nombre, apellido }) {
  const errores = {};

  if (!nombre || nombre.trim().length < 2)
    errores.nombre = 'El nombre es obligatorio.';

  if (!apellido || apellido.trim().length < 2)
    errores.apellido = 'El apellido es obligatorio.';

  if (!ci || !CI_REGEX.test(ci))
    errores.ci =
      'El CI debe tener entre 5 y 10 dígitos, sin puntos ni letras.';

  if (!correo || !CORREO_REGEX.test(correo))
    errores.correo = 'El formato del correo no es válido.';

  if (!contrasena || contrasena.length < 6)
    errores.contrasena =
      'La contraseña debe tener al menos 6 caracteres.';

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

  // Validación
  const errores = validarDatos({
    ci,
    correo,
    contrasena,
    nombre,
    apellido,
  });

  if (Object.keys(errores).length > 0) {
    return {
      ok: false,
      status: 400,
      errores,
    };
  }

  // Validar duplicados
  const existentes = await buscarUsuarioPorCiOCorreo(ci, correo);

  if (existentes.length > 0) {

    const duplicaCi = existentes.some((u) => u.ci === ci);
    const duplicaCorreo = existentes.some((u) => u.correo === correo);

    return {
      ok: false,
      status: 409,
      errores: {
        ...(duplicaCi
          ? { ci: 'Ya existe un usuario registrado con este CI.' }
          : {}),
        ...(duplicaCorreo
          ? { correo: 'Ya existe un usuario registrado con este correo.' }
          : {}),
      },
    };
  }

  // Encriptar contraseña
  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  let personaId;

  try {

    // Crear persona
    personaId = await crearPersona({
      nombre,
      apellido,
      fecha_nac,
      sexo,
      telefono,
    });

    // Crear usuario
    await crearUsuario({
      persona_id: personaId,
      ci,
      correo,
      contrasenaHash,
    });

    // Crear paciente
    const id_paciente = await crearPaciente({
      persona_id: personaId,
      tipo_seguro,
      numero_seguro,
    });

    // Crear notificación
    await enviarNotificacion({
      id_paciente,
      correo,
      titulo: 'Bienvenido al SIIH',
      mensaje: `Hola ${nombre}, tu registro fue realizado correctamente.`,
    });

  } catch (err) {

    if (personaId) {
      await eliminarPersona(personaId);
    }

    return {
      ok: false,
      status: 500,
      errores: {
        general: err.message,
      },
    };
  }

  return {
    ok: true,
    status: 201,
    mensaje: `¡Bienvenido(a), ${nombre}! Tu registro se completó correctamente.`,
  };
}