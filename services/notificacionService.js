// services/notificacionService.js
// ============================================================
// CAPA DE LÓGICA
// HU-04: Notificaciones automáticas
// ============================================================

import { crearNotificacion } from '../repositories/notificacionRepository.js';

export async function enviarNotificacion({
  id_paciente,
  id_cita = null,
  correo,
  titulo,
  mensaje,
}) {
  try {
    console.log(`
====================================
NOTIFICACIÓN
Para: ${correo || 'Paciente'}
Título: ${titulo}

${mensaje}
====================================
`);

    await crearNotificacion({
      id_paciente,
      id_cita,
      titulo,
      mensaje,
    });

    return true;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return false;
  }
}