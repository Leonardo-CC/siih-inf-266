// api/farmacia/ingreso-lote.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const { id_medicamento, id_proveedor, numero_lote, cantidad, fecha_vencimiento } = req.body;

  try {
    // 1. Insertar el registro físico en la tabla lote_medicamento
    // Esto es lo que le faltaba a tu código anterior para que salieran en el desplegable
    const { error: errLote } = await supabaseAdmin
      .from('lote_medicamento')
      .insert([{
        id_medicamento: id_medicamento,
        id_proveedor: id_proveedor,
        numero_lote: numero_lote,
        cantidad_inicial: cantidad,
        cantidad_actual: cantidad, // Nace con la cantidad inicial
        fecha_vencimiento: fecha_vencimiento
      }]);

    if (errLote) throw errLote;

    // 2. Obtener el stock actual del medicamento para sumarlo
    const { data: med, error: errMed } = await supabaseAdmin
      .from('medicamento')
      .select('stock_actual')
      .eq('id_medicamento', id_medicamento)
      .single();

    if (errMed) throw errMed;

    // 3. Actualizar el stock global sumando la nueva cantidad
    const nuevoStock = med.stock_actual + cantidad;
    
    const { error: errUpdate } = await supabaseAdmin
      .from('medicamento')
      .update({ stock_actual: nuevoStock })
      .eq('id_medicamento', id_medicamento);

    if (errUpdate) throw errUpdate;

    return res.status(200).json({ ok: true, mensaje: 'Lote ingresado y stock actualizado correctamente.' });
  } catch (error) {
    console.error("Error al ingresar lote:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al guardar el lote." });
  }
}