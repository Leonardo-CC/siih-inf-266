import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import TablaCRUD from '../../components/TablaCRUD.jsx';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function claseTemperatura(v) {
  if (v == null) return 'text-slate-400';
  if (v >= 38 || v <= 35) return 'text-red-600 font-semibold';
  if (v >= 37.5) return 'text-amber-600 font-medium';
  return 'text-slate-700';
}
function claseFrecuencia(v) {
  if (v == null) return 'text-slate-400';
  if (v > 100 || v < 50) return 'text-red-600 font-semibold';
  if (v > 90 || v < 60) return 'text-amber-600 font-medium';
  return 'text-slate-700';
}
function clasePresion(v) {
  if (!v) return 'text-slate-400';
  const p = v.split('/').map((n) => parseInt(n, 10));
  if (p[0] >= 140 || p[1] >= 90) return 'text-red-600 font-semibold';
  if (p[0] >= 130 || p[1] >= 85) return 'text-amber-600 font-medium';
  return 'text-slate-700';
}

export default function SignosVitalesMedico() {
  const usuario = obtenerUsuario();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      if (!usuario?.id_medico) {
        setErrorGeneral('Tu sesión no tiene un médico asociado. Vuelve a iniciar sesión.');
        setCargando(false);
        return;
      }
      const res = await fetch(`/api/medico/signos?id_medico=${usuario.id_medico}`);
      const data = await res.json();
      if (data.ok) setRegistros(data.signos || []);
      else setErrorGeneral(data.mensaje || 'No se pudieron cargar los signos vitales.');
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function esAlerta(r) {
    const tempMal = r.temperatura != null && (r.temperatura >= 38 || r.temperatura <= 35);
    const fcMal = r.frecuencia_cardiaca != null && (r.frecuencia_cardiaca > 100 || r.frecuencia_cardiaca < 50);
    let paMal = false;
    if (r.presion_arterial) {
      const p = r.presion_arterial.split('/').map((n) => parseInt(n, 10));
      paMal = p[0] >= 140 || p[1] >= 90;
    }
    return tempMal || fcMal || paMal;
  }

  const filtrados = registros.filter((r) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto = !texto || `${r.paciente_nombre || ''} ${r.paciente_apellido || ''}`.toLowerCase().includes(texto);
    return coincideTexto && (!soloAlertas || esAlerta(r));
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Signos Vitales de mis Pacientes</h1>
          <p className="text-blue-100 mt-1 text-sm">Consulta los signos vitales registrados por enfermería para tus consultas.</p>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 whitespace-nowrap px-2">
              <input
                type="checkbox"
                checked={soloAlertas}
                onChange={(e) => setSoloAlertas(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/30"
              />
              Solo fuera de rango
            </label>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TablaCRUD
              columnas={[
                { clave: 'id_signos', titulo: 'ID' },
                { clave: 'paciente_nombre', titulo: 'Paciente', render: (v, f) => `${v} ${f.paciente_apellido || ''}`.trim() },
                { clave: 'presion_arterial', titulo: 'Presión', render: (v) => <span className={clasePresion(v)}>{v || '-'}</span> },
                { clave: 'temperatura', titulo: 'Temp (°C)', render: (v) => <span className={claseTemperatura(v)}>{v != null ? `${v} °C` : '-'}</span> },
                { clave: 'frecuencia_cardiaca', titulo: 'FC (lpm)', render: (v) => <span className={claseFrecuencia(v)}>{v != null ? `${v} lpm` : '-'}</span> },
                { clave: 'enfermero_nombre', titulo: 'Registró', render: (v, f) => `${v || ''} ${f.enfermero_apellido || ''}`.trim() || '-' },
                { clave: 'fecha_hora', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              ]}
              datos={filtrados}
              cargando={cargando}
              emptyMessage="No hay signos vitales de tus pacientes"
            />
          )}
        </div>
      </div>
    </div>
  );
}
