import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconoClipboardDocument,
  IconoClock,
  IconoExclamation,
  IconoHeart,
  IconoChart,
  IconoUsers,
  IconoCog,
} from '../../components/Iconos.jsx';

const ESTADO_COLORES = {
  registrada: 'bg-slate-100 text-slate-700 border-slate-200',
  en_triage: 'bg-amber-100 text-amber-800 border-amber-200',
  asignada: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_LABEL = {
  registrada: 'Registrada',
  en_triage: 'En triage',
  asignada: 'Asignada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

const TIPO_LABEL = {
  consulta_externa: 'Consulta externa',
  emergencia: 'Emergencia',
  hospitalizacion: 'Hospitalización',
};

const TIPO_COLOR = {
  consulta_externa: '#2563eb',
  emergencia: '#dc2626',
  hospitalizacion: '#7c3aed',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORES[estado] || ESTADO_COLORES.registrada}`}>
      {ESTADO_LABEL[estado] || estado}
    </span>
  );
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

// Grafico de barras simple con CSS (admisiones vs signos por dia)
function Barras({ serie }) {
  const max = Math.max(1, ...serie.flatMap((d) => [d.admisiones, d.signos]));
  return (
    <div className="flex items-end justify-between gap-2 h-48 pt-4">
      {serie.map((d) => (
        <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center gap-1 h-40">
            <div
              className="w-1/2 max-w-[18px] bg-primary rounded-t transition-all"
              style={{ height: `${(d.admisiones / max) * 100}%` }}
              title={`${d.admisiones} admisiones`}
            />
            <div
              className="w-1/2 max-w-[18px] bg-rose-400 rounded-t transition-all"
              style={{ height: `${(d.signos / max) * 100}%` }}
              title={`${d.signos} signos`}
            />
          </div>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{d.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}

// Grafico de dona con SVG para distribucion por tipo
function Dona({ datos }) {
  const total = datos.reduce((s, d) => s + d.valor, 0) || 1;
  let acumulado = 0;
  const radio = 50;
  const circ = 2 * Math.PI * radio;

  return (
    <div className="flex items-center gap-6">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        {datos.map((d) => {
          const fraccion = d.valor / total;
          const dash = fraccion * circ;
          const seg = (
            <circle
              key={d.clave}
              cx="65"
              cy="65"
              r={radio}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-acumulado}
            />
          );
          acumulado += dash;
          return seg;
        })}
        <circle cx="65" cy="65" r="34" fill="white" />
      </svg>
      <div className="space-y-1.5">
        {datos.map((d) => (
          <div key={d.clave} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.etiqueta}</span>
            <span className="font-semibold text-slate-800">{d.valor}</span>
          </div>
        ))}
        {datos.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
      </div>
    </div>
  );
}

export default function EnfermeroDashboard({ usuario }) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const url = usuario?.id_enfermero
        ? `/api/dashboard/enfermeria?id_enfermero=${usuario.id_enfermero}`
        : '/api/dashboard/enfermeria';
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) setData(json);
      else setError(json.mensaje || 'No se pudo cargar el dashboard.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
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

  const { kpis, porEstado, porTipo, serie7dias, alertas, admisionesRecientes, signosRecientes } = data;

  const donaTipo = Object.entries(porTipo).map(([clave, valor]) => ({
    clave,
    valor,
    etiqueta: TIPO_LABEL[clave] || clave,
    color: TIPO_COLOR[clave] || '#64748b',
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel de Enfermería</span>
          <h1 className="text-2xl font-bold mt-1">Bienvenido(a), {usuario?.nombre || usuario?.correo}</h1>
          <p className="text-blue-100 mt-1">Resumen operativo de admisiones y signos vitales en tiempo real.</p>
        </div>
        <button
          onClick={cargar}
          className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg transition backdrop-blur"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard titulo="Admisiones hoy" valor={kpis.admisionesHoy} icono={<IconoClipboardDocument className="w-5 h-5" />} color="bg-blue-500" />
        <KpiCard titulo="Pendientes" valor={kpis.admisionesPendientes} icono={<IconoClock className="w-5 h-5" />} color="bg-amber-500" sub="Registradas / en triage" />
        <KpiCard titulo="Sin verificar" valor={kpis.admisionesSinVerificar} icono={<IconoExclamation className="w-5 h-5" />} color="bg-orange-500" />
        <KpiCard titulo="Signos hoy" valor={kpis.signosHoy} icono={<IconoHeart className="w-5 h-5" />} color="bg-rose-500" />
        <KpiCard titulo="Total admisiones" valor={kpis.totalAdmisiones} icono={<IconoChart className="w-5 h-5" />} color="bg-slate-700" />
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-700">Actividad de los últimos 7 días</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary" /> Admisiones</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-400" /> Signos vitales</span>
            </div>
          </div>
          <Barras serie={serie7dias} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">Admisiones por tipo</h2>
          <Dona datos={donaTipo} />
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase">Por estado</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(porEstado).map(([estado, valor]) => (
                <span key={estado} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ESTADO_COLORES[estado] || ESTADO_COLORES.registrada}`}>
                  {ESTADO_LABEL[estado] || estado}: {valor}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas clinicas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <IconoExclamation className="w-5 h-5" />
            Signos vitales fuera de rango
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertas.map((a) => (
              <div key={a.id_signos} className="bg-white rounded-lg border border-red-200 p-3">
                <p className="font-medium text-slate-800">{a.paciente}</p>
                <p className="text-xs text-slate-400">{formatearFecha(a.fecha)}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.motivos.map((m, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Admisiones recientes</h2>
            <Link to="/enfermeria/admisiones" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todas →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {admisionesRecientes.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin admisiones.</p>}
            {admisionesRecientes.map((a) => (
              <div key={a.id_admision} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{a.paciente}</p>
                  <p className="text-xs text-slate-400">{TIPO_LABEL[a.tipo] || a.tipo} · {formatearFecha(a.fecha)}</p>
                </div>
                <EstadoBadge estado={a.estado} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Signos vitales recientes</h2>
            <Link to="/enfermeria/signos-vitales" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {signosRecientes.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin registros.</p>}
            {signosRecientes.map((s) => (
              <div key={s.id_signos} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{s.paciente}</p>
                  <p className="text-xs text-slate-400">{formatearFecha(s.fecha)}</p>
                </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/enfermeria/admisiones" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-blue-50 text-blue-600 rounded-xl p-3 group-hover:bg-blue-100 transition-colors">
            <IconoClipboardDocument className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Gestion de admision</h3>
            <p className="text-sm text-slate-500 mt-1">Registrar, editar y dar seguimiento a admisiones.</p>
          </div>
        </Link>
        <Link to="/enfermeria/signos-vitales" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-rose-50 text-rose-600 rounded-xl p-3 group-hover:bg-rose-100 transition-colors">
            <IconoHeart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Signos vitales</h3>
            <p className="text-sm text-slate-500 mt-1">Registrar presion, temperatura y frecuencia cardiaca.</p>
          </div>
        </Link>
        <Link to="/enfermeria/pacientes" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-amber-50 text-amber-600 rounded-xl p-3 group-hover:bg-amber-100 transition-colors">
            <IconoUsers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Pacientes</h3>
            <p className="text-sm text-slate-500 mt-1">Consultar y administrar pacientes registrados.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
