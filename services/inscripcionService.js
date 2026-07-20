// services/inscripcionService.js
// ============================================================
// CAPA DE LOGICA Y SEGURIDAD
// HU-17 / RF17: Registra la inscripción de un paciente/estudiante
//   ya existente (HU-01) a una facultad/área, validando que no haya
//   una inscripción activa duplicada.
// RF20: CRUD del catálogo de facultades/áreas para el administrativo.
// ============================================================
import {
  listarFacultades,
  crearFacultad,
  actualizarFacultad,
  eliminarFacultad,
  buscarInscripcionActiva,
  crearInscripcion,
  listarInscripciones,
  obtenerInscripcionParaComprobante,
} from '../repositories/inscripcionRepository.js';
import { buscarPacientePorCi } from '../repositories/pacienteRepository.js';
import { generarPdfComprobanteInscripcion } from './comprobanteInscripcionPdf.js';

const TIPOS_AREA_VALIDOS = ['Academica', 'Clinica', 'Administrativa'];

function hoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ---------------- Facultades / Áreas ----------------

export async function obtenerFacultades() {
  const facultades = await listarFacultades();
  return { ok: true, status: 200, facultades };
}

export async function registrarFacultad({ nombre_area, tipo_area, descripcion }) {
  if (!nombre_area || !nombre_area.trim()) {
    return { ok: false, status: 400, errores: { nombre_area: 'El nombre de la facultad/área es obligatorio.' } };
  }
  if (tipo_area && !TIPOS_AREA_VALIDOS.includes(tipo_area)) {
    return { ok: false, status: 400, errores: { tipo_area: 'Tipo de área no válido.' } };
  }

  try {
    const facultad = await crearFacultad({ nombre_area: nombre_area.trim(), tipo_area, descripcion });
    return { ok: true, status: 201, mensaje: 'Facultad/área registrada correctamente.', facultad };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: err.message } };
  }
}

export async function editarFacultad(id_area, datos) {
  if (!id_area) return { ok: false, status: 400, errores: { general: 'Falta el identificador de la facultad.' } };
  if (datos.tipo_area && !TIPOS_AREA_VALIDOS.includes(datos.tipo_area)) {
    return { ok: false, status: 400, errores: { tipo_area: 'Tipo de área no válido.' } };
  }

  try {
    const facultad = await actualizarFacultad(id_area, datos);
    return { ok: true, status: 200, mensaje: 'Facultad/área actualizada correctamente.', facultad };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

export async function borrarFacultad(id_area) {
  if (!id_area) return { ok: false, status: 400, mensaje: 'Falta el identificador de la facultad.' };

  try {
    await eliminarFacultad(id_area);
    return { ok: true, status: 200, mensaje: 'Facultad/área eliminada correctamente.' };
  } catch (err) {
    return { ok: false, status: 409, mensaje: err.message };
  }
}

// ---------------- Inscripciones ----------------

export async function obtenerInscripciones() {
  const inscripciones = await listarInscripciones();
  return { ok: true, status: 200, inscripciones };
}

export async function registrarInscripcion({ ci, id_area }) {
  const errores = {};
  if (!ci || !ci.trim()) errores.ci = 'Ingresa el CI del paciente/estudiante.';
  if (!id_area) errores.id_area = 'Selecciona una facultad/área.';
  if (Object.keys(errores).length > 0) return { ok: false, status: 400, errores };

  // Dependencia HU-01: el paciente debe existir ya; no se re-registra aquí.
  const paciente = await buscarPacientePorCi(ci.trim());
  if (!paciente) {
    return {
      ok: false,
      status: 404,
      errores: {
        ci: 'No encontramos a esa persona registrada. Regístrala primero en Pacientes (HU-01) y luego inscríbela aquí.',
      },
    };
  }

  // Validación de duplicados (criterio de aceptación de HU-17).
  const yaInscrito = await buscarInscripcionActiva(paciente.id_paciente, id_area);
  if (yaInscrito) {
    return {
      ok: false,
      status: 409,
      errores: { general: `${paciente.nombre_completo} ya tiene una inscripción activa en esta facultad/área.` },
    };
  }

  const inscripcion = await crearInscripcion({
    id_paciente: paciente.id_paciente,
    id_area,
    fecha_inscripcion: hoyISO(),
  });

  return {
    ok: true,
    status: 201,
    mensaje: `Inscripción registrada para ${paciente.nombre_completo}.`,
    inscripcion,
    paciente: { nombre_completo: paciente.nombre_completo, ci: paciente.ci },
  };
}

export async function generarComprobante({ id_inscripcion }) {
  if (!id_inscripcion) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador de la inscripción.' } };
  }

  const detalle = await obtenerInscripcionParaComprobante(id_inscripcion);
  if (!detalle) {
    return { ok: false, status: 404, errores: { general: 'No se encontró la inscripción indicada.' } };
  }

  const pdfBytes = await generarPdfComprobanteInscripcion(detalle);
  const nombreArchivo = `comprobante_inscripcion_${detalle.id_inscripcion}.pdf`;

  return { ok: true, status: 200, pdfBytes, nombreArchivo };
}