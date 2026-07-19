import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerUsuario } from '../../lib/authSession.js';
import {
  IconoCalendar,
  IconoClock,
  IconoChart,
  IconoStethoscope,
  IconoHeart,
  IconoUser,
  IconoCog,
  IconoClipboardDocument,
  IconoDocumentText,
} from '../../components/Iconos.jsx';

const ESTADO_CITA_COLORES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmada: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
};

const ESTADO_ATENCION_COLORES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_atencion: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  derivada: 'bg-purple-100 text-purple-800 border-purple-200',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function KpiCard({ titulo, valor, icono, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <div className={`${color} text-white rounded-lg w-9 h-9 flex items-center justify-center`}>{icono}</div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mt-2">{valor}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarrasCitas({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.citas));
  return (
    <div className="flex items-end justify-between gap-2 h-48 pt-4">
      {serie.map((d) => (
        <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center h-40">
            <div
              className="w-2/3 max-w-[22px] bg-primary rounded-t transition-all"
              style={{ height: `${(d.citas / max) * 100}%` }}
              title={`${d.citas} citas`}
            />
          </div>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}

export default function PacienteDashboard({ usuario }) {
  const [idPaciente, setIdPaciente] = useState(null);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const resId = await fetch('/api/pacientes/mi-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario }),
      });
      const jsonId = await resId.json();
      if (!jsonId.ok) throw new Error(jsonId.mensaje || 'No se encontro tu perfil.');
      setIdPaciente(jsonId.id_paciente);

      const res = await fetch(`/api/paciente/dashboard?id_paciente=${jsonId.id_paciente}`);
      const json = await res.json();
      if (json.ok) setData(json);
      else setError(json.mensaje || 'No se pudo cargar el dashboard.');
    } catch (e) {
      setError(e.message || 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error}
        <button onClick={cargar} className="ml-3 underline font-medium">Reintentar</button>
      </div>
    );
  }

  const { kpis, proximasCitas, serie7dias, consultasRecientes, signosRecientes, estadosCita, estadosAtencion } = data;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel del Paciente</span>
          <h1 className="text-2xl font-bold mt-1">Bienvenido(a), {usuario?.nombre || usuario?.correo}</h1>
          <p className="text-blue-100 mt-1">Consulta tus citas, atenciones y signos vitales en un solo lugar.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargar}
            className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg transition backdrop-blur"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard titulo="Citas pendientes" valor={kpis.citasPendientes} icono={<IconoCalendar className="w-5 h-5" />} color="bg-amber-500" />
        <KpiCard titulo="Proximas citas" valor={kpis.citasProximas} icono={<IconoClock className="w-5 h-5" />} color="bg-blue-500" sub="Pendiente/confirmada" />
        <KpiCard titulo="Citas hoy" valor={kpis.citasHoy} icono={<IconoCalendar className="w-5 h-5" />} color="bg-indigo-500" />
        <KpiCard titulo="Total citas" valor={kpis.totalCitas} icono={<IconoChart className="w-5 h-5" />} color="bg-slate-700" />
        <KpiCard titulo="Atenciones" valor={kpis.totalConsultas} icono={<IconoStethoscope className="w-5 h-5" />} color="bg-emerald-500" sub={`${kpis.consultasAtendidas} atendidas`} />
        <KpiCard titulo="Signos registrados" valor={kpis.totalSignos} icono={<IconoHeart className="w-5 h-5" />} color="bg-rose-500" />
      </div>

      {/* Grafico + proximas citas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-2">Actividad de los ultimos 7 dias</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> Citas</span>
          </div>
          <BarrasCitas serie={serie7dias} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Proximas citas</h2>
            <Link to="/paciente/citas" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todas →</Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-auto">
            {proximasCitas.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">No tienes citas proximas.</p>}
            {proximasCitas.map((c) => (
              <div key={c.id_cita} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800 truncate">{c.medico}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CITA_COLORES[c.estado] || ESTADO_CITA_COLORES.pendiente}`}>
                    {estadosCita[c.estado] || c.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{formatearFecha(c.fecha_hora)}</p>
                {c.motivo && <p className="text-xs text-slate-500 mt-1 truncate">{c.motivo}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Ultimas atenciones</h2>
            <Link to="/paciente/citas" className="text-sm text-primary hover:text-primary-dark font-medium">Ver historial →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {consultasRecientes.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin atenciones registradas.</p>}
            {consultasRecientes.map((c) => (
              <div key={c.id_consulta} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{c.medico}</p>
                  <p className="text-xs text-slate-400">{formatearFecha(c.fecha)}</p>
                  {c.motivo && <p className="text-xs text-slate-500 truncate">{c.motivo}</p>}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_ATENCION_COLORES[c.estado_atencion] || ESTADO_ATENCION_COLORES.pendiente}`}>
                  {c.estado_label || c.estado_atencion}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Signos vitales recientes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {signosRecientes.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin registros.</p>}
            {signosRecientes.map((s) => (
              <div key={s.id_signos} className="px-5 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">{formatearFecha(s.fecha)}</p>
                <div className="flex gap-2 text-xs whitespace-nowrap">
                  {s.presion_arterial && <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">PA {s.presion_arterial}</span>}
                  {s.temperatura != null && <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.temperatura}°C</span>}
                  {s.frecuencia_cardiaca != null && <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{s.frecuencia_cardiaca} lpm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      {/* Accesos rapidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/paciente/cita" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-sky-50 text-sky-600 rounded-xl p-3 group-hover:bg-sky-100 transition-colors">
            <IconoCalendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Solicitar cita</h3>
            <p className="text-sm text-slate-500 mt-1">Agenda una nueva consulta médica.</p>
          </div>
        </Link>
        <Link to="/paciente/citas" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-violet-50 text-violet-600 rounded-xl p-3 group-hover:bg-violet-100 transition-colors">
            <IconoClipboardDocument className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Mis citas</h3>
            <p className="text-sm text-slate-500 mt-1">Revisa el estado de tus citas y atenciones.</p>
          </div>
        </Link>
        <Link to="/paciente/historial" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-emerald-50 text-emerald-600 rounded-xl p-3 group-hover:bg-emerald-100 transition-colors">
            <IconoDocumentText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Mi Historial</h3>
            <p className="text-sm text-slate-500 mt-1">Revisa tus diagnósticos y tratamientos médicos.</p>
          </div>
        </Link>
        <Link to="/paciente/perfil" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-slate-100 text-slate-600 rounded-xl p-3 group-hover:bg-slate-200 transition-colors">
            <IconoUser className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Mi perfil</h3>
            <p className="text-sm text-slate-500 mt-1">Edita tu correo, contraseña y datos de contacto.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
