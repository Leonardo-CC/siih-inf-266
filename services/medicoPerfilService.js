// services/medicoPerfilService.js
// ============================================================
// CAPA DE LOGICA - Edicion de perfil del medico.
// Campos editables: correo, telefono, contrasena.
// CAMPOS BLOQUEADOS: ci, rol, nombre, apellido, nro_licencia, especialidad.
// ============================================================
import bcrypt from 'bcryptjs';
import { buscarUsuarioPorCiOCorreo } from '../repositories/pacienteRepository.js';
import { leerContrasenaPorPersona, actualizarContrasenaPorPersona } from '../repositories/authRepository.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function obtenerPerfilMedico(id_medico) {
  if (!id_medico) {
    return { ok: false, status: 400, mensaje: 'Falta el identificador del médico.' };
  }
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select('id_medico, persona_id, nro_licencia, especialidad_antigua, persona:persona_id (nombre, apellido, telefono), especialidad:id_especialidad (nombre)')
    .eq('id_medico', id_medico)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 404, mensaje: 'No se encontró el perfil del médico.' };
  }

  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('ci, correo, rol')
    .eq('persona_id', data.persona_id)
    .maybeSingle();

  return {
    ok: true,
    status: 200,
    perfil: {
      id_medico: data.id_medico,
      persona_id: data.persona_id,
      nro_licencia: data.nro_licencia,
      especialidad: data.especialidad?.nombre || data.especialidad_antigua || 'General',
      nombre: data.persona?.nombre || '',
      apellido: data.persona?.apellido || '',
      telefono: data.persona?.telefono || '',
      ci: usuario?.ci || '',
      correo: usuario?.correo || '',
      rol: usuario?.rol || '',
    },
  };
}

export async function actualizarPerfilMedico(id_medico, payload = {}) {
  if (!id_medico) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador del médico.' } };
  }

  const perfilActual = await obtenerPerfilMedico(id_medico);
  if (!perfilActual.ok) {
    return { ok: false, status: 404, errores: { general: perfilActual.mensaje } };
  }

  const p = perfilActual.perfil;
  const correo = (payload.correo || '').trim();
  const telefono = (payload.telefono || '').trim();
  const contrasenaActual = payload.contrasenaActual || '';
  const contrasenaNueva = payload.contrasenaNueva || '';

  const errores = {};

  if (!correo || !CORREO_REGEX.test(correo)) {
    errores.correo = 'El formato del correo no es válido.';
  }

  if (correo && correo.toLowerCase() !== p.correo?.toLowerCase()) {
    const duplicados = await buscarUsuarioPorCiOCorreo(p.ci, correo);
    if (duplicados && duplicados.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      errores.correo = 'Ya existe otro usuario registrado con este correo.';
    }
  }

  let contrasenaHash = null;
  if (contrasenaNueva) {
    if (contrasenaNueva.length < 6) {
      errores.contrasenaNueva = 'La nueva contraseña debe tener al menos 6 caracteres.';
    }
    const { hash: hashActual, error: errorLectura } = await leerContrasenaPorPersona(p.persona_id);
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
    const { data: medico } = await supabaseAdmin
      .from('medico')
      .select('persona_id')
      .eq('id_medico', id_medico)
      .single();

    if (medico) {
      const updatesPersona = {};
      if (telefono !== undefined) updatesPersona.telefono = telefono || null;
      if (Object.keys(updatesPersona).length > 0) {
        const { error } = await supabaseAdmin
          .from('persona')
          .update(updatesPersona)
          .eq('persona_id', medico.persona_id);
        if (error) throw new Error(`Error actualizando persona: ${error.message}`);
      }

      const { data: usuario } = await supabaseAdmin
        .from('usuario')
        .select('id_usuario')
        .eq('persona_id', medico.persona_id)
        .single();

      if (usuario && correo !== undefined && correo !== '') {
        const { error } = await supabaseAdmin
          .from('usuario')
          .update({ correo })
          .eq('persona_id', medico.persona_id);
        if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
      }

      if (contrasenaHash) {
        const { error: errorUpdate } = await actualizarContrasenaPorPersona(medico.persona_id, contrasenaHash);
        if (errorUpdate) throw new Error(`Error actualizando contraseña: ${errorUpdate.message}`);
      }
    }

    const perfilActualizado = await obtenerPerfilMedico(id_medico);
    return {
      ok: true,
      status: 200,
      mensaje: 'Perfil actualizado correctamente.',
      perfil: perfilActualizado.perfil,
    };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

export async function recuperarContrasenaMedico({ ci, correo, nuevaContrasena }) {
  if (!ci || !correo || !nuevaContrasena) {
    return { ok: false, status: 400, errores: { general: 'Faltan datos para recuperar la contraseña.' } };
  }
  if (nuevaContrasena.length < 6) {
    return { ok: false, status: 400, errores: { contrasena: 'La nueva contraseña debe tener al menos 6 caracteres.' } };
  }

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
  const { error: errorUpdate } = await actualizarContrasenaPorPersona(usuario.persona_id, hash);

  if (errorUpdate) {
    return { ok: false, status: 400, errores: { general: errorUpdate.message } };
  }

  return { ok: true, status: 200, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}
