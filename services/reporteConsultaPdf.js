// services/reporteConsultaPdf.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD (generación de documento)
// Construye el PDF del reporte de consulta usando pdf-lib
// (sin fuentes/binarios externos, apto para funciones serverless
// de Vercel). Probado con ñ/tildes: WinAnsiEncoding las soporta.
// ============================================================
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const AZUL = rgb(0.043, 0.373, 0.647); // #0b5fa5
const AZUL_OSCURO = rgb(0.027, 0.231, 0.4); // #073b66
const GRIS = rgb(0.2, 0.278, 0.357); // #33475b
const GRIS_CLARO = rgb(0.6, 0.6, 0.6);

function envolverTexto(font, size, texto, maxWidth) {
  const palabras = (texto || '').split(/\s+/);
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, size) > maxWidth && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function generarPdfReporteConsulta({ consulta, paciente, medico }) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const anchoPagina = 595.28; // A4 en puntos
  const altoPagina = 841.89;
  const margen = 50;
  const anchoUtil = anchoPagina - margen * 2;

  let pagina = pdf.addPage([anchoPagina, altoPagina]);
  let y = altoPagina - margen;

  function nuevaPaginaSiNecesario(espacioNecesario) {
    if (y - espacioNecesario < margen) {
      pagina = pdf.addPage([anchoPagina, altoPagina]);
      y = altoPagina - margen;
    }
  }

  // ---- Encabezado azul ----
  pagina.drawRectangle({ x: 0, y: altoPagina - 90, width: anchoPagina, height: 90, color: AZUL });
  pagina.drawText('SIIH', { x: margen, y: altoPagina - 40, size: 22, font: fontBold, color: rgb(1, 1, 1) });
  pagina.drawText('Sistema Integrado de Información Hospitalaria', {
    x: margen, y: altoPagina - 58, size: 10, font: fontRegular, color: rgb(1, 1, 1),
  });
  pagina.drawText('Reporte de Consulta Médica', {
    x: margen, y: altoPagina - 76, size: 13, font: fontBold, color: rgb(1, 1, 1),
  });

  y = altoPagina - 120;

  // ---- Datos generales ----
  function fila(etiqueta, valor) {
    nuevaPaginaSiNecesario(20);
    pagina.drawText(etiqueta, { x: margen, y, size: 10, font: fontBold, color: AZUL_OSCURO });
    pagina.drawText(valor || '-', { x: margen + 130, y, size: 10, font: fontRegular, color: GRIS });
    y -= 18;
  }

  fila('N° de consulta:', `#${consulta.id_consulta}`);
  fila('Fecha y hora:', consulta.fecha_consulta_formateada);
  fila('Paciente:', paciente?.nombre_completo);
  fila('CI:', paciente?.ci);
  fila('Edad:', paciente?.edad != null ? `${paciente.edad} años` : '-');
  fila('Médico tratante:', medico?.nombre_completo ? `Dr(a). ${medico.nombre_completo}` : '-');
  fila('Especialidad:', medico?.especialidad);
  fila('N° de licencia:', medico?.nro_licencia);
  fila('Motivo de consulta:', consulta.motivo_consulta);

  y -= 10;
  pagina.drawLine({
    start: { x: margen, y }, end: { x: anchoPagina - margen, y },
    thickness: 1, color: rgb(0.78, 0.86, 0.94),
  });
  y -= 25;

  // ---- Secciones de texto largo ----
  function seccion(titulo, contenido) {
    nuevaPaginaSiNecesario(40);
    pagina.drawText(titulo, { x: margen, y, size: 12, font: fontBold, color: AZUL });
    y -= 18;

    const texto = (contenido && contenido.trim()) || 'No registrado.';
    const lineas = envolverTexto(fontRegular, 10, texto, anchoUtil);
    for (const linea of lineas) {
      nuevaPaginaSiNecesario(16);
      pagina.drawText(linea, { x: margen, y, size: 10, font: fontRegular, color: GRIS });
      y -= 15;
    }
    y -= 12;
  }

  seccion('Diagnóstico', consulta.diagnostico);
  seccion('Tratamiento', consulta.tratamiento);
  seccion('Receta / Medicación', consulta.receta);
  if (consulta.observaciones_libres) {
    seccion('Observaciones', consulta.observaciones_libres);
  }
  if (consulta.proxima_cita) {
    fila('Próxima cita sugerida:', consulta.proxima_cita);
  }

  // ---- Pie de página ----
  nuevaPaginaSiNecesario(60);
  pagina.drawLine({
    start: { x: margen, y: 70 }, end: { x: anchoPagina - margen, y: 70 },
    thickness: 0.5, color: rgb(0.85, 0.85, 0.85),
  });
  pagina.drawText(
    `Generado el ${new Date().toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })} · SIIH UMSA`,
    { x: margen, y: 50, size: 8, font: fontRegular, color: GRIS_CLARO }
  );
  pagina.drawText(
    'Este documento es un resumen generado automáticamente y no reemplaza la historia clínica completa.',
    { x: margen, y: 38, size: 8, font: fontRegular, color: GRIS_CLARO }
  );

  return await pdf.save();
}