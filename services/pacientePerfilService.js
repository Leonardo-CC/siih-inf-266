// services/pacientePerfilService.js
// ============================================================
// CAPA DE LOGICA - Edicion de perfil del paciente.
// El paciente puede cambiar: correo, contrasena, telefono,
// tipo_seguro y numero_seguro.
// CAMPOS BLOQUEADOS (no editables por seguridad/integridad):
//   - ci        (dato de identidad unico, no modificable)
//   - rol       (no puede autoasignar otro rol)
//   - nombre/apellido (se mantienen segun registro del hospital)
// ============================================================
import bcrypt from 'bcryptjs';
import {
  actualizarPaciente,
  buscarUsuarioPorCiOCorreo,
} from '../repositories/pacienteRepository.js';
import { obtenerPerfilPaciente } from '../repositories/pacienteDashboardRepository.js';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function obtenerPerfil(id_paciente) {
  if (!id_paciente) {
    return { ok: false, status: 400, mensaje: 'Falta el identificador del paciente.' };
  }
  const perfil = await obtenerPerfilPaciente(id_paciente);
  if (!perfil) {
    return { ok: false, status: 404, mensaje: 'No se encontro el perfil del paciente.' };
  }
  return { ok: true, status: 200, perfil };
}

export async function actualizarPerfilPaciente(id_paciente, payload = {}) {
  if (!id_paciente) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador del paciente.' } };
  }

  const perfilActual = await obtenerPerfilPaciente(id_paciente);
  if (!perfilActual) {
    return { ok: false, status: 404, errores: { general: 'No se encontro el perfil del paciente.' } };
  }

  // ---- Campos editables ----
  const correo = (payload.correo || '').trim();
  const telefono = (payload.telefono || '').trim();
  const tipo_seguro = payload.tipo_seguro ?? perfilActual.tipo_seguro;
  const numero_seguro = (payload.numero_seguro || '').trim();
  const contrasenaActual = payload.contrasenaActual || '';
  const contrasenaNueva = payload.contrasenaNueva || '';

  const errores = {};

  if (!correo || !CORREO_REGEX.test(correo)) {
    errores.correo = 'El formato del correo no es valido.';
  }

  // Validar unicidad del correo solo si cambio
  if (correo && correo.toLowerCase() !== perfilActual.correo.toLowerCase()) {
    const duplicados = await buscarUsuarioPorCiOCorreo(perfilActual.ci, correo);
    if (duplicados && duplicados.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      errores.correo = 'Ya existe otro usuario registrado con este correo.';
    }
  }

  // ---- Contrasena ----
  let contrasenaHash = null;
  if (contrasenaNueva) {
    if (contrasenaNueva.length < 6) {
      errores.contrasenaNueva = 'La nueva contrasena debe tener al menos 6 caracteres.';
    }
    // Verificar contrasena actual contra el hash almacenado
    const { data: usuario } = await supabaseUsuario(perfilActual.persona_id);
    if (!usuario || !usuario.contrasena) {
      errores.general = 'No se pudo verificar la contrasena actual.';
    } else {
      const coincide = await bcrypt.compare(contrasenaActual, usuario.contrasena);
      if (!coincide) {
        errores.contrasenaActual = 'La contrasena actual no es correcta.';
      } else {
        contrasenaHash = await bcrypt.hash(contrasenaNueva, 10);
      }
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, status: 400, errores };
  }

  try {
    await actualizarPaciente(id_paciente, {
      nombre: perfilActual.nombre,
      apellido: perfilActual.apellido,
      ci: perfilActual.ci,
      correo,
      telefono,
      tipo_seguro,
      numero_seguro,
    });

    if (contrasenaHash) {
      await actualizarContrasena(perfilActual.persona_id, contrasenaHash);
    }

    const perfilActualizado = await obtenerPerfilPaciente(id_paciente);
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

// ---- Helpers de acceso directo a usuario (contrasena) ----
// Se importa supabaseAdmin dinamicamente para no romper el repositorio original.
async function supabaseUsuario(persona_id) {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  const { data } = await supabaseAdmin
    .from('usuario')
    .select('contrasena')
    .eq('persona_id', persona_id)
    .maybeSingle();
  return { data };
}

async function actualizarContrasena(persona_id, hash) {
  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  const { error } = await supabaseAdmin
    .from('usuario')
    .update({ contrasena: hash })
    .eq('persona_id', persona_id);
  if (error) throw new Error(`Error actualizando la contrasena: ${error.message}`);
}

// ---- Recuperacion de contrasena ----
// El paciente verifica su identidad con CI + correo y define una nueva
// contrasena directamente (flujo de auto-recuperacion sin email).
export async function recuperarContrasena({ ci, correo, nuevaContrasena }) {
  if (!ci || !correo || !nuevaContrasena) {
    return { ok: false, status: 400, errores: { general: 'Faltan datos para recuperar la contrasena.' } };
  }
  if (nuevaContrasena.length < 6) {
    return { ok: false, status: 400, errores: { contrasena: 'La nueva contrasena debe tener al menos 6 caracteres.' } };
  }

  const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
  const { data: usuario, error } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, ci, correo')
    .eq('ci', ci)
    .eq('correo', correo)
    .maybeSingle();

  if (error) return { ok: false, status: 500, errores: { general: err.message } };
  if (!usuario) {
    return { ok: false, status: 404, errores: { general: 'No se encontro una cuenta con ese CI y correo.' } };
  }

  const hash = await bcrypt.hash(nuevaContrasena, 10);
  try {
    await actualizarContrasena(usuario.persona_id, hash);
    return { ok: true, status: 200, mensaje: 'Contrasena actualizada. Ya puedes iniciar sesion.' };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}
