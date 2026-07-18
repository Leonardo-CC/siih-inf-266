// repositories/citaRepository.js
// ============================================================
// CAPA DE DATOS — HU-03 / RF03: Solicitud de cita médica
// Acceso directo a las tablas medico / persona / cita.
// Este archivo NO contiene reglas de negocio, solo queries,
// siguiendo el mismo patrón que pacienteRepository.js.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// Lista de especialidades distintas ofrecidas (para el primer selector del formulario).
// Retorna array de nombres (strings) para compatibilidad con frontend.
export async function obtenerEspecialidades() {
  const { data, error } = await supabaseAdmin
    .from('especialidad')
    .select('nombre')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener especialidades: ${error.message}`);

  return (data || []).map((e) => e.nombre);
}

// Médicos de una especialidad, con nombre completo (join a persona vía persona_id y especialidad).
// especialidad: nombre de especialidad (string), ej. "Cardiología"
export async function obtenerMedicosPorEspecialidad(especialidad) {
  if (!especialidad) {
    return [];
  }

  // Obtener el id_especialidad a partir del nombre
  const { data: esps, error: errEsp } = await supabaseAdmin
    .from('especialidad')
    .select('id_especialidad')
    .eq('nombre', especialidad)
    .eq('estado', 'activo')
    .single();

  if (errEsp || !esps) {
    return [];
  }

  // Obtener médicos de esa especialidad
  const { data, error } = await supabaseAdmin
    .from('medico')
    .select('id_medico, nro_licencia, id_especialidad, especialidad:id_especialidad (nombre, tarifa), persona:persona_id (nombre, apellido)')
    .eq('id_especialidad', esps.id_especialidad);

  if (error) throw new Error(`Error al obtener médicos: ${error.message}`);

  return (data || []).map((m) => ({
    id_medico: m.id_medico,
    nro_licencia: m.nro_licencia,
    id_especialidad: m.id_especialidad,
    especialidad: m.especialidad?.nombre || 'Desconocida',
    tarifa: m.especialidad?.tarifa || 200.00,
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

// Obtiene todas las citas de un médico para un día específico o un rango de fechas.
// Incluye información del paciente y especialidad.
export async function obtenerCitasPorMedico(id_medico, fechaInicio, fechaFin) {
  const { data, error } = await supabaseAdmin
    .from('cita')
    .select(
      `id_cita, 
       fecha_hora, 
       estado, 
       motivo,
       estado_pago,
       id_paciente,
       id_medico,
       paciente:id_paciente (
         id_paciente,
         persona_id,
         persona:persona_id (nombre, apellido, telefono, fecha_nac, sexo)
       ),
       medico:id_medico (
         id_medico,
         id_especialidad,
         especialidad:id_especialidad (nombre, tarifa),
         persona:persona_id (nombre, apellido)
       )`
    )
    .eq('id_medico', id_medico)
    .gte('fecha_hora', fechaInicio)
    .lte('fecha_hora', fechaFin)
    .neq('estado', 'cancelada')
    .order('fecha_hora', { ascending: true });

  if (error) throw new Error(`Error al obtener citas del médico: ${error.message}`);
  return data || [];
}
