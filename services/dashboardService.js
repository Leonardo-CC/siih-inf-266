// services/dashboardService.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function obtenerEstadisticas(rol, usuario) {
  const stats = {
    paciente: await statsPaciente(usuario),
    enfermero: await statsEnfermero(),
    medico: await statsMedico(),
    administrativo: await statsAdmin(),
    farmaceutico: await statsFarmaceutico(),
    direccion: await statsDireccion(),
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

  const { count: totalAdmisiones } = await supabaseAdmin
    .from('consulta')
    .select('*', { count: 'exact', head: true });

  const { count: totalCitas } = await supabaseAdmin
    .from('cita')
    .select('*', { count: 'exact', head: true });

  return {
    tarjetas: [
      { titulo: 'Pacientes', valor: totalPacientes ?? 0, icono: '👥', link: '/paciente/registro' },
      { titulo: 'Admisiones', valor: totalAdmisiones ?? 0, icono: '📋', link: '/enfermeria/admisiones' },
      { titulo: 'Citas', valor: totalCitas ?? 0, icono: '📅', link: '/paciente/cita' },
    ],
    actividadReciente: [],
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

async function statsDireccion() {
  const { count: totalPacientes } = await supabaseAdmin
    .from('paciente')
    .select('*', { count: 'exact', head: true });

  const { count: totalAdmisiones } = await supabaseAdmin
    .from('consulta')
    .select('*', { count: 'exact', head: true });

  return {
    tarjetas: [
      { titulo: 'Pacientes totales', valor: totalPacientes ?? 0, icono: '👥', link: '/dashboard' },
      { titulo: 'Consultas totales', valor: totalAdmisiones ?? 0, icono: '🩺', link: '/dashboard' },
    ],
    actividadReciente: [],
  };
}
