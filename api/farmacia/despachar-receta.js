// api/farmacia/despachar-receta.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { enviarAlertaTelegram } from '../../services/telegramService.js'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  
  const { id_receta } = req.body;

  try {
    const { data: receta, error: errReceta } = await supabaseAdmin
      .from('receta')
      .select('id_receta, detalle_receta ( id_medicamento, cantidad )')
      .eq('id_receta', id_receta)
      .single();

    if (errReceta || !receta) throw new Error('Receta no encontrada');

    // 🛡️ ESCUDO 1: VERIFICAR ANTES DE TOCAR NADA
    for (const detalle of receta.detalle_receta) {
      const { data: medGlobal } = await supabaseAdmin
        .from('medicamento')
        .select('nombre, stock_actual, stock_minimo')
        .eq('id_medicamento', detalle.id_medicamento)
        .single();

      if (medGlobal.stock_actual < detalle.cantidad) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: `Stock insuficiente para ${medGlobal.nombre}. Se piden ${detalle.cantidad}, pero solo hay ${medGlobal.stock_actual}.` 
        });
      }
    }

    // Si pasamos el Escudo 1, significa que sí alcanza para todos los medicamentos.
    // Ahora sí aplicamos el BUCLE FEFO:
    for (const detalle of receta.detalle_receta) {
      let cantidadFaltante = detalle.cantidad;

      // Traemos al medicamento para la alerta de Telegram y actualizar global
      const { data: med } = await supabaseAdmin
        .from('medicamento')
        .select('nombre, stock_actual, stock_minimo') 
        .eq('id_medicamento', detalle.id_medicamento)
        .single();

      const { data: lotes } = await supabaseAdmin
        .from('lote_medicamento')
        .select('id_lote, cantidad_actual')
        .eq('id_medicamento', detalle.id_medicamento)
        .gt('cantidad_actual', 0)
        .order('fecha_vencimiento', { ascending: true });

      if (lotes) {
        for (const lote of lotes) {
          if (cantidadFaltante <= 0) break;

          const aDescontar = Math.min(lote.cantidad_actual, cantidadFaltante);
          const stockSobrante = lote.cantidad_actual - aDescontar;
          cantidadFaltante -= aDescontar;

          const { error: errLote } = await supabaseAdmin
            .from('lote_medicamento')
            .update({ cantidad_actual: stockSobrante })
            .eq('id_lote', lote.id_lote);

          if (errLote) throw new Error(`Fallo al descontar del lote ${lote.id_lote}: ${errLote.message}`);
        }
      }

      // Actualizamos el stock global
      const nuevoTotal = med.stock_actual - detalle.cantidad;
      const { error: errMed } = await supabaseAdmin
        .from('medicamento')
        .update({ stock_actual: nuevoTotal })
        .eq('id_medicamento', detalle.id_medicamento);

      if (errMed) throw new Error(`Fallo al actualizar stock global: ${errMed.message}`);

      if (nuevoTotal <= med.stock_minimo) {
        const mensajeTelegram = `<b>ALERTA DE INVENTARIO CRÍTICO</b>\n\nTras el último despacho, el medicamento <b>${med.nombre}</b> requiere atención.\n\n<b>Stock actual:</b> ${nuevoTotal}\n<b>Mínimo requerido:</b> ${med.stock_minimo}`;
        await enviarAlertaTelegram(mensajeTelegram);
      }
    }

    const { error: errFinal } = await supabaseAdmin
      .from('receta')
      .update({ estado: 'despachada' })
      .eq('id_receta', id_receta);

    if (errFinal) throw errFinal;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error en despacho FEFO:", error.message);
    return res.status(500).json({ ok: false, mensaje: error.message }); // Ahora el frontend mostrará el error real
  }
}