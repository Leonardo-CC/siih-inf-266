// services/adminService.js
// ============================================================
// CAPA DE LOGICA - Perfil del administrativo.
// ============================================================
import bcrypt from 'bcryptjs';
import { obtenerPerfilAdmin, actualizarPerfilAdmin } from '../repositories/adminRepository.js';
import { traducirError } from '../lib/errorMessages.js';

export async function obtenerMiPerfil(id_usuario) {
  const perfil = await obtenerPerfilAdmin(id_usuario);
  return { ok: true, status: 200, perfil };
}

export async function actualizarMiPerfil(id_usuario, payload) {
  const { correo, contrasenaActual, contrasenaNueva, nombre, apellido, telefono } = payload || {};

  if (!id_usuario) {
    return { ok: false, status: 400, errores: { general: 'ID de usuario requerido.' } };
  }

  const perfil = await obtenerPerfilAdmin(id_usuario);

  if (contrasenaNueva) {
    if (contrasenaNueva.length < 6) {
      return { ok: false, status: 400, errores: { contrasenaNueva: 'La contraseña debe tener al menos 6 caracteres.' } };
    }
    if (contrasenaNueva !== payload.repetirContrasena) {
      return { ok: false, status: 400, errores: { repetirContrasena: 'Las contraseñas no coinciden.' } };
    }
    if (!contrasenaActual) {
      return { ok: false, status: 400, errores: { contrasenaActual: 'Ingresa tu contraseña actual para confirmar el cambio.' } };
    }
    const passwordOk = await bcrypt.compare(contrasenaActual, perfil.contrasena_hash || '');
    if (!passwordOk) {
      return { ok: false, status: 400, errores: { contrasenaActual: 'La contraseña actual es incorrecta.' } };
    }
  }

  try {
    const datos = { correo, nombre, apellido, telefono };
    if (contrasenaNueva) {
      datos.contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
    }
    await actualizarPerfilAdmin(id_usuario, datos);
    return { ok: true, status: 200, mensaje: 'Perfil actualizado correctamente.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: traducirError(err) } };
  }
}
