// services/enfermeriaDashboardService.js
// ============================================================
// Dashboard interactivo del enfermero.
// Reune KPIs, series para graficos y listas recientes leyendo
// directamente de la BD real (consulta + signos_vitales).
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { parsearObservaciones } from '../repositories/admisionRepository.js';

function inicioDelDia(offsetDias = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDias);
  return d;
}

function claveFecha(fechaISO) {
  return new Date(fechaISO).toISOString().slice(0, 10);
}

export async function obtenerDashboardEnfermeria(filtro = {}) {
  const hoy = inicioDelDia(0);
  const hace7 = inicioDelDia(6);

  // --- Admisiones (via consulta) de los ultimos ~60 dias, hasta 300 filas ---
  const { data: consultas, error: errC } = await supabaseAdmin
    .from('consulta')
    .select('id_consulta, id_paciente, id_medico, fecha_consulta, motivo_consulta, observaciones')
    .order('fecha_consulta', { ascending: false })
    .limit(300);

  if (errC) throw new Error(`Error cargando admisiones: ${errC.message}`);

  let admisiones = (consultas || []).map((c) => {
    const meta = parsearObservaciones(c.observaciones);
    return {
      id_admision: c.id_consulta,
      id_paciente: c.id_paciente,
      id_medico: c.id_medico,
      id_enfermero: meta.id_enfermero,
      fecha: c.fecha_consulta,
      motivo: c.motivo_consulta,
      tipo: meta.tipo_admision,
      estado: meta.estado,
      verificado: meta.datos_verificados,
      sala: meta.sala_asignada,
    };
  });

  // Solo las admisiones del enfermero logueado, si se indica.
  if (filtro.id_enfermero) {
    admisiones = admisiones.filter((a) => a.id_enfermero === Number(filtro.id_enfermero));
  }

  // --- Signos vitales recientes ---
  let signosQuery = supabaseAdmin
    .from('vw_signos_vitales')
    .select('*')
    .order('fecha_hora', { ascending: false })
    .limit(200);

  if (filtro.id_enfermero) {
    signosQuery = signosQuery.eq('id_enfermero', filtro.id_enfermero);
  }

  const { data: signos, error: errS } = await signosQuery;

  if (errS) throw new Error(`Error cargando signos vitales: ${errS.message}`);

  const signosVitales = signos || [];

  // ----- KPIs -----
  const admisionesHoy = admisiones.filter((a) => new Date(a.fecha) >= hoy).length;
  const admisionesPendientes = admisiones.filter(
    (a) => a.estado === 'registrada' || a.estado === 'en_triage'
  ).length;
  const admisionesSinVerificar = admisiones.filter((a) => !a.verificado).length;
  const signosHoy = signosVitales.filter((s) => new Date(s.fecha_hora) >= hoy).length;
  const totalSignos = signosVitales.length;

  // ----- Distribucion por estado -----
  const porEstado = {};
  admisiones.forEach((a) => {
    porEstado[a.estado] = (porEstado[a.estado] || 0) + 1;
  });

  // ----- Distribucion por tipo -----
  const porTipo = {};
  admisiones.forEach((a) => {
    porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
  });

  // ----- Serie ultimos 7 dias (admisiones vs signos) -----
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = inicioDelDia(i);
    const clave = d.toISOString().slice(0, 10);
    dias.push({
      fecha: clave,
      etiqueta: d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }),
      admisiones: 0,
      signos: 0,
    });
  }
  const indicePorFecha = new Map(dias.map((d, i) => [d.fecha, i]));

  admisiones.forEach((a) => {
    if (new Date(a.fecha) >= hace7) {
      const idx = indicePorFecha.get(claveFecha(a.fecha));
      if (idx != null) dias[idx].admisiones += 1;
    }
  });
  signosVitales.forEach((s) => {
    if (new Date(s.fecha_hora) >= hace7) {
      const idx = indicePorFecha.get(claveFecha(s.fecha_hora));
      if (idx != null) dias[idx].signos += 1;
    }
  });

  // ----- Alertas de signos fuera de rango (recientes) -----
  const alertas = [];
  signosVitales.slice(0, 60).forEach((s) => {
    const motivos = [];
    if (s.temperatura != null && (s.temperatura >= 38 || s.temperatura <= 35)) {
      motivos.push(`Temp ${s.temperatura}°C`);
    }
    if (s.frecuencia_cardiaca != null && (s.frecuencia_cardiaca > 100 || s.frecuencia_cardiaca < 50)) {
      motivos.push(`FC ${s.frecuencia_cardiaca} lpm`);
    }
    if (s.presion_arterial) {
      const partes = s.presion_arterial.split('/').map((n) => parseInt(n, 10));
      if (partes[0] >= 140 || partes[1] >= 90) motivos.push(`PA ${s.presion_arterial}`);
    }
    if (motivos.length) {
      alertas.push({
        id_signos: s.id_signos,
        paciente: `${s.paciente_nombre || ''} ${s.paciente_apellido || ''}`.trim(),
        fecha: s.fecha_hora,
        motivos,
      });
    }
  });

  // ----- Enriquecer nombres de pacientes para admisiones recientes -----
  const admisionesRecientes = admisiones.slice(0, 8);
  const pacienteIds = [...new Set(admisionesRecientes.map((a) => a.id_paciente))];
  let pacientesMap = new Map();
  if (pacienteIds.length) {
    const { data: pacs } = await supabaseAdmin
      .from('paciente')
      .select('id_paciente, persona:persona_id (nombre, apellido)')
      .in('id_paciente', pacienteIds);
    pacientesMap = new Map(
      (pacs || []).map((p) => [
        p.id_paciente,
        `${p.persona?.nombre || ''} ${p.persona?.apellido || ''}`.trim(),
      ])
    );
  }

  return {
    ok: true,
    status: 200,
    kpis: {
      admisionesHoy,
      admisionesPendientes,
      admisionesSinVerificar,
      signosHoy,
      totalSignos,
      totalAdmisiones: admisiones.length,
    },
    porEstado,
    porTipo,
    serie7dias: dias,
    alertas: alertas.slice(0, 6),
    admisionesRecientes: admisionesRecientes.map((a) => ({
      id_admision: a.id_admision,
      paciente: pacientesMap.get(a.id_paciente) || `Paciente #${a.id_paciente}`,
      tipo: a.tipo,
      estado: a.estado,
      verificado: a.verificado,
      fecha: a.fecha,
    })),
    signosRecientes: signosVitales.slice(0, 8).map((s) => ({
      id_signos: s.id_signos,
      paciente: `${s.paciente_nombre || ''} ${s.paciente_apellido || ''}`.trim(),
      presion_arterial: s.presion_arterial,
      temperatura: s.temperatura,
      frecuencia_cardiaca: s.frecuencia_cardiaca,
      fecha: s.fecha_hora,
    })),
  };
}
