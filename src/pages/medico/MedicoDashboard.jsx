import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconoStethoscope,
  IconoClock,
  IconoCheck,
  IconoCalendar,
  IconoUsers,
  IconoHeart,
  IconoExclamation,
  IconoRefresh,
} from '../../components/Iconos.jsx';

const ESTADO_COLORES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_atencion: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  derivada: 'bg-purple-100 text-purple-800 border-purple-200',
};

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_atencion: 'En atención',
  atendida: 'Atendida',
  derivada: 'Derivada',
};

const ESTADO_CHART_COLOR = {
  pendiente: '#f59e0b',
  en_atencion: '#2563eb',
  atendida: '#16a34a',
  derivada: '#7c3aed',
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <div className={`${color} text-white rounded-lg w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>{icono}</div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mt-2">{valor}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function Barras({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.consultas));
  return (
    <div className="flex items-end justify-between gap-2 h-48 pt-4">
      {serie.map((d) => (
        <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center h-40">
            <div
              className="w-2/3 max-w-[28px] bg-primary rounded-t transition-all"
              style={{ height: `${(d.consultas / max) * 100}%` }}
              title={`${d.consultas} consultas`}
            />
          </div>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{d.etiqueta}</span>
          <span className="text-[10px] font-semibold text-slate-600">{d.consultas}</span>
        </div>
      ))}
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
          const dash = (d.valor / total) * circ;
          const seg = (
            <circle key={d.clave} cx="65" cy="65" r={radio} fill="none" stroke={d.color} strokeWidth="18"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-acumulado} />
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

export default function MedicoDashboard({ usuario }) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      if (!usuario?.id_medico) {
        setError('Tu sesión no tiene un médico asociado. Vuelve a iniciar sesión.');
        setCargando(false);
        return;
      }
      const res = await fetch(`/api/medico/dashboard?id_medico=${usuario.id_medico}`);
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

  const { perfil, kpis, porEstado, serie7dias, alertas, proximasCitas, consultasRecientes } = data;

  const dona = Object.entries(porEstado).map(([clave, valor]) => ({
    clave,
    valor,
    etiqueta: ESTADO_LABEL[clave] || clave,
    color: ESTADO_CHART_COLOR[clave] || '#64748b',
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel Médico</span>
          <h1 className="text-2xl font-bold mt-1">Dr(a). {perfil?.nombre_completo || usuario?.nombre}</h1>
          <p className="text-blue-100 mt-1">{perfil?.especialidad} · Licencia {perfil?.nro_licencia}</p>
        </div>
        <button onClick={cargar} className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg transition backdrop-blur">
          <IconoRefresh className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* KPIs dinámicos */}
      {(() => {
        const tarjetas = [
          { titulo: 'Consultas hoy', valor: kpis.consultasHoy, icono: <IconoStethoscope className="w-5 h-5" />, color: 'bg-blue-500' },
          { titulo: 'Por atender', valor: kpis.pendientes, icono: <IconoClock className="w-5 h-5" />, color: 'bg-amber-500', sub: 'Pendientes / en atención' },
          { titulo: 'Atendidas', valor: kpis.atendidas, icono: <IconoCheck className="w-5 h-5" />, color: 'bg-green-600' },
          { titulo: 'Citas pendientes', valor: kpis.citasPendientes, icono: <IconoCalendar className="w-5 h-5" />, color: 'bg-indigo-500' },
          { titulo: 'Mis pacientes', valor: kpis.totalPacientes, icono: <IconoUsers className="w-5 h-5" />, color: 'bg-slate-700' },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tarjetas.map((k) => (
              <KpiCard key={k.titulo} titulo={k.titulo} valor={k.valor} icono={k.icono} color={k.color} sub={k.sub} />
            ))}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-2">Consultas de los últimos 7 días</h2>
          <Barras serie={serie7dias} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 mb-4">Estado de atenciones</h2>
          <Dona datos={dona} />
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <IconoExclamation className="w-5 h-5" />
            Signos vitales de riesgo en mis pacientes
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Consultas recientes</h2>
            <Link to="/medico/consultas" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todas →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {consultasRecientes.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin consultas.</p>}
            {consultasRecientes.map((c) => (
              <div key={c.id_consulta} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{c.paciente}</p>
                  <p className="text-xs text-slate-400 truncate">{c.motivo || 'Sin motivo'} · {formatearFecha(c.fecha)}</p>
                </div>
                <EstadoBadge estado={c.estado_atencion} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Próximas citas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {proximasCitas.length === 0 && <p className="px-5 py-6 text-slate-400 text-sm">Sin citas próximas.</p>}
            {proximasCitas.map((c) => (
              <div key={c.id_cita} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{c.paciente_nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{c.motivo || 'Consulta'} · {formatearFecha(c.fecha_hora)}</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{c.estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/medico/consultas" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-blue-50 text-blue-600 rounded-xl p-3 group-hover:bg-blue-100 transition-colors">
            <IconoStethoscope className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Mis consultas</h3>
            <p className="text-sm text-slate-500 mt-1">Registrar diagnostico, tratamiento y estado de atencion.</p>
          </div>
        </Link>
        <Link to="/medico/signos" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group flex items-start gap-4">
          <div className="shrink-0 bg-rose-50 text-rose-600 rounded-xl p-3 group-hover:bg-rose-100 transition-colors">
            <IconoHeart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary">Signos vitales</h3>
            <p className="text-sm text-slate-500 mt-1">Consultar los signos vitales de mis pacientes.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
