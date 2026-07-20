// services/facturaService.js
// ============================================================
// Facturacion para pagos del SIIH.
// Calcula IVA, registra factura fiscal y arma el detalle para PDF.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { generarPdfFactura } from './facturaPdf.js';

export const IVA_PORCENTAJE = 13;
const IVA_FACTOR = IVA_PORCENTAJE / 100;

function redondear2(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
}

export function calcularFactura(montoTotal) {
  const total = redondear2(montoTotal);
  const subtotal = redondear2(total / (1 + IVA_FACTOR));
  const iva = redondear2(total - subtotal);
  return { subtotal, iva, total, porcentaje_iva: IVA_PORCENTAJE };
}

function generarNumeroFactura(idPago) {
  const year = new Date().getFullYear();
  return `SIIH-${year}-${String(idPago).padStart(8, '0')}`;
}

export async function crearFacturaParaPago({
  id_pago,
  id_paciente = null,
  razon_social = null,
  nit_ci = null,
  concepto = null,
  detalles = [],
}) {
  const { data: pago, error: errorPago } = await supabaseAdmin
    .from('pago')
    .select('id_pago, id_consulta, id_inscripcion, monto, metodo_pago, comprobante, fecha_pago')
    .eq('id_pago', id_pago)
    .maybeSingle();

  if (errorPago) throw new Error(`Error obteniendo pago: ${errorPago.message}`);
  if (!pago) throw new Error('Pago no encontrado para facturar.');

  const calculo = calcularFactura(pago.monto);
  const numeroFactura = generarNumeroFactura(pago.id_pago);
  const conceptoFinal = concepto || (pago.id_inscripcion ? 'Inscripcion universitaria' : 'Consulta medica');

  const { data: existente, error: errorExistente } = await supabaseAdmin
    .from('factura')
    .select('id_factura, numero_factura')
    .eq('id_pago', id_pago)
    .maybeSingle();

  if (errorExistente) throw new Error(`Error verificando factura: ${errorExistente.message}`);
  if (existente) {
    if (detalles.length) await guardarDetallesFactura(existente.id_factura, detalles);
    return existente;
  }

  const { data, error } = await supabaseAdmin
    .from('factura')
    .insert([{
      id_pago,
      id_paciente,
      numero_factura: numeroFactura,
      razon_social: razon_social || 'Consumidor Final',
      nit_ci: nit_ci || '0',
      concepto: conceptoFinal,
      subtotal: calculo.subtotal,
      iva: calculo.iva,
      total: calculo.total,
      porcentaje_iva: calculo.porcentaje_iva,
      estado: 'emitida',
    }])
    .select('id_factura, numero_factura')
    .single();

  if (error) throw new Error(`Error creando factura: ${error.message}`);
  if (detalles.length) await guardarDetallesFactura(data.id_factura, detalles);
  return data;
}

async function guardarDetallesFactura(id_factura, detalles = []) {
  const filas = detalles
    .filter((d) => d && d.descripcion && Number(d.cantidad) > 0)
    .map((d) => ({
      id_factura,
      descripcion: String(d.descripcion).slice(0, 220),
      cantidad: Number(d.cantidad),
      precio_unitario: redondear2(d.precio_unitario),
      subtotal: redondear2(d.subtotal ?? Number(d.cantidad) * Number(d.precio_unitario || 0)),
    }));

  if (!filas.length) return;

  const { error: errorDelete } = await supabaseAdmin
    .from('factura_detalle')
    .delete()
    .eq('id_factura', id_factura);

  if (errorDelete && !/factura_detalle/i.test(errorDelete.message || '')) {
    throw new Error(`Error limpiando detalle de factura: ${errorDelete.message}`);
  }

  const { error } = await supabaseAdmin.from('factura_detalle').insert(filas);
  if (error) throw new Error(`Error registrando detalle de factura: ${error.message}`);
}

export async function obtenerDetalleFacturaPorPago(id_pago) {
  const { data: factura, error } = await supabaseAdmin
    .from('factura')
    .select(`
      id_factura,
      id_pago,
      id_paciente,
      numero_factura,
      razon_social,
      nit_ci,
      concepto,
      subtotal,
      iva,
      total,
      porcentaje_iva,
      estado,
      fecha_emision,
      pago:id_pago (
        id_pago,
        id_consulta,
        id_inscripcion,
        id_receta,
        metodo_pago,
        comprobante,
        fecha_pago
      ),
      detalle:factura_detalle (
        descripcion,
        cantidad,
        precio_unitario,
        subtotal
      )
    `)
    .eq('id_pago', id_pago)
    .maybeSingle();

  if (error) throw new Error(`Error obteniendo factura: ${error.message}`);
  if (!factura) return null;

  let paciente = null;
  if (factura.id_paciente) {
    const { data: p } = await supabaseAdmin
      .from('paciente')
      .select('persona_id, persona:persona_id(nombre, apellido)')
      .eq('id_paciente', factura.id_paciente)
      .maybeSingle();
    if (p) {
      const { data: u } = await supabaseAdmin
        .from('usuario')
        .select('ci, correo')
        .eq('persona_id', p.persona_id)
        .maybeSingle();
      paciente = {
        nombre_completo: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : '',
        ci: u?.ci || '',
        correo: u?.correo || '',
      };
    }
  }

  return { ...factura, paciente };
}

export async function generarPdfFacturaPago(id_pago) {
  const detalle = await obtenerDetalleFacturaPorPago(id_pago);
  if (!detalle) {
    return { ok: false, status: 404, errores: { general: 'No existe factura para este pago.' } };
  }

  const pdfBytes = await generarPdfFactura(detalle);
  return {
    ok: true,
    status: 200,
    pdfBytes,
    nombreArchivo: `factura_${detalle.numero_factura}.pdf`,
  };
}
