import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconoBeaker,
  IconoClock,
  IconoExclamation,
  IconoCheck,
  IconoChart,
  IconoUsers,
  IconoUser,
  IconoCog,
  IconoRefresh,
  IconoX,
} from '../../components/Iconos.jsx';

const ESTADO_COLORES = {
  pendiente: 'bg-slate-100 text-slate-700 border-slate-200',
  en_proceso: 'bg-blue-100 text-blue-800 border-blue-200',
  completado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORES[estado] || ESTADO_COLORES.pendiente}`}>
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

export default function TecnicoLaboratorioDashboard({ usuario }) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const url = usuario?.id_tecnico_laboratorio
        ? `/api/tecnico-laboratorio/dashboard?id_tecnico_laboratorio=${usuario.id_tecnico_laboratorio}`
        : '/api/tecnico-laboratorio/dashboard';
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
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
        <span className="flex items-center gap-2"><IconoExclamation className="w-5 h-5" /> {error}</span>
        <button onClick={cargar} className="ml-3 underline font-medium">Reintentar</button>
      </div>
    );
  }

  const { kpis, porEstado, porTipo, recientes } = data;

  const donaEstado = Object.entries(porEstado).map(([clave, valor]) => ({
    clave,
    valor,
    etiqueta: ESTADO_LABEL[clave] || clave,
    color:
      clave === 'pendiente' ? '#f59e0b' :
      clave === 'en_proceso' ? '#3b82f6' :
      clave === 'completado' ? '#22c55e' :
      clave === 'cancelado' ? '#ef4444' : '#64748b',
  }));

  const donaTipo = Object.entries(porTipo).map(([clave, valor], i) => ({
    clave,
    valor,
    etiqueta: clave,
    color: ['#0ea5e9', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#14b8a6', '#ec4899'][i % 7],
  }));

  const kpiTarjetas = [
    { titulo: 'Análisis hoy', valor: kpis.analisisHoy, icono: <IconoClock className="w-5 h-5" />, color: 'bg-blue-500', sub: 'Registrados hoy' },
    { titulo: 'Pendientes', valor: kpis.pendientes, icono: <IconoExclamation className="w-5 h-5" />, color: 'bg-amber-500', sub: 'Por procesar' },
    { titulo: 'En proceso', valor: kpis.enProceso, icono: <IconoBeaker className="w-5 h-5" />, color: 'bg-indigo-500' },
    { titulo: 'Completados', valor: kpis.completados, icono: <IconoCheck className="w-5 h-5" />, color: 'bg-emerald-500' },
    { titulo: 'Total análisis', valor: kpis.total, icono: <IconoChart className="w-5 h-5" />, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel de Laboratorio</span>
          <h1 className="text-2xl font-bold mt-1">Bienvenido(a), {usuario?.nombre || usuario?.correo}</h1>
          <p className="text-blue-100 mt-1">Resumen de análisis de laboratorio en tiempo real.</p>
        </div>
        <button
          onClick={cargar}
          className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg transition backdrop-blur flex items-center gap-2"
        >
          <IconoRefresh className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiTarjetas.map((k) => (
          <KpiCard key={k.titulo} titulo={k.titulo} valor={k.valor} icono={k.icono} color={k.color} sub={k.sub} />
        ))}
      </div>

      {/* Gráficos y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-700">Análisis recientes</h2>
            <Link to="/laboratorio/analisis" className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1">
              Ver todos <IconoChart className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recientes.length === 0 && <p className="py-6 text-slate-400 text-sm text-center">Sin análisis registrados.</p>}
            {recientes.map((a) => (
              <div key={a.id_analisis} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{a.paciente_nombre}</p>
                  <p className="text-xs text-slate-400">{a.tipo_analisis} · {formatearFecha(a.fecha_solicitud)}</p>
                </div>
                <EstadoBadge estado={a.estado} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4">Por estado</h2>
            <Dona datos={donaEstado} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4">Por tipo de análisis</h2>
            <Dona datos={donaTipo} />
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/laboratorio/analisis" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-primary mb-2"><IconoBeaker className="w-8 h-8" /></div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Análisis de laboratorio</h3>
            <p className="text-sm text-slate-500 mt-1">Registrar, editar y dar seguimiento a análisis clínicos.</p>
          </Link>
          <Link to="/laboratorio/pacientes" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-primary mb-2"><IconoUsers className="w-8 h-8" /></div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Pacientes</h3>
            <p className="text-sm text-slate-500 mt-1">Consultar y administrar pacientes registrados.</p>
          </Link>
          <Link to="/laboratorio/perfil" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-primary mb-2"><IconoCog className="w-8 h-8" /></div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Mi perfil</h3>
            <p className="text-sm text-slate-500 mt-1">Actualiza tu correo y contraseña.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
