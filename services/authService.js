// services/authService.js
// ============================================================
// CAPA DE LOGICA - Login del SIIH.
// Valida usuario activo y compara contraseña con bcrypt.
// ============================================================
import bcrypt from 'bcryptjs';
import {
  buscarUsuarioLogin,
  obtenerIdEnfermeroPorPersona,
  obtenerIdMedicoPorPersona,
} from '../repositories/authRepository.js';

export async function iniciarSesion(payload = {}) {
  const correo = payload.correo?.trim().toLowerCase();
  const contrasena = payload.contrasena || payload.contraseña || '';

  if (!correo || !contrasena) {
    return {
      ok: false,
      status: 400,
      errores: { general: 'Ingresa correo y contraseña.' },
    };
  }

  const usuario = await buscarUsuarioLogin(correo);

  if (!usuario || !usuario.contrasena_hash) {
    return {
      ok: false,
      status: 401,
      errores: { general: 'Correo o contraseña incorrectos.' },
    };
  }

  if (usuario.estado !== 'activo') {
    return {
      ok: false,
      status: 403,
      errores: { general: 'El usuario se encuentra inactivo.' },
    };
  }

  const passwordOk = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!passwordOk) {
    return {
      ok: false,
      status: 401,
      errores: { general: 'Correo o contraseña incorrectos.' },
    };
  }

  // Resolver el identificador de rol especifico para poder filtrar vistas.
  let id_enfermero = null;
  let id_medico = null;
  if (usuario.rol === 'enfermero') {
    id_enfermero = await obtenerIdEnfermeroPorPersona(usuario.persona_id);
  } else if (usuario.rol === 'medico') {
    id_medico = await obtenerIdMedicoPorPersona(usuario.persona_id);
  }

  return {
    ok: true,
    status: 200,
    mensaje: 'Sesion iniciada correctamente.',
    usuario: {
      id_usuario: usuario.id_usuario,
      persona_id: usuario.persona_id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombre_completo: `${usuario.nombre} ${usuario.apellido}`.trim(),
      id_enfermero,
      id_medico,
    },
  };
}
