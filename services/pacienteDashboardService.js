// services/pacienteDashboardService.js
// ============================================================
// CAPA DE LOGICA - Dashboard del paciente.
// Reune KPIs, proximas citas, consultas/atenciones y signos
// vitales del paciente logueado leyendo de la BD real.
// ============================================================
import {
  obtenerCitasPaciente,
  obtenerConsultasPaciente,
  obtenerSignosPaciente,
} from '../repositories/pacienteDashboardRepository.js';

function inicioDelDia(offsetDias = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDias);
  return d;
}

function claveFecha(fechaISO) {
  return new Date(fechaISO).toISOString().slice(0, 10);
}

const ESTADO_CITA_LABEL = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
};

const ESTADO_ATENCION_LABEL = {
  pendiente: 'Pendiente',
  en_atencion: 'En atención',
  atendida: 'Atendida',
  derivada: 'Derivada',
};

export async function obtenerDashboardPaciente(id_paciente) {
  if (!id_paciente) {
    return { ok: false, status: 400, mensaje: 'Falta el identificador del paciente.' };
  }

  const hoy = inicioDelDia(0);
  const hace7 = inicioDelDia(6);
  const ahora = new Date();

  const [citas, consultas, signos] = await Promise.all([
    obtenerCitasPaciente(id_paciente, { limite: 200 }),
    obtenerConsultasPaciente(id_paciente, { limite: 200 }),
    obtenerSignosPaciente(id_paciente, { limite: 100 }),
  ]);

  // ----- KPIs -----
  const citasPendientes = citas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const citasProximas = citas.filter((c) => new Date(c.fecha_hora) >= ahora && (c.estado === 'pendiente' || c.estado === 'confirmada')).length;
  const citasHoy = citas.filter((c) => new Date(c.fecha_hora) >= hoy).length;
  const totalConsultas = consultas.length;
  const consultasAtendidas = consultas.filter((c) => c.estado_atencion === 'atendida').length;
  const totalSignos = signos.length;

  // ----- Proximas citas (futuras, pendientes/confirmadas) -----
  const proximasCitas = citas
    .filter((c) => new Date(c.fecha_hora) >= ahora && (c.estado === 'pendiente' || c.estado === 'confirmada'))
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
    .slice(0, 5);

  // ----- Serie ultimos 7 dias (citas) -----
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = inicioDelDia(i);
    dias.push({
      fecha: d.toISOString().slice(0, 10),
      etiqueta: d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }),
      citas: 0,
    });
  }
  const idx = new Map(dias.map((d, i) => [d.fecha, i]));
  citas.forEach((c) => {
    if (new Date(c.fecha_hora) >= hace7) {
      const i = idx.get(claveFecha(c.fecha_hora));
      if (i != null) dias[i].citas += 1;
    }
  });

  // ----- Ultimas consultas/atenciones -----
  const consultasRecientes = consultas.slice(0, 6).map((c) => ({
    id_consulta: c.id_consulta,
    medico: c.medico_nombre,
    motivo: c.motivo_consulta,
    estado_atencion: c.estado_atencion,
    fecha: c.fecha_consulta,
  }));

  // ----- Signos vitales recientes -----
  const signosRecientes = signos.slice(0, 6).map((s) => ({
    id_signos: s.id_signos,
    presion_arterial: s.presion_arterial,
    temperatura: s.temperatura,
    frecuencia_cardiaca: s.frecuencia_cardiaca,
    fecha: s.fecha_hora,
  }));

  return {
    ok: true,
    status: 200,
    kpis: {
      citasPendientes,
      citasProximas,
      citasHoy,
      totalConsultas,
      consultasAtendidas,
      totalSignos,
      totalCitas: citas.length,
    },
    proximasCitas: proximasCitas.map((c) => ({
      id_cita: c.id_cita,
      medico: c.medico_nombre,
      motivo: c.motivo,
      estado: c.estado,
      fecha_hora: c.fecha_hora,
    })),
    serie7dias: dias,
    consultasRecientes: consultasRecientes.map((c) => ({
      ...c,
      estado_label: ESTADO_ATENCION_LABEL[c.estado_atencion] || c.estado_atencion,
    })),
    signosRecientes,
    estadosCita: ESTADO_CITA_LABEL,
    estadosAtencion: ESTADO_ATENCION_LABEL,
  };
}
