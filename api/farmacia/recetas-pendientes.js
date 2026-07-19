// api/farmacia/recetas-pendientes.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });

  try {
    // Viajamos por la base de datos usando las relaciones correctas (hacia 'persona')
    const { data, error } = await supabaseAdmin
      .from('receta')
      .select(`
        id_receta,
        fecha_emision,
        observaciones,
        historial_clinico (
          consulta (
            paciente (
              persona ( nombre, apellido, telefono )
            ),
            medico (
              especialidad,
              persona ( nombre, apellido )
            )
          )
        ),
        detalle_receta (
          cantidad,
          dosis,
          frecuencia,
          duracion,
          medicamento ( nombre )
        )
      `)
      .eq('estado', 'pendiente')
      .order('fecha_emision', { ascending: true });

    if (error) throw error;

    // Formateamos los datos para que el Frontend los lea fácil
    const recetasFormateadas = data.map(r => {
      // Extraemos la información desde la tabla persona
      const personaPaciente = r.historial_clinico?.consulta?.paciente?.persona;
      const medicoFull = r.historial_clinico?.consulta?.medico;
      const personaMedico = medicoFull?.persona;
      
      const detalles = (r.detalle_receta || []).map(d => ({
        cantidad: d.cantidad,
        nombre: d.medicamento?.nombre || 'Medicamento',
        dosis: d.dosis,
        frecuencia: d.frecuencia,
        duracion: d.duracion,
      }));

      const resumenMedicamentos = detalles
        .map(d => `${d.cantidad}x ${d.nombre} (${d.dosis})`)
        .join(', ');

      return {
        id_receta: r.id_receta,
        fecha: r.fecha_emision,
        observaciones: r.observaciones,
        paciente: `${personaPaciente?.nombre || ''} ${personaPaciente?.apellido || ''}`.trim() || 'Paciente Anónimo',
        ci_paciente: personaPaciente?.telefono || 'No registrado',
        medico: `${personaMedico?.nombre || ''} ${personaMedico?.apellido || ''}`.trim() || 'Médico General',
        especialidad: medicoFull?.especialidad || 'Medicina General',
        medicamentos: resumenMedicamentos || 'Sin detalles',
        detalles,
      };
    });

    return res.status(200).json({ ok: true, recetas: recetasFormateadas });
  } catch (error) {
    console.error("🔥 ERROR DE SUPABASE:", error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener recetas' });
  }
}