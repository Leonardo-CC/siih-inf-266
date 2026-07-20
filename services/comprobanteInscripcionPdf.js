// services/comprobanteInscripcionPdf.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD (generación de documento)
// HU-17 / RF17: comprobante en PDF de una inscripción registrada.
// Usa pdf-lib (mismo enfoque que reporteConsultaPdf.js de HU-09).
// ============================================================
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const AZUL = rgb(0.043, 0.373, 0.647);
const AZUL_OSCURO = rgb(0.027, 0.231, 0.4);
const GRIS = rgb(0.2, 0.278, 0.357);
const GRIS_CLARO = rgb(0.6, 0.6, 0.6);
const VERDE = rgb(0.118, 0.494, 0.212);

function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleDateString('es-BO', { dateStyle: 'long' });
}

export async function generarPdfComprobanteInscripcion(detalle) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const anchoPagina = 595.28; // A4 en puntos
  const altoPagina = 841.89;
  const margen = 50;

  const pagina = pdf.addPage([anchoPagina, altoPagina]);
  let y = altoPagina - margen;

  // ---- Encabezado azul ----
  pagina.drawRectangle({ x: 0, y: altoPagina - 90, width: anchoPagina, height: 90, color: AZUL });
  pagina.drawText('SIIH', { x: margen, y: altoPagina - 40, size: 22, font: fontBold, color: rgb(1, 1, 1) });
  pagina.drawText('Sistema Integrado de Información Hospitalaria', {
    x: margen, y: altoPagina - 58, size: 10, font: fontRegular, color: rgb(1, 1, 1),
  });
  pagina.drawText('Comprobante de Inscripción', {
    x: margen, y: altoPagina - 76, size: 13, font: fontBold, color: rgb(1, 1, 1),
  });

  y = altoPagina - 130;

  pagina.drawText(`N° de comprobante: #${detalle.id_inscripcion}`, {
    x: margen, y, size: 11, font: fontBold, color: AZUL_OSCURO,
  });
  y -= 40;

  function fila(etiqueta, valor) {
    pagina.drawText(etiqueta, { x: margen, y, size: 11, font: fontBold, color: AZUL_OSCURO });
    pagina.drawText(valor || '-', { x: margen + 160, y, size: 11, font: fontRegular, color: GRIS });
    y -= 24;
  }

  fila('Nombre completo:', detalle.paciente_nombre_completo);
  fila('Carnet de Identidad:', detalle.ci);
  fila('Facultad / Área:', detalle.facultad);
  fila('Fecha de inscripción:', formatearFecha(detalle.fecha_inscripcion));

  y -= 10;
  const colorEstado = detalle.estado === 'activa' ? VERDE : GRIS;
  pagina.drawText('Estado:', { x: margen, y, size: 11, font: fontBold, color: AZUL_OSCURO });
  pagina.drawText(detalle.estado === 'activa' ? 'ACTIVA' : (detalle.estado || '-').toUpperCase(), {
    x: margen + 160, y, size: 11, font: fontBold, color: colorEstado,
  });
  y -= 50;

  pagina.drawLine({
    start: { x: margen, y }, end: { x: anchoPagina - margen, y },
    thickness: 1, color: rgb(0.78, 0.86, 0.94),
  });
  y -= 20;

  pagina.drawText('Este comprobante certifica el registro de inscripción en el sistema SIIH.', {
    x: margen, y, size: 9, font: fontRegular, color: GRIS,
  });

  pagina.drawLine({
    start: { x: margen, y: 70 }, end: { x: anchoPagina - margen, y: 70 },
    thickness: 0.5, color: rgb(0.85, 0.85, 0.85),
  });
  pagina.drawText(
    `Generado el ${new Date().toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })} · SIIH UMSA`,
    { x: margen, y: 50, size: 8, font: fontRegular, color: GRIS_CLARO }
  );

  return await pdf.save();
}