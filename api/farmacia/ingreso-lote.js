// api/farmacia/ingreso-lote.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const { id_medicamento, id_proveedor, numero_lote, cantidad, fecha_vencimiento } = req.body;

  try {
    // ESCUDO 1: Verificar si el lote ya existe (Anti-Doble Clic)
    // Usamos maybeSingle() para que no lance error si es la primera vez que se ingresa
    const { data: loteExistente } = await supabaseAdmin
      .from('lote_medicamento')
      .select('id_lote')
      .eq('numero_lote', numero_lote)
      .eq('id_medicamento', id_medicamento)
      .maybeSingle();

    if (loteExistente) {
      return res.status(400).json({ 
        ok: false, 
        mensaje: `El lote ${numero_lote} ya está registrado para este medicamento. Revisa el historial.` 
      });
    }

    // 1. Insertar el registro físico en la tabla lote_medicamento
    // EL TRIGGER ACTÚA AQUÍ: En cuanto esta inserción termina, Supabase 
    // ejecuta trg_sincronizar_stock y actualiza la tabla 'medicamento' en automático.
    const { error: errLote } = await supabaseAdmin
      .from('lote_medicamento')
      .insert([{
        id_medicamento: id_medicamento,
        id_proveedor: id_proveedor,
        numero_lote: numero_lote,
        cantidad_inicial: cantidad,
        cantidad_actual: cantidad, 
        fecha_vencimiento: fecha_vencimiento
      }]);

    if (errLote) throw errLote;

    return res.status(200).json({ ok: true, mensaje: 'Lote ingresado y stock actualizado correctamente.' });
  } catch (error) {
    console.error("Error al ingresar lote:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al guardar el lote." });
  }
}