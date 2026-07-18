// repositories/notificacionRepository.js
// ============================================================
// CAPA DE DATOS
// Guarda una notificación en la base de datos.
// ============================================================

import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function crearNotificacion({
  id_paciente,
  id_cita = null,
  titulo,
  mensaje,
}) {
  const { data, error } = await supabaseAdmin
    .from('notificacion')
    .insert([
      {
        id_paciente,
        id_cita,
        titulo,
        mensaje,
        tipo: 'Sistema',
        estado: 'pendiente',
        fecha_envio: new Date().toISOString(),
      },
    ])
    .select('id_notificacion')
    .single();

  if (error) {
    throw new Error(`Error al crear notificación: ${error.message}`);
  }

  return data;
}