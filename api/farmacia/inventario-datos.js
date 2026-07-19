// api/farmacia/inventario-datos.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  try {
    // Usamos el poder de Supabase para traer el medicamento y TODOS sus lotes anidados en una sola consulta
    const { data: medicamentos, error: errMed } = await supabaseAdmin
      .from('medicamento')
      .select(`
        *,
        lote_medicamento (
          id_lote,
          numero_lote,
          cantidad_inicial,
          cantidad_actual,
          fecha_ingreso,
          fecha_vencimiento
        )
      `)
      .order('nombre');

    const { data: proveedores, error: errProv } = await supabaseAdmin
      .from('proveedor')
      .select('*')
      .order('nombre');

    if (errMed) throw errMed;
    if (errProv) throw errProv;

    return res.status(200).json({ ok: true, medicamentos, proveedores });
  } catch (error) {
    console.error("Error obteniendo datos de inventario:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al cargar el inventario" });
  }
}