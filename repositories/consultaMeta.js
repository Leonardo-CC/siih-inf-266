// repositories/consultaMeta.js
// ============================================================
// Utilidades compartidas para leer/escribir metadatos dentro de
// consulta.observaciones sin que enfermeria (ADM) y medico (MED)
// se pisen entre si.
//
// Formato:
//   [[ADM]]{...}[[/ADM]] [[MED]]{...}[[/MED]] Texto libre
// ============================================================

const REGEX_ADM = /\[\[ADM\]\](.*?)\[\[\/ADM\]\]\s*/s;
const REGEX_MED = /\[\[MED\]\](.*?)\[\[\/MED\]\]\s*/s;

const TIPOS_ADMISION_VALIDOS = ['consulta_externa', 'emergencia'];
const ESTADOS_ADMISION_VALIDOS = ['registrada', 'en_triage', 'asignada', 'atendida', 'cancelada'];
const ESTADOS_ATENCION_VALIDOS = ['pendiente', 'en_atencion', 'atendida', 'derivada'];

function leerBloque(texto, regex) {
  const match = (texto || '').match(regex);
  if (!match) return {};
  try {
    return JSON.parse(match[1]) || {};
  } catch {
    return {};
  }
}

// Devuelve el texto libre (sin ninguno de los bloques de metadatos).
export function textoLibre(observaciones) {
  return (observaciones || '')
    .replace(REGEX_ADM, '')
    .replace(REGEX_MED, '')
    .trim();
}

// ---------------- ADMISION (enfermeria) ----------------

export function leerMetaAdmision(observaciones) {
  const meta = leerBloque(observaciones, REGEX_ADM);
  return {
    tipo_admision: TIPOS_ADMISION_VALIDOS.includes(meta.tipo) ? meta.tipo : 'consulta_externa',
    estado: ESTADOS_ADMISION_VALIDOS.includes(meta.estado) ? meta.estado : 'registrada',
    sala_asignada: meta.sala ?? null,
    id_enfermero: meta.enfermero != null ? Number(meta.enfermero) : null,
    datos_verificados: Boolean(meta.verificado),
  };
}

// ---------------- ATENCION MEDICA (medico) ----------------

export function leerMetaMedico(observaciones) {
  const meta = leerBloque(observaciones, REGEX_MED);
  return {
    estado_atencion: ESTADOS_ATENCION_VALIDOS.includes(meta.estado_atencion) ? meta.estado_atencion : 'pendiente',
    diagnostico: meta.diagnostico ?? null,
    tratamiento: meta.tratamiento ?? null,
    receta: meta.receta ?? null,
    proxima_cita: meta.proxima_cita ?? null,
  };
}

// Reconstruye observaciones completas manteniendo ambos bloques + texto libre.
export function componerObservaciones({ adm, med, libre }) {
  const partes = [];

  if (adm) {
    const bloque = {
      tipo: TIPOS_ADMISION_VALIDOS.includes(adm.tipo_admision) ? adm.tipo_admision : 'consulta_externa',
      estado: ESTADOS_ADMISION_VALIDOS.includes(adm.estado) ? adm.estado : 'registrada',
      sala: adm.sala_asignada || null,
      enfermero: adm.id_enfermero != null ? Number(adm.id_enfermero) : null,
      verificado: Boolean(adm.datos_verificados),
    };
    partes.push(`[[ADM]]${JSON.stringify(bloque)}[[/ADM]]`);
  }

  if (med) {
    const bloque = {
      estado_atencion: ESTADOS_ATENCION_VALIDOS.includes(med.estado_atencion) ? med.estado_atencion : 'pendiente',
      diagnostico: med.diagnostico || null,
      tratamiento: med.tratamiento || null,
      receta: med.receta || null,
      proxima_cita: med.proxima_cita || null,
    };
    partes.push(`[[MED]]${JSON.stringify(bloque)}[[/MED]]`);
  }

  const textoFinal = (libre || '').trim();
  return `${partes.join(' ')}${textoFinal ? (partes.length ? ' ' : '') + textoFinal : ''}`;
}

export const CONST = {
  TIPOS_ADMISION_VALIDOS,
  ESTADOS_ADMISION_VALIDOS,
  ESTADOS_ATENCION_VALIDOS,
};
