// api/medico/reporte-consulta.js
// HU-09: genera el resumen formal de la consulta medica en PDF.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { obtenerConsultaParaReporte, obtenerPerfilMedico } from '../../repositories/medicoRepository.js';
import { obtenerDetallePaciente } from '../../repositories/pacienteRepository.js';

const AZUL = rgb(0.043, 0.373, 0.647);
const AZUL_OSCURO = rgb(0.027, 0.231, 0.4);
const GRIS = rgb(0.2, 0.278, 0.357);
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

function calcularEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const id_consulta = Number(req.query?.id_consulta);
    const id_medico = Number(req.query?.id_medico);

    const consulta = await obtenerConsultaParaReporte(id_consulta, id_medico);
    if (consulta === 'forbidden') {
      return res.status(403).json({ ok: false, mensaje: 'No tienes acceso a esta consulta.' });
    }
    if (!consulta) {
      return res.status(404).json({ ok: false, mensaje: 'Consulta no encontrada.' });
    }
    if (!consulta.diagnostico) {
      return res.status(409).json({ ok: false, mensaje: 'Registra y guarda un diagnóstico antes de exportar el PDF.' });
    }

    const [paciente, medico] = await Promise.all([
      obtenerDetallePaciente(consulta.id_paciente),
      obtenerPerfilMedico(consulta.id_medico),
    ]);

    const pdf = await PDFDocument.create();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const anchoPagina = 595.28;
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

    pagina.drawRectangle({ x: 0, y: altoPagina - 90, width: anchoPagina, height: 90, color: AZUL });
    pagina.drawText('SIIH', { x: margen, y: altoPagina - 40, size: 22, font: fontBold, color: rgb(1, 1, 1) });
    pagina.drawText('Sistema Integrado de Informacion Hospitalaria', {
      x: margen, y: altoPagina - 58, size: 10, font: fontRegular, color: rgb(1, 1, 1),
    });
    pagina.drawText('Reporte de Consulta Medica', {
      x: margen, y: altoPagina - 76, size: 13, font: fontBold, color: rgb(1, 1, 1),
    });

    y = altoPagina - 120;

    function fila(etiqueta, valor) {
      nuevaPaginaSiNecesario(20);
      pagina.drawText(etiqueta, { x: margen, y, size: 10, font: fontBold, color: AZUL_OSCURO });
      pagina.drawText(valor || '-', { x: margen + 130, y, size: 10, font: fontRegular, color: GRIS });
      y -= 18;
    }

    fila('N° de consulta:', `#${consulta.id_consulta}`);
    fila('Fecha y hora:', formatearFecha(consulta.fecha_consulta));
    fila('Paciente:', paciente?.nombre_completo);
    fila('CI:', paciente?.ci);
    fila('Edad:', paciente?.edad != null ? `${paciente.edad} años` : '-');
    fila('Medico tratante:', medico?.nombre_completo ? `Dr(a). ${medico.nombre_completo}` : '-');
    fila('Especialidad:', medico?.especialidad);
    fila('N° de licencia:', medico?.nro_licencia);
    fila('Motivo de consulta:', consulta.motivo_consulta);

    y -= 10;
    pagina.drawLine({
      start: { x: margen, y }, end: { x: anchoPagina - margen, y },
      thickness: 1, color: rgb(0.78, 0.86, 0.94),
    });
    y -= 25;

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

    seccion('Diagnostico', consulta.diagnostico);
    seccion('Tratamiento', consulta.tratamiento);
    seccion('Receta / Medicacion', consulta.receta);
    if (consulta.observaciones_libres) {
      seccion('Observaciones', consulta.observaciones_libres);
    }
    if (consulta.proxima_cita) {
      fila('Proxima cita sugerida:', consulta.proxima_cita);
    }

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
      'Este documento es un resumen generado automaticamente y no reemplaza la historia clinica completa.',
      { x: margen, y: 38, size: 8, font: fontRegular, color: GRIS_CLARO }
    );

    const pdfBytes = await pdf.save();
    const nombreArchivo = `reporte_consulta_${consulta.id_consulta}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error en /api/medico/reporte-consulta:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
