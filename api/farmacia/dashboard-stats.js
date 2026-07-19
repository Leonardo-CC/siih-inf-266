// api/farmacia/dashboard-stats.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const { correo } = req.query; 

  try {
    // 1. OBTENER LICENCIA REAL
    let licencia = 'No registrada';
    if (correo) {
      const { data: usr } = await supabaseAdmin.from('usuario').select('persona_id').eq('correo', correo).single();
      if (usr) {
        const { data: farm } = await supabaseAdmin.from('farmaceutico').select('nro_licencia').eq('persona_id', usr.persona_id).single();
        if (farm && farm.nro_licencia) licencia = farm.nro_licencia;
      }
    }

    // 2. ESTADÍSTICAS DE MEDICAMENTOS Y DONA
    const { data: medicamentos, error: errMed } = await supabaseAdmin
      .from('medicamento')
      .select('stock_actual, stock_minimo');

    if (errMed) throw errMed;

    const enCatalogo = medicamentos.length;
    const sinStock = medicamentos.filter(m => m.stock_actual === 0).length;
    const stockCritico = medicamentos.filter(m => m.stock_actual <= m.stock_minimo && m.stock_actual > 0).length;
    const stockNormal = medicamentos.filter(m => m.stock_actual > m.stock_minimo).length;

    // 3. LOTES POR VENCER (PRÓXIMOS 30 DÍAS)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const { data: todosLotes, error: errLotes } = await supabaseAdmin
      .from('lote_medicamento')
      .select('fecha_ingreso, fecha_vencimiento');

    if (errLotes) throw errLotes;

    const lotesHoy = todosLotes.filter(l => new Date(l.fecha_ingreso) >= hoy).length;
    const porVencer = todosLotes.filter(l => new Date(l.fecha_vencimiento) <= en30Dias && new Date(l.fecha_vencimiento) >= hoy).length;

    // 4. GENERAR SERIE DE TIEMPO REAL (ÚLTIMOS 5 DÍAS) PARA LAS BARRAS
    const serieIngresos = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 4; i >= 0; i--) {
      const fechaBucle = new Date();
      fechaBucle.setDate(hoy.getDate() - i);
      fechaBucle.setHours(0, 0, 0, 0);

      const fechaFinBucle = new Date(fechaBucle);
      fechaFinBucle.setHours(23, 59, 59, 999);

      // Contamos cuántos lotes se crearon en este rango de 24 horas
      const conteoLotes = todosLotes.filter(l => {
        const fIngreso = new Date(l.fecha_ingreso);
        return fIngreso >= fechaBucle && fIngreso <= fechaFinBucle;
      }).length;

      serieIngresos.push({
        etiqueta: diasSemana[fechaBucle.getDay()],
        cantidad: conteoLotes
      });
    }

    return res.status(200).json({ 
      ok: true, 
      stats: { enCatalogo, stockCritico, sinStock, lotesHoy, porVencer, licencia },
      porEstado: { stockNormal, stockCritico, sinStock },
      serieIngresos
    });

  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al cargar las estadísticas" });
  }
}