import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerConsultaParaHospitalizacion(id_consulta) {
  if (!id_consulta) return null;

  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_cita, id_paciente, id_medico, motivo_consulta')
    .eq('id_consulta', id_consulta)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la consulta: ${error.message}`);
  return data || null;
}

export async function obtenerCitaParaHospitalizacion(id_cita) {
  if (!id_cita) return null;

  const { data, error } = await supabaseAdmin
    .from('cita')
    .select('id_cita, id_paciente, id_medico, motivo')
    .eq('id_cita', id_cita)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener la cita: ${error.message}`);
  return data || null;
}

export async function crearHospitalizacionClinica(payload) {
  const { data, error } = await supabaseAdmin
    .from('hospitalizacion')
    .insert([payload])
    .select('id_hospitalizacion, id_consulta, id_paciente, id_medico, motivo_ingreso, fecha_ingreso, estado')
    .single();

  if (error) throw new Error(`Error registrando hospitalizacion: ${error.message}`);
  return data;
}
