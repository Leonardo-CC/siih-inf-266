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
const ROLES_CON_DOCUMENTO_UNIVERSITARIO = ['paciente', 'medico', 'enfermero', 'farmaceutico', 'administrativo', 'tecnico_laboratorio'];

export async function obtenerUsuarios() {
  const usuarios = await listarUsuarios();
  return { ok: true, status: 200, usuarios };
}

export async function obtenerEspecialidades() {
  const especialidades = await listarEspecialidadesActivas();
  return { ok: true, status: 200, especialidades };
}

function validarPayloadUsuario(payload, { requiereContrasena }) {
  const {
    nombre,
    apellido,
    ci,
    correo,
    contrasena,
    rol,
    id_area,
    nro_licencia,
    numero_licencia,
    id_especialidad,
    especialidad_laboratorio,
    area_servicio,
    cargo,
    codigo_universitario,
    documento_validacion_url,
  } = payload || {};

  const errores = {};
  if (!nombre || nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (!apellido || apellido.trim().length < 2) errores.apellido = 'El apellido es obligatorio.';
  if (!ci || !CI_REGEX.test(ci)) errores.ci = 'El CI debe tener entre 5 y 10 digitos.';
  if (!correo || !CORREO_REGEX.test(correo)) errores.correo = 'El formato del correo no es valido.';
  if (requiereContrasena && (!contrasena || contrasena.length < 6)) errores.contrasena = 'La contrasena debe tener al menos 6 caracteres.';
  if (!rol) errores.rol = 'El rol es obligatorio.';
  if (!id_area) errores.id_area = 'Selecciona la facultad o area.';

  if (['medico', 'farmaceutico'].includes(rol) && (!nro_licencia || !String(nro_licencia).trim())) {
    errores.nro_licencia = 'El numero de licencia es obligatorio.';
  }
  if (rol === 'medico' && !id_especialidad) errores.id_especialidad = 'La especialidad es obligatoria.';
  if (rol === 'tecnico_laboratorio') {
    if (!numero_licencia || !String(numero_licencia).trim()) errores.numero_licencia = 'El numero de licencia es obligatorio.';
    if (!especialidad_laboratorio || !String(especialidad_laboratorio).trim()) errores.especialidad_laboratorio = 'La especialidad de laboratorio es obligatoria.';
  }
  if (rol === 'enfermero' && (!area_servicio || !String(area_servicio).trim())) {
    errores.area_servicio = 'El area o servicio de enfermeria es obligatorio.';
  }
  if (rol === 'administrativo' && (!cargo || !String(cargo).trim())) {
    errores.cargo = 'El cargo administrativo es obligatorio.';
  }
  if (ROLES_CON_DOCUMENTO_UNIVERSITARIO.includes(rol)) {
    if (!codigo_universitario || !String(codigo_universitario).trim()) {
      errores.codigo_universitario = 'El codigo, item o matricula es obligatorio.';
    }
    if (!documento_validacion_url || !String(documento_validacion_url).trim()) {
      errores.documento_validacion_url = 'El documento de respaldo es obligatorio.';
    }
  }

  return errores;
}

function datosEspecializacion(payload) {
  const {
    nro_licencia,
    numero_licencia,
    id_especialidad,
    especialidad_laboratorio,
    area_servicio,
    cargo,
    id_area,
    codigo_universitario,
    documento_validacion_tipo,
    documento_validacion_url,
    documento_validacion_estado,
  } = payload || {};

  return {
    nro_licencia,
    numero_licencia,
    id_especialidad,
    especialidad_laboratorio,
    area_servicio,
    cargo,
    id_area,
    codigo_universitario,
    documento_validacion_tipo,
    documento_validacion_url,
    documento_validacion_estado,
  };
}

export async function registrarUsuario(payload) {
  const errores = validarPayloadUsuario(payload, { requiereContrasena: true });
  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  const {
    nombre,
    apellido,
    fecha_nac,
    sexo,
    telefono,
    ci,
    correo,
    contrasena,
    rol,
    id_area,
    estado = 'activo',
  } = payload || {};

  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  try {
    await crearPersonaYUsuario({
      nombre,
      apellido,
      fecha_nac,
      sexo,
      telefono,
      ci,
      correo,
      contrasenaHash,
      rol,
      estado,
      ...datosEspecializacion(payload),
    });
    return { ok: true, status: 201, mensaje: 'Usuario registrado correctamente.' };
  } catch (err) {
    if (err.message === 'DUPLICADO_NRO_LICENCIA') {
      return { ok: false, status: 400, errores: { nro_licencia: 'Ya existe un usuario registrado con ese numero de licencia.' } };
    }
    if (err.message === 'DUPLICADO_NUMERO_LICENCIA') {
      return { ok: false, status: 400, errores: { numero_licencia: 'Ya existe un tecnico registrado con ese numero de licencia.' } };
    }
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}

export async function editarUsuario(id_usuario, payload) {
  if (!id_usuario) {
    return { ok: false, status: 400, errores: { general: 'ID de usuario requerido.' } };
  }

  const errores = validarPayloadUsuario(payload, { requiereContrasena: false });
  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  const { nombre, apellido, telefono, fecha_nac, sexo, ci, correo, rol, estado, contrasena } = payload || {};

  try {
    const datos = {
      nombre,
      apellido,
      telefono,
      fecha_nac,
      sexo,
      correo,
      rol,
      estado,
      ...datosEspecializacion(payload),
    };

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
      return { ok: false, status: 400, errores: { nro_licencia: 'Ya existe un usuario registrado con ese numero de licencia.' } };
    }
    if (err.message === 'DUPLICADO_NUMERO_LICENCIA') {
      return { ok: false, status: 400, errores: { numero_licencia: 'Ya existe un tecnico registrado con ese numero de licencia.' } };
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
