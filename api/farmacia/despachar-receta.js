// api/farmacia/despachar-receta.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  
  const { id_receta } = req.body;

  try {
    // 1. Obtenemos qué medicamentos y cuántas unidades pide la receta
    const { data: receta, error: errReceta } = await supabaseAdmin
      .from('receta')
      .select('id_receta, detalle_receta ( id_medicamento, cantidad )')
      .eq('id_receta', id_receta)
      .single();

    if (errReceta || !receta) throw new Error('Receta no encontrada');

    // 2. BUCLE FEFO: Por cada medicamento en la receta, buscamos sus lotes
    for (const detalle of receta.detalle_receta) {
      let cantidadFaltante = detalle.cantidad;

      // Pedimos los lotes que AÚN TIENEN STOCK, ordenados por fecha de vencimiento (los más viejos primero)
      const { data: lotes } = await supabaseAdmin
        .from('lote_medicamento')
        .select('id_lote, cantidad_actual')
        .eq('id_medicamento', detalle.id_medicamento)
        .gt('cantidad_actual', 0)
        .order('fecha_vencimiento', { ascending: true });

      if (lotes) {
        for (const lote of lotes) {
          if (cantidadFaltante <= 0) break; // Si ya juntamos las pastillas, detenemos el bucle

          // ¿Cuántas pastillas le podemos sacar a este lote?
          const aDescontar = Math.min(lote.cantidad_actual, cantidadFaltante);
          const stockSobrante = lote.cantidad_actual - aDescontar;
          
          cantidadFaltante -= aDescontar;

          // Actualizamos el lote en la base de datos
          await supabaseAdmin
            .from('lote_medicamento')
            .update({ cantidad_actual: stockSobrante })
            .eq('id_lote', lote.id_lote);
        }
      }

      // 3. Actualizamos también el stock global en la tabla "medicamento"
      const { data: med } = await supabaseAdmin
        .from('medicamento')
        .select('stock_actual')
        .eq('id_medicamento', detalle.id_medicamento)
        .single();

      if (med) {
        const nuevoTotal = Math.max(0, med.stock_actual - detalle.cantidad);
        await supabaseAdmin
          .from('medicamento')
          .update({ stock_actual: nuevoTotal })
          .eq('id_medicamento', detalle.id_medicamento);
      }
    }

    // 4. Cambiamos el estado de la receta para sacarla de la fila
    const { error: errFinal } = await supabaseAdmin
      .from('receta')
      .update({ estado: 'despachada' }) // o 'entregada', según uses
      .eq('id_receta', id_receta);

    if (errFinal) throw errFinal;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error en despacho FEFO:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al procesar el stock" });
  }
}