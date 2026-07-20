import bcrypt from 'bcryptjs';
import {
  listarUsuarios,
  crearPersonaYUsuario,
  actualizarUsuario,
  eliminarUsuario,
  listarEspecialidadesActivas,
} from '../repositories/usuarioRepository.js';
import { traducirError } from '../lib/errorMessages.js';

const CI_REGEX = /^[0-9]{5,10}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function obtenerUsuarios() {
  const usuarios = await listarUsuarios();
  return { ok: true, status: 200, usuarios };
}

export async function obtenerEspecialidades() {
  const especialidades = await listarEspecialidadesActivas();
  return { ok: true, status: 200, especialidades };
}

export async function registrarUsuario(payload) {
  const { nombre, apellido, fecha_nac, sexo, telefono, ci, correo, contrasena, rol, estado = 'activo', nro_licencia, id_especialidad } = payload || {};

  const errores = {};
  if (!nombre || nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (!apellido || apellido.trim().length < 2) errores.apellido = 'El apellido es obligatorio.';
  if (!ci || !CI_REGEX.test(ci)) errores.ci = 'El CI debe tener entre 5 y 10 dígitos.';
  if (!correo || !CORREO_REGEX.test(correo)) errores.correo = 'El formato del correo no es válido.';
  if (!contrasena || contrasena.length < 6) errores.contrasena = 'La contraseña debe tener al menos 6 caracteres.';
  if (!rol) errores.rol = 'El rol es obligatorio.';

  if (rol === 'medico') {
    if (!nro_licencia || !String(nro_licencia).trim()) errores.nro_licencia = 'El número de licencia es obligatorio.';
    if (!id_especialidad) errores.id_especialidad = 'La especialidad es obligatoria.';
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  try {
    await crearPersonaYUsuario({
      nombre, apellido, fecha_nac, sexo, telefono, ci, correo, contrasenaHash, rol, estado, nro_licencia, id_especialidad,
    });
    return { ok: true, status: 201, mensaje: 'Usuario registrado correctamente.' };
  } catch (err) {
    if (err.message === 'DUPLICADO_NRO_LICENCIA') {
      return { ok: false, status: 400, errores: { nro_licencia: 'Ya existe un médico registrado con ese número de licencia.' } };
    }
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function editarUsuario(id_usuario, payload) {
  const { nombre, apellido, telefono, fecha_nac, sexo, ci, correo, rol, estado, contrasena, nro_licencia, id_especialidad } = payload || {};

  if (!id_usuario) {
    return { ok: false, status: 400, errores: { general: 'ID de usuario requerido.' } };
  }

  if (rol === 'medico') {
    const errores = {};
    if (!nro_licencia || !String(nro_licencia).trim()) errores.nro_licencia = 'El número de licencia es obligatorio.';
    if (!id_especialidad) errores.id_especialidad = 'La especialidad es obligatoria.';
    if (Object.keys(errores).length > 0) return { ok: false, status: 400, errores };
  }

  try {
    const datos = { nombre, apellido, telefono, fecha_nac, sexo, correo, rol, estado };
    if (nro_licencia !== undefined) datos.nro_licencia = nro_licencia;
    if (id_especialidad !== undefined) datos.id_especialidad = id_especialidad;

    if (ci || correo) {
      const actual = await listarUsuarios();
      const usuarioActual = (actual || []).find((u) => u.id_usuario === Number(id_usuario));
      if (ci && (!usuarioActual || String(usuarioActual.ci || '') !== String(ci))) datos.ci = ci;
      if (correo && (!usuarioActual || String(usuarioActual.correo || '').toLowerCase() !== String(correo).toLowerCase())) datos.correo = correo;
    }

    if (contrasena && contrasena.length >= 6) {
      datos.contrasenaHash = await bcrypt.hash(contrasena, 10);
    } else if (contrasena === '') {
      datos.contrasenaHash = '';
    }
    await actualizarUsuario(id_usuario, datos);
    return { ok: true, status: 200, mensaje: 'Usuario actualizado correctamente.' };
  } catch (err) {
    if (err.message === 'DUPLICADO_NRO_LICENCIA') {
      return { ok: false, status: 400, errores: { nro_licencia: 'Ya existe un médico registrado con ese número de licencia.' } };
    }
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function borrarUsuario(id_usuario) {
  try {
    await eliminarUsuario(id_usuario);
    return { ok: true, status: 200, mensaje: 'Usuario eliminado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}