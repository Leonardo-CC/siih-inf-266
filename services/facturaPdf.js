import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const AZUL = rgb(0.035, 0.235, 0.39);
const AZUL_MEDIO = rgb(0.043, 0.373, 0.647);
const CELESTE = rgb(0.9, 0.956, 0.988);
const BORDE = rgb(0.78, 0.84, 0.9);
const GRIS = rgb(0.18, 0.24, 0.32);
const GRIS_CLARO = rgb(0.52, 0.58, 0.65);
const VERDE = rgb(0.1, 0.45, 0.23);

function moneda(valor) {
  return `Bs. ${Number(valor || 0).toFixed(2)}`;
}

function fecha(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

function texto(valor) {
  return String(valor || '-');
}

function recortar(valor, max = 52) {
  const str = texto(valor);
  return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

function codigoControl(detalle) {
  const base = `${detalle.numero_factura || ''}-${detalle.id_pago || ''}-${detalle.total || ''}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

function drawText(page, text, opts) {
  page.drawText(texto(text), opts);
}

function drawBox(page, { x, y, width, height, title, fontBold, fontRegular }) {
  page.drawRectangle({ x, y, width, height, borderColor: BORDE, borderWidth: 1, color: rgb(1, 1, 1) });
  if (title) {
    page.drawRectangle({ x, y: y + height - 24, width, height: 24, color: CELESTE, borderColor: BORDE, borderWidth: 1 });
    drawText(page, title, { x: x + 10, y: y + height - 17, size: 9, font: fontBold, color: AZUL });
  }
}

export async function generarPdfFactura(detalle) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ancho = 595.28;
  const alto = 841.89;
  const margen = 42;
  const page = pdf.addPage([ancho, alto]);

  page.drawRectangle({ x: 0, y: alto - 118, width: ancho, height: 118, color: AZUL });
  page.drawText('SIIH', { x: margen, y: alto - 42, size: 26, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Sistema Integrado de Informacion Hospitalaria', { x: margen, y: alto - 62, size: 10, font: fontRegular, color: rgb(1, 1, 1) });
  page.drawText('Hospital Universitario San Andres - UMSA', { x: margen, y: alto - 80, size: 9, font: fontRegular, color: rgb(0.86, 0.94, 1) });
  page.drawText('La Paz, Bolivia', { x: margen, y: alto - 96, size: 9, font: fontRegular, color: rgb(0.86, 0.94, 1) });

  page.drawRectangle({ x: ancho - margen - 190, y: alto - 102, width: 190, height: 74, color: rgb(1, 1, 1), borderColor: rgb(1, 1, 1), borderWidth: 1 });
  page.drawText('FACTURA', { x: ancho - margen - 128, y: alto - 50, size: 18, font: fontBold, color: AZUL });
  page.drawText(`Nro. ${texto(detalle.numero_factura)}`, { x: ancho - margen - 174, y: alto - 72, size: 10, font: fontBold, color: GRIS });
  page.drawText(`Estado: ${texto(detalle.estado).toUpperCase()}`, { x: ancho - margen - 174, y: alto - 89, size: 9, font: fontRegular, color: VERDE });

  const yDatos = alto - 252;
  drawBox(page, { x: margen, y: yDatos, width: 250, height: 104, title: 'DATOS DEL CLIENTE', fontBold, fontRegular });
  drawBox(page, { x: margen + 266, y: yDatos, width: ancho - margen * 2 - 266, height: 104, title: 'DATOS DE EMISION', fontBold, fontRegular });

  let y = yDatos + 58;
  drawText(page, 'Razon social:', { x: margen + 10, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, detalle.razon_social, { x: margen + 92, y, size: 9, font: fontRegular, color: GRIS });
  y -= 18;
  drawText(page, 'NIT / CI:', { x: margen + 10, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, detalle.nit_ci, { x: margen + 92, y, size: 9, font: fontRegular, color: GRIS });
  y -= 18;
  drawText(page, 'Paciente:', { x: margen + 10, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, detalle.paciente?.nombre_completo || detalle.razon_social, { x: margen + 92, y, size: 9, font: fontRegular, color: GRIS });

  const xEmision = margen + 276;
  y = yDatos + 58;
  drawText(page, 'Fecha:', { x: xEmision, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, fecha(detalle.fecha_emision), { x: xEmision + 84, y, size: 9, font: fontRegular, color: GRIS });
  y -= 18;
  drawText(page, 'Metodo pago:', { x: xEmision, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, detalle.pago?.metodo_pago || '-', { x: xEmision + 84, y, size: 9, font: fontRegular, color: GRIS });
  y -= 18;
  drawText(page, 'Referencia:', { x: xEmision, y, size: 9, font: fontBold, color: GRIS });
  drawText(page, detalle.pago?.comprobante || `Pago #${detalle.id_pago}`, { x: xEmision + 84, y, size: 9, font: fontRegular, color: GRIS });

  const tablaX = margen;
  const tablaY = alto - 418;
  const tablaW = ancho - margen * 2;
  page.drawRectangle({ x: tablaX, y: tablaY + 118, width: tablaW, height: 28, color: AZUL_MEDIO });
  const headers = [
    ['Cant.', tablaX + 12],
    ['Descripcion', tablaX + 70],
    ['P. Unitario', tablaX + 346],
    ['Importe', tablaX + 440],
  ];
  headers.forEach(([label, x]) => drawText(page, label, { x, y: tablaY + 128, size: 9, font: fontBold, color: rgb(1, 1, 1) }));

  const detalles = Array.isArray(detalle.detalle) && detalle.detalle.length
    ? detalle.detalle
    : [{ cantidad: 1, descripcion: detalle.concepto || 'Servicio SIIH', precio_unitario: detalle.total, subtotal: detalle.total }];

  let filaY = tablaY + 100;
  detalles.slice(0, 8).forEach((item, index) => {
    page.drawRectangle({ x: tablaX, y: filaY - 12, width: tablaW, height: 28, color: rgb(1, 1, 1), borderColor: BORDE, borderWidth: 0.7 });
    drawText(page, String(Number(item.cantidad || 0)), { x: tablaX + 18, y: filaY, size: 9, font: fontRegular, color: GRIS });
    drawText(page, recortar(item.descripcion), { x: tablaX + 70, y: filaY, size: 9, font: fontRegular, color: GRIS });
    drawText(page, moneda(item.precio_unitario), { x: tablaX + 346, y: filaY, size: 9, font: fontRegular, color: GRIS });
    drawText(page, moneda(item.subtotal), { x: tablaX + 440, y: filaY, size: 9, font: fontRegular, color: GRIS });
    filaY -= 28;
  });

  if (detalles.length > 8) {
    drawText(page, `+ ${detalles.length - 8} item(s) adicionales incluidos en el total`, { x: tablaX + 70, y: filaY, size: 8, font: fontRegular, color: GRIS_CLARO });
  }

  const resumenX = ancho - margen - 210;
  const resumenY = tablaY - 56;
  drawBox(page, { x: resumenX, y: resumenY, width: 210, height: 116, fontBold, fontRegular });
  const filasResumen = [
    ['Subtotal', moneda(detalle.subtotal)],
    [`IVA ${Number(detalle.porcentaje_iva || 13).toFixed(0)}%`, moneda(detalle.iva)],
    ['Total', moneda(detalle.total)],
  ];
  y = resumenY + 82;
  filasResumen.forEach(([label, value], index) => {
    drawText(page, `${label}:`, { x: resumenX + 14, y, size: index === 2 ? 12 : 10, font: fontBold, color: index === 2 ? AZUL : GRIS });
    drawText(page, value, { x: resumenX + 126, y, size: index === 2 ? 12 : 10, font: index === 2 ? fontBold : fontRegular, color: index === 2 ? VERDE : GRIS });
    y -= index === 1 ? 28 : 22;
  });

  const verifY = resumenY - 112;
  drawBox(page, { x: margen, y: verifY, width: tablaW, height: 82, title: 'CONTROL Y VERIFICACION', fontBold, fontRegular });
  drawText(page, 'Codigo de control:', { x: margen + 12, y: verifY + 38, size: 9, font: fontBold, color: GRIS });
  drawText(page, codigoControl(detalle), { x: margen + 120, y: verifY + 38, size: 10, font: fontBold, color: AZUL });
  drawText(page, 'Esta factura fue generada automaticamente por el SIIH al registrar el pago.', { x: margen + 12, y: verifY + 18, size: 8.5, font: fontRegular, color: GRIS_CLARO });

  page.drawRectangle({ x: margen, y: 96, width: tablaW, height: 52, color: rgb(0.98, 0.99, 1), borderColor: BORDE, borderWidth: 1 });
  drawText(page, 'Gracias por utilizar los servicios del Hospital Universitario San Andres.', { x: margen + 12, y: 126, size: 9, font: fontBold, color: AZUL });
  drawText(page, 'Documento valido para control interno de caja, pagos e inscripciones del sistema SIIH.', { x: margen + 12, y: 108, size: 8.5, font: fontRegular, color: GRIS_CLARO });

  page.drawLine({ start: { x: margen, y: 70 }, end: { x: ancho - margen, y: 70 }, thickness: 0.5, color: BORDE });
  drawText(page, `Generado el ${fecha(new Date().toISOString())} - SIIH UMSA`, { x: margen, y: 50, size: 8, font: fontRegular, color: GRIS_CLARO });

  return await pdf.save();
}
