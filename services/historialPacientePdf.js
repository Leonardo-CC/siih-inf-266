import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { obtenerDetallePaciente } from '../repositories/pacienteRepository.js';

const AZUL = rgb(0.043, 0.373, 0.647);
const AZUL_OSCURO = rgb(0.027, 0.231, 0.4);
const GRIS = rgb(0.2, 0.278, 0.357);
const GRIS_CLARO = rgb(0.56, 0.62, 0.69);
const BORDE = rgb(0.84, 0.89, 0.95);

function limpiar(valor) {
  return String(valor ?? '-')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '-')
    .replace(/[ÂÃ]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || '-';
}

function fecha(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' });
}

function edad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let years = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) years--;
  return years;
}

function envolver(font, size, texto, maxWidth) {
  const palabras = limpiar(texto).split(/\s+/);
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

async function obtenerHistorialPaciente(idPaciente) {
  const { data, error } = await supabaseAdmin
    .from('consulta')
    .select(`
      id_consulta,
      fecha_consulta,
      motivo_consulta,
      medico (
        especialidad_antigua,
        persona ( nombre, apellido ),
        especialidad:id_especialidad ( nombre )
      ),
      historial_clinico (
        id_historial,
        diagnostico,
        observaciones,
        alergias,
        receta (
          estado,
          observaciones,
          detalle_receta (
            cantidad,
            dosis,
            frecuencia,
            duracion,
            medicamento ( nombre )
          )
        )
      )
    `)
    .eq('id_paciente', idPaciente)
    .order('fecha_consulta', { ascending: false });

  if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
  return (data || []).filter((c) => c.historial_clinico);
}

export async function generarPdfHistorialPaciente(idPaciente) {
  if (!idPaciente) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador del paciente.' } };
  }

  const [paciente, historial] = await Promise.all([
    obtenerDetallePaciente(idPaciente),
    obtenerHistorialPaciente(idPaciente),
  ]);

  if (!paciente) {
    return { ok: false, status: 404, errores: { general: 'Paciente no encontrado.' } };
  }

  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ancho = 595.28;
  const alto = 841.89;
  const margen = 46;
  const anchoUtil = ancho - margen * 2;
  let page = pdf.addPage([ancho, alto]);
  let y = alto - margen;

  function nuevaPagina(espacio = 60) {
    if (y - espacio < margen) {
      page = pdf.addPage([ancho, alto]);
      y = alto - margen;
    }
  }

  function texto(txt, x, yy, size = 10, font = fontRegular, color = GRIS) {
    page.drawText(limpiar(txt), { x, y: yy, size, font, color });
  }

  function parrafo(titulo, contenido) {
    nuevaPagina(42);
    texto(titulo, margen, y, 10, fontBold, AZUL_OSCURO);
    y -= 15;
    const lineas = envolver(fontRegular, 9.5, contenido || 'No registrado.', anchoUtil - 12);
    for (const linea of lineas) {
      nuevaPagina(15);
      texto(linea, margen + 10, y, 9.5);
      y -= 13;
    }
    y -= 8;
  }

  page.drawRectangle({ x: 0, y: alto - 96, width: ancho, height: 96, color: AZUL });
  texto('SIIH', margen, alto - 42, 23, fontBold, rgb(1, 1, 1));
  texto('Historial clinico del paciente', margen, alto - 64, 13, fontBold, rgb(1, 1, 1));
  texto('Sistema Integrado de Informacion Hospitalaria', margen, alto - 82, 9, fontRegular, rgb(0.9, 0.96, 1));
  y = alto - 126;

  texto('Datos del paciente', margen, y, 13, fontBold, AZUL);
  y -= 22;
  const edadPaciente = edad(paciente.fecha_nac);
  const datos = [
    ['Nombre', paciente.nombre_completo],
    ['CI', paciente.ci || '-'],
    ['Edad', edadPaciente != null ? `${edadPaciente} anios` : '-'],
    ['Telefono', paciente.telefono || '-'],
    ['Seguro', paciente.tipo_seguro || '-'],
    ['Nro. seguro', paciente.numero_seguro || '-'],
  ];
  datos.forEach(([label, value], idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margen + col * 250;
    const yy = y - row * 19;
    texto(`${label}:`, x, yy, 9, fontBold, AZUL_OSCURO);
    texto(value, x + 78, yy, 9);
  });
  y -= 76;

  texto(`Consultas registradas: ${historial.length}`, margen, y, 12, fontBold, AZUL);
  y -= 18;

  historial.forEach((consulta) => {
    nuevaPagina(130);
    const historia = consulta.historial_clinico;
    const receta = Array.isArray(historia?.receta) ? historia.receta[0] : historia?.receta;
    const medico = consulta.medico?.persona
      ? `${consulta.medico.persona.nombre || ''} ${consulta.medico.persona.apellido || ''}`.trim()
      : '-';
    const especialidad = consulta.medico?.especialidad?.nombre || consulta.medico?.especialidad_antigua || 'Medicina General';

    page.drawRectangle({ x: margen, y: y - 16, width: anchoUtil, height: 24, color: rgb(0.95, 0.98, 1), borderColor: BORDE, borderWidth: 1 });
    texto(`#${consulta.id_consulta} - ${fecha(consulta.fecha_consulta)}`, margen + 10, y - 8, 10, fontBold, AZUL_OSCURO);
    y -= 36;
    texto(`Medico: Dr(a). ${medico}`, margen + 10, y, 9, fontBold);
    texto(`Especialidad: ${especialidad}`, margen + 280, y, 9, fontBold);
    y -= 18;
    parrafo('Motivo', consulta.motivo_consulta);
    parrafo('Diagnostico', historia?.diagnostico);
    parrafo('Observaciones / tratamiento', historia?.observaciones);

    const detalles = receta?.detalle_receta || [];
    if (detalles.length) {
      parrafo(
        'Receta',
        detalles.map((d) => {
          const nombre = d.medicamento?.nombre || 'Medicamento';
          return `${d.cantidad || 1}x ${nombre} - ${d.dosis || '-'} - ${d.frecuencia || '-'} - ${d.duracion || '-'}`;
        }).join('\n')
      );
    }
    y -= 6;
  });

  nuevaPagina(45);
  page.drawLine({ start: { x: margen, y: 70 }, end: { x: ancho - margen, y: 70 }, thickness: 0.5, color: BORDE });
  texto(`Generado el ${fecha(new Date().toISOString())} - SIIH`, margen, 50, 8, fontRegular, GRIS_CLARO);

  const pdfBytes = await pdf.save();
  return {
    ok: true,
    status: 200,
    pdfBytes,
    nombreArchivo: `historial_paciente_${idPaciente}.pdf`,
  };
}
