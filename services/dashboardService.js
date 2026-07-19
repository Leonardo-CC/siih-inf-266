// services/dashboardService.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerEstadisticas(rol, usuario) {
  const stats = {
    paciente: await statsPaciente(usuario),
    enfermero: await statsEnfermero(),
    medico: await statsMedico(),
    administrativo: await statsAdmin(),
    farmaceutico: await statsFarmaceutico(),
  };

  return stats[rol] || stats.paciente;
}

async function statsPaciente(usuario) {
  const personaId = usuario.persona_id;

  const { count: totalCitas } = await supabaseAdmin
    .from('cita')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', personaId);

  const { count: citasPendientes } = await supabaseAdmin
    .from('cita')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', personaId)
    .in('estado', ['pendiente', 'confirmada']);

  const { data: proximaCita } = await supabaseAdmin
    .from('cita')
    .select('fecha_hora, estado')
    .eq('id_paciente', personaId)
    .in('estado', ['pendiente', 'confirmada'])
    .gte('fecha_hora', new Date().toISOString())
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    tarjetas: [
      { titulo: 'Proxima cita', valor: proximaCita ? new Date(proximaCita.fecha_hora).toLocaleDateString('es-BO') : 'Sin citas', icono: '📅', link: '/paciente/cita' },
      { titulo: 'Citas pendientes', valor: citasPendientes ?? 0, icono: '📋', link: '/paciente/cita' },
      { titulo: 'Total citas', valor: totalCitas ?? 0, icono: '📊', link: '/paciente/cita' },
    ],
    actividadReciente: [],
  };
}

async function statsEnfermero() {
  const { count: admisionesPendientes } = await supabaseAdmin
    .from('cita')
    .select('consulta:id_consulta (id_consulta)', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'confirmada'])
    .is('consulta.id_consulta', null);

  const { count: signosHoy } = await supabaseAdmin
    .from('signos_vitales')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', new Date().toISOString().split('T')[0]);

  const { count: totalSignos } = await supabaseAdmin
    .from('signos_vitales')
    .select('*', { count: 'exact', head: true });

  return {
    tarjetas: [
      { titulo: 'Admisiones pendientes', valor: admisionesPendientes ?? 0, icono: '📋', link: '/enfermeria/admisiones' },
      { titulo: 'Signos hoy', valor: signosHoy ?? 0, icono: '❤️', link: '/enfermeria/signos-vitales' },
      { titulo: 'Total registros', valor: totalSignos ?? 0, icono: '📊', link: '/enfermeria/signos-vitales' },
    ],
    actividadReciente: [],
  };
}

async function statsMedico() {
  const { count: consultasActivas } = await supabaseAdmin
    .from('consulta')
    .select('*', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'confirmada']);

  const { count: signosSinRevisar } = await supabaseAdmin
    .from('signos_vitales')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', new Date().toISOString().split('T')[0]);

  return {
    tarjetas: [
      { titulo: 'Consultas activas', valor: consultasActivas ?? 0, icono: '🩺', link: '/enfermeria/admisiones' },
      { titulo: 'Signos registrados hoy', valor: signosSinRevisar ?? 0, icono: '❤️', link: '/enfermeria/signos-vitales' },
    ],
    actividadReciente: [],
  };
}

async function statsAdmin() {
  const { count: totalPacientes } = await supabaseAdmin
    .from('paciente')
    .select('*', { count: 'exact', head: true });

  const { count: totalUsuarios } = await supabaseAdmin
    .from('usuario')
    .select('*', { count: 'exact', head: true });

  const { count: totalCitas } = await supabaseAdmin
    .from('cita')
    .select('*', { count: 'exact', head: true });

  const { count: citasPendientes } = await supabaseAdmin
    .from('cita')
    .select('*', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'confirmada']);

  const { count: admisionesHoy } = await supabaseAdmin
    .from('consulta')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_hora', new Date().toISOString().split('T')[0]);

  const { data: actividad } = await supabaseAdmin
    .from('cita')
    .select(`
      id_cita,
      fecha_hora,
      estado,
      paciente:id_paciente (
        persona:persona_id (nombre, apellido)
      ),
      medico:id_medico (
        persona:persona_id (nombre, apellido)
      )
    `)
    .order('fecha_hora', { ascending: false })
    .limit(6);

  // Distribucion de citas por estado (para grafica de dona)
  const { data: citasEstado } = await supabaseAdmin
    .from('cita')
    .select('estado');

  const distribucionCitas = [
    { label: 'Pendientes', valor: (citasEstado || []).filter((c) => c.estado === 'pendiente').length, color: '#f59e0b' },
    { label: 'Confirmadas', valor: (citasEstado || []).filter((c) => c.estado === 'confirmada').length, color: '#0ea5e9' },
    { label: 'Atendidas', valor: (citasEstado || []).filter((c) => c.estado === 'atendida').length, color: '#10b981' },
    { label: 'Canceladas', valor: (citasEstado || []).filter((c) => c.estado === 'cancelada').length, color: '#f43f5e' },
  ];

  // Usuarios por rol (para grafica de barras)
  const { data: usuariosRol } = await supabaseAdmin
    .from('usuario')
    .select('rol');

  const conteoRol = {};
  (usuariosRol || []).forEach((u) => {
    conteoRol[u.rol] = (conteoRol[u.rol] || 0) + 1;
  });
  const usuariosPorRol = Object.entries(conteoRol).map(([rol, valor]) => ({
    label: rol.charAt(0).toUpperCase() + rol.slice(1),
    valor,
  }));

  return {
    tarjetas: [
      { titulo: 'Pacientes', valor: totalPacientes ?? 0, icono: '👥', color: 'bg-sky-500', link: '/admin/pacientes' },
      { titulo: 'Usuarios', valor: totalUsuarios ?? 0, icono: '🧑‍💼', color: 'bg-violet-500', link: '/admin/usuarios' },
      { titulo: 'Citas', valor: totalCitas ?? 0, icono: '📅', color: 'bg-emerald-500', link: '/admin/citas' },
      { titulo: 'Citas pendientes', valor: citasPendientes ?? 0, icono: '⏳', color: 'bg-amber-500', link: '/admin/citas' },
      { titulo: 'Admisiones hoy', valor: admisionesHoy ?? 0, icono: '📋', color: 'bg-rose-500', link: '/admin/admisiones' },
    ],
    distribucionCitas,
    usuariosPorRol,
    actividadReciente: (actividad || []).map((c) => ({
      id: c.id_cita,
      titulo: c.paciente?.persona ? `${c.paciente.persona.nombre} ${c.paciente.persona.apellido}` : `Paciente #${c.id_paciente}`,
      subtitulo: c.medico?.persona ? `Dr(a). ${c.medico.persona.nombre} ${c.medico.persona.apellido}` : 'Sin médico',
      estado: c.estado,
      fecha: c.fecha_hora,
    })),
  };
}

async function statsFarmaceutico() {
  return {
    tarjetas: [
      { titulo: 'Inventario', valor: '0', icono: '💊', link: '/dashboard' },
      { titulo: 'Recetas pendientes', valor: '0', icono: '📝', link: '/dashboard' },
    ],
    actividadReciente: [],
  };
}
