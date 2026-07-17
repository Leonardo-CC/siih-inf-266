// repositories/citaRepository.js
// ============================================================
// CAPA DE DATOS — HU-03 / RF03: Solicitud de cita médica
// Acceso directo a las tablas medico / persona / cita.
// Este archivo NO contiene reglas de negocio, solo queries,
// siguiendo el mismo patrón que pacienteRepository.js.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// Lista de especialidades distintas ofrecidas (para el primer selector del formulario).
export async function obtenerEspecialidades() {
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select('especialidad')
    .order('especialidad', { ascending: true });

  if (error) throw new Error(`Error al obtener especialidades: ${error.message}`);

  // dedupe en JS porque Supabase/PostgREST no tiene DISTINCT directo vía select simple
  return [...new Set((data || []).map((m) => m.especialidad))];
}

// Médicos de una especialidad, con nombre completo (join a persona vía persona_id).
// NOTA: requiere que exista la FK medico.persona_id -> persona.persona_id
// para que el embed `persona:persona_id (...)` funcione.
export async function obtenerMedicosPorEspecialidad(especialidad) {
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select('id_medico, nro_licencia, especialidad, persona:persona_id (nombre, apellido)')
    .eq('especialidad', especialidad);

  if (error) throw new Error(`Error al obtener médicos: ${error.message}`);

  return (data || []).map((m) => ({
    id_medico: m.id_medico,
    nro_licencia: m.nro_licencia,
    especialidad: m.especialidad,
    nombre_completo: m.persona
      ? `Dr(a). ${m.persona.nombre} ${m.persona.apellido}`
      : `Médico #${m.id_medico}`,
  }));
}

// Horas (fecha_hora) ya ocupadas para un médico en un rango [inicioISO, finISO).
// Se excluyen las citas 'cancelada' porque liberan el horario.
export async function obtenerCitasOcupadas(id_medico, inicioISO, finISO) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('fecha_hora, estado')
    .eq('id_medico', id_medico)
    .gte('fecha_hora', inicioISO)
    .lt('fecha_hora', finISO)
    .neq('estado', 'cancelada');

  if (error) throw new Error(`Error al obtener horarios ocupados: ${error.message}`);
  return (data || []).map((c) => c.fecha_hora);
}

// Verificación puntual justo antes de insertar (evita condición de carrera si dos
// pacientes solicitan el mismo slot casi al mismo tiempo).
export async function existeCitaEnHorario(id_medico, fecha_hora) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('id_cita')
    .eq('id_medico', id_medico)
    .eq('fecha_hora', fecha_hora)
    .neq('estado', 'cancelada');

  if (error) throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  return Boolean(data && data.length > 0);
}

// Inserta la cita con estado inicial 'pendiente' (RF03: "deja estado visible").
export async function crearCita({ id_paciente, id_medico, fecha_hora, motivo }) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .insert([
      {
        id_paciente,
        id_medico,
        fecha_hora,
        motivo: motivo || null,
        estado: 'pendiente',
      },
    ])
    .select('id_cita, fecha_hora, estado')
    .single();

  if (error) throw new Error(`Error al crear la cita: ${error.message}`);
  return data;
}