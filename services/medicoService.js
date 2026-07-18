// services/medicoService.js
// ============================================================
// CAPA DE LOGICA - Vista del medico.
// ============================================================
import {
  obtenerConsultasMedico,
  actualizarAtencionMedico,
  obtenerSignosDelMedico,
  obtenerCitasMedico,
  obtenerPerfilMedico,
} from '../repositories/medicoRepository.js';

const ESTADOS_ATENCION = ['pendiente', 'en_atencion', 'atendida', 'derivada'];

function inicioDelDia(offsetDias = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDias);
  return d;
}

function claveFecha(fechaISO) {
  return new Date(fechaISO).toISOString().slice(0, 10);
}

export async function listarConsultasMedico(id_medico) {
  if (!id_medico) return { ok: false, status: 400, mensaje: 'Falta el identificador del médico.' };
  const consultas = await obtenerConsultasMedico(id_medico);
  return { ok: true, status: 200, consultas, estados_atencion: ESTADOS_ATENCION };
}

export async function editarAtencionMedico(id_consulta, id_medico, payload = {}) {
  if (!id_consulta) {
    return { ok: false, status: 400, errores: { general: 'Falta el identificador de la consulta.' } };
  }
  if (payload.estado_atencion !== undefined && !ESTADOS_ATENCION.includes(payload.estado_atencion)) {
    return { ok: false, status: 400, errores: { estado_atencion: 'Estado de atención no válido.' } };
  }

  try {
    const consulta = await actualizarAtencionMedico(id_consulta, id_medico, payload);
    return { ok: true, status: 200, mensaje: 'Atención actualizada correctamente.', consulta };
  } catch (err) {
    return { ok: false, status: 400, errores: { general: err.message } };
  }
}

export async function listarSignosMedico(id_medico) {
  if (!id_medico) return { ok: false, status: 400, mensaje: 'Falta el identificador del médico.' };
  const signos = await obtenerSignosDelMedico(id_medico);
  return { ok: true, status: 200, signos };
}

export async function obtenerDashboardMedico(id_medico) {
  if (!id_medico) return { ok: false, status: 400, mensaje: 'Falta el identificador del médico.' };

  const hoy = inicioDelDia(0);
  const hace7 = inicioDelDia(6);

  const [consultas, signos, citas, perfil] = await Promise.all([
    obtenerConsultasMedico(id_medico, { limite: 300 }),
    obtenerSignosDelMedico(id_medico, { limite: 200 }),
    obtenerCitasMedico(id_medico),
    obtenerPerfilMedico(id_medico),
  ]);

  // KPIs
  const consultasHoy = consultas.filter((c) => new Date(c.fecha_consulta) >= hoy).length;
  const pendientes = consultas.filter((c) => c.estado_atencion === 'pendiente' || c.estado_atencion === 'en_atencion').length;
  const atendidas = consultas.filter((c) => c.estado_atencion === 'atendida').length;
  const citasPendientes = citas.filter((c) => ['pendiente', 'confirmada'].includes(c.estado)).length;
  const totalPacientes = new Set(consultas.map((c) => c.id_paciente)).size;

  // Distribucion por estado de atencion
  const porEstado = {};
  consultas.forEach((c) => {
    porEstado[c.estado_atencion] = (porEstado[c.estado_atencion] || 0) + 1;
  });

  // Serie de 7 dias: consultas por dia
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = inicioDelDia(i);
    dias.push({
      fecha: d.toISOString().slice(0, 10),
      etiqueta: d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' }),
      consultas: 0,
    });
  }
  const idx = new Map(dias.map((d, i) => [d.fecha, i]));
  consultas.forEach((c) => {
    if (new Date(c.fecha_consulta) >= hace7) {
      const i = idx.get(claveFecha(c.fecha_consulta));
      if (i != null) dias[i].consultas += 1;
    }
  });

  // Alertas: signos fuera de rango de sus pacientes
  const alertas = [];
  signos.slice(0, 60).forEach((s) => {
    const motivos = [];
    if (s.temperatura != null && (s.temperatura >= 38 || s.temperatura <= 35)) motivos.push(`Temp ${s.temperatura}°C`);
    if (s.frecuencia_cardiaca != null && (s.frecuencia_cardiaca > 100 || s.frecuencia_cardiaca < 50)) motivos.push(`FC ${s.frecuencia_cardiaca} lpm`);
    if (s.presion_arterial) {
      const p = s.presion_arterial.split('/').map((n) => parseInt(n, 10));
      if (p[0] >= 140 || p[1] >= 90) motivos.push(`PA ${s.presion_arterial}`);
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

  // Proximas citas (futuras, pendientes/confirmadas)
  const ahora = new Date();
  const proximasCitas = citas
    .filter((c) => new Date(c.fecha_hora) >= ahora && ['pendiente', 'confirmada'].includes(c.estado))
    .slice(0, 6);

  return {
    ok: true,
    status: 200,
    perfil,
    kpis: {
      consultasHoy,
      pendientes,
      atendidas,
      citasPendientes,
      totalPacientes,
      totalConsultas: consultas.length,
    },
    porEstado,
    serie7dias: dias,
    alertas: alertas.slice(0, 6),
    proximasCitas,
    consultasRecientes: consultas.slice(0, 8).map((c) => ({
      id_consulta: c.id_consulta,
      paciente: `${c.paciente_nombre} ${c.paciente_apellido}`.trim(),
      motivo: c.motivo_consulta,
      estado_atencion: c.estado_atencion,
      fecha: c.fecha_consulta,
    })),
  };
}
