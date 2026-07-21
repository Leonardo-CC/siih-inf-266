// api/farmacia/despachar-receta.js
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { calcularFactura, crearFacturaParaPago } from '../../services/facturaService.js';
import { enviarAlertaTelegram } from '../../services/telegramService.js';

function redondear2(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
}

async function insertarPagoFarmacia({ idCita, idConsulta, idReceta, idPaciente, montoTotal, metodo_pago, comprobante }) {
  const intentos = [
    {
      id_cita: idCita,
      id_consulta: idConsulta,
      id_receta: Number(idReceta),
      id_paciente: idPaciente,
      monto: montoTotal,
      metodo_pago,
      estado_pago: 'aprobado',
      comprobante,
      fecha_pago: new Date().toISOString(),
    },
    {
      id_cita: idCita,
      id_consulta: idConsulta,
      id_paciente: idPaciente,
      monto: montoTotal,
      metodo_pago,
      estado_pago: 'aprobado',
      comprobante,
      fecha_pago: new Date().toISOString(),
    },
    {
      id_cita: idCita,
      id_consulta: idConsulta,
      id_paciente: idPaciente,
      monto: montoTotal,
      metodo_pago,
      comprobante,
    },
    {
      id_cita: idCita,
      id_paciente: idPaciente,
      monto: montoTotal,
      metodo_pago,
      comprobante,
    },
  ];

  let ultimoError = null;
  for (const payload of intentos) {
    const limpio = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined));
    const { data, error } = await supabaseAdmin
      .from('pago')
      .insert([limpio])
      .select('id_pago')
      .single();

    if (!error && data?.id_pago) return data;
    ultimoError = error;
  }

  throw new Error(`No se pudo registrar el pago de farmacia: ${ultimoError?.message || 'error desconocido'}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido' });
  }

  const { id_receta, metodo_pago = 'efectivo', razon_social, nit_ci } = req.body || {};

  try {
    const { data: receta, error: errReceta } = await supabaseAdmin
      .from('receta')
      .select(`
        id_receta,
        historial_clinico (
          consulta (
            id_consulta,
            id_cita,
            id_paciente,
            paciente (
              persona_id,
              persona ( nombre, apellido )
            )
          )
        ),
        detalle_receta (
          id_medicamento,
          cantidad,
          dosis,
          medicamento ( nombre, precio )
        )
      `)
      .eq('id_receta', id_receta)
      .single();

    if (errReceta || !receta) throw new Error('Receta no encontrada');

    const consulta = receta.historial_clinico?.consulta;
    const idConsulta = consulta?.id_consulta || null;
    const idCita = consulta?.id_cita || null;
    const idPaciente = consulta?.id_paciente || null;
    const personaPaciente = consulta?.paciente?.persona;
    const nombrePaciente = personaPaciente
      ? `${personaPaciente.nombre || ''} ${personaPaciente.apellido || ''}`.trim()
      : 'Consumidor Final';

    const detallesFactura = (receta.detalle_receta || []).map((detalle) => {
      const precioUnitario = Number(detalle.medicamento?.precio || 0);
      const cantidad = Number(detalle.cantidad || 0);
      return {
        id_medicamento: detalle.id_medicamento,
        descripcion: `${detalle.medicamento?.nombre || 'Medicamento'}${detalle.dosis ? ` - ${detalle.dosis}` : ''}`,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal: redondear2(cantidad * precioUnitario),
      };
    });

    const montoTotal = redondear2(detallesFactura.reduce((sum, item) => sum + item.subtotal, 0));
    if (montoTotal <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se puede facturar la receta porque los medicamentos no tienen precio registrado.',
      });
    }

    for (const detalle of receta.detalle_receta || []) {
      const { data: medGlobal } = await supabaseAdmin
        .from('medicamento')
        .select('nombre, stock_actual, stock_minimo')
        .eq('id_medicamento', detalle.id_medicamento)
        .single();

      if (!medGlobal || Number(medGlobal.stock_actual) < Number(detalle.cantidad)) {
        return res.status(400).json({
          ok: false,
          mensaje: `Stock insuficiente para ${medGlobal?.nombre || 'medicamento'}. Se piden ${detalle.cantidad}, pero solo hay ${medGlobal?.stock_actual || 0}.`,
        });
      }
    }

    const comprobante = `FARM-${Date.now()}`;
    const pago = await insertarPagoFarmacia({
      idCita,
      idConsulta,
      idReceta: id_receta,
      idPaciente,
      montoTotal,
      metodo_pago,
      comprobante,
    });

    const factura = await crearFacturaParaPago({
      id_pago: pago.id_pago,
      id_paciente: idPaciente,
      razon_social: razon_social || nombrePaciente,
      nit_ci: nit_ci || '0',
      concepto: `Medicamentos receta #${id_receta}`,
      detalles: detallesFactura,
    });

    for (const detalle of receta.detalle_receta || []) {
      let cantidadFaltante = Number(detalle.cantidad);

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

      for (const lote of lotes || []) {
        if (cantidadFaltante <= 0) break;

        const aDescontar = Math.min(Number(lote.cantidad_actual), cantidadFaltante);
        cantidadFaltante -= aDescontar;

        const { error: errLote } = await supabaseAdmin
          .from('lote_medicamento')
          .update({ cantidad_actual: Number(lote.cantidad_actual) - aDescontar })
          .eq('id_lote', lote.id_lote);

        if (errLote) throw new Error(`Fallo al descontar del lote ${lote.id_lote}: ${errLote.message}`);
      }

      const nuevoTotal = Number(med.stock_actual) - Number(detalle.cantidad);
      const { error: errMed } = await supabaseAdmin
        .from('medicamento')
        .update({ stock_actual: nuevoTotal })
        .eq('id_medicamento', detalle.id_medicamento);

      if (errMed) throw new Error(`Fallo al actualizar stock global: ${errMed.message}`);

      if (nuevoTotal <= Number(med.stock_minimo)) {
        const mensajeTelegram = `<b>ALERTA DE INVENTARIO CRITICO</b>\n\nTras el ultimo despacho, el medicamento <b>${med.nombre}</b> requiere atencion.\n\n<b>Stock actual:</b> ${nuevoTotal}\n<b>Minimo requerido:</b> ${med.stock_minimo}`;
        await enviarAlertaTelegram(mensajeTelegram);
      }
    }

    const { error: errFinal } = await supabaseAdmin
      .from('receta')
      .update({ estado: 'despachada' })
      .eq('id_receta', id_receta);

    if (errFinal) throw errFinal;

    return res.status(200).json({
      ok: true,
      id_pago: pago.id_pago,
      factura_pdf_url: `/api/pagos/factura?id_pago=${pago.id_pago}`,
      factura,
      monto: montoTotal,
      desglose_iva: calcularFactura(montoTotal),
    });
  } catch (error) {
    console.error('Error en despacho FEFO:', error.message);
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
}
