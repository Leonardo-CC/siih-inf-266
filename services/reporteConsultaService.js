// services/reporteConsultaService.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD
// HU-09 / RF09: Genera y exporta un PDF con el resumen formal
// de diagnóstico y tratamiento de una consulta.
//  - Verifica que la consulta pertenezca al médico que la pide.
//  - Depende de HU-06: si no hay diagnóstico registrado, no exporta.
// ============================================================
import { obtenerConsultaParaReporte, obtenerPerfilMedico } from '../repositories/medicoRepository.js';
import { obtenerDetallePaciente } from '../repositories/pacienteRepository.js';
import { generarPdfReporteConsulta } from './reporteConsultaPdf.js';

function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  return new Date(fechaISO).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' });
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

export async function generarReporteConsulta({ id_consulta, id_medico }) {
  if (!id_consulta) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador de la consulta.' } };
  }

  const consulta = await obtenerConsultaParaReporte(id_consulta, id_medico || null);

  if (consulta === null) {
    return { ok: false, status: 404, errores: { general: 'No se encontró la consulta indicada.' } };
  }
  if (consulta === 'forbidden') {
    return {
      ok: false,
      status: 403,
      errores: { general: 'No puedes generar el reporte de una consulta que no te corresponde.' },
    };
  }

  // Regla de negocio (RF09 depende de RF06 / HU-06): sin diagnóstico
  // registrado no hay nada formal que exportar.
  if (!consulta.diagnostico || !consulta.diagnostico.trim()) {
    return {
      ok: false,
      status: 409,
      errores: {
        general:
          'Esta consulta aún no tiene un diagnóstico registrado. Completa la atención (HU-06) antes de exportar el reporte.',
      },
    };
  }

  const [paciente, medico] = await Promise.all([
    obtenerDetallePaciente(consulta.id_paciente),
    obtenerPerfilMedico(consulta.id_medico),
  ]);

  const pdfBytes = await generarPdfReporteConsulta({
    consulta: {
      ...consulta,
      fecha_consulta_formateada: formatearFecha(consulta.fecha_consulta),
    },
    paciente: {
      ...paciente,
      edad: calcularEdad(paciente?.fecha_nac),
    },
    medico,
  });

  const nombreArchivo = `reporte_consulta_${consulta.id_consulta}.pdf`;

  return { ok: true, status: 200, pdfBytes, nombreArchivo };
}