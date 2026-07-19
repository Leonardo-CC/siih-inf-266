// api/paciente/historial.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const { id_paciente } = req.query;

  if (!id_paciente) {
    return res.status(400).json({ ok: false, mensaje: 'Falta el ID del paciente' });
  }

  try {
    // Magia de Supabase: Cruzamos 6 tablas de una sola vez
    const { data: historial, error } = await supabaseAdmin
      .from('consulta')
      .select(`
        id_consulta,
        fecha_consulta,
        motivo_consulta,
        medico (
          especialidad,
          persona (nombre, apellido)
        ),
        historial_clinico (
          id_historial,
          diagnostico,
          observaciones,
          alergias,
          receta (
            estado,
            detalle_receta (
              dosis,
              frecuencia,
              duracion,
              medicamento (nombre)
            )
          )
        )
      `)
      .eq('id_paciente', id_paciente)
      .order('fecha_consulta', { ascending: false }); // Más recientes primero

    if (error) throw error;

    // Filtramos para asegurar que solo enviamos consultas que el médico ya finalizó
    // (es decir, que ya tienen un registro en historial_clinico)
    const consultasCompletadas = historial.filter(h => h.historial_clinico != null);

    return res.status(200).json({ ok: true, datos: consultasCompletadas });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
}