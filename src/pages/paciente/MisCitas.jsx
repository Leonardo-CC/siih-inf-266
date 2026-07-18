import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerUsuario } from '../../lib/authSession.js';

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

const ESTADO_CITA_LABEL = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
};

const ESTADO_ATENCION_LABEL = {
  pendiente: 'Pendiente',
  en_atencion: 'En atencion',
  atendida: 'Atendida',
  derivada: 'Derivada',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function MisCitas() {
  const usuario = obtenerUsuario();
  const [idPaciente, setIdPaciente] = useState(null);
  const [citas, setCitas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState('citas');
  const [cancelando, setCancelando] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
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

        const resDash = await fetch(`/api/paciente/dashboard?id_paciente=${jsonId.id_paciente}`);
        const jsonDash = await resDash.json();
        if (!jsonDash.ok) throw new Error(jsonDash.mensaje || 'No se pudieron cargar tus citas.');

        // Reusamos el dashboard: trae proximasCitas y consultasRecientes.
        // Para el historial completo, volvemos a pedir citas desde el dashboard.
        setCitas(jsonDash.proximasCitas || []);
        setConsultas(jsonDash.consultasRecientes || []);

        // Cargar TODAS las citas (no solo proximas) para el historial.
        const resCitas = await fetch(`/api/paciente/citas?id_paciente=${jsonId.id_paciente}`);
        const jsonCitas = await resCitas.json();
        if (jsonCitas.ok) setCitas(jsonCitas.citas || []);
      } catch (e) {
        setError(e.message || 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancelar(cita) {
    if (!confirm(`¿Cancelar la cita con ${cita.medico} el ${formatearFecha(cita.fecha_hora)}?`)) return;
    setCancelando(cita.id_cita);
    setMensaje(null);
    setError(null);
    try {
      const res = await fetch('/api/paciente/citas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_paciente: idPaciente, id_cita: cita.id_cita }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.mensaje || json.errores?.general || 'No se pudo cancelar la cita.');
        return;
      }
      setMensaje(json.mensaje);
      await cargar();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCancelando(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis citas</h1>
            <p className="text-blue-100 mt-1 text-sm">Revisa el estado de tus citas y atenciones medicas.</p>
          </div>
          <Link
            to="/paciente/cita"
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nueva cita
          </Link>
        </div>

        {(mensaje || error) && (
          <div className={`px-6 pt-4 ${mensaje ? '' : ''}`}>
            {mensaje && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
            )}
          </div>
        )}

        <div className="border-b border-slate-100 flex">
          <button
            onClick={() => setPestana('citas')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${pestana === 'citas' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Citas ({citas.length})
          </button>
          <button
            onClick={() => setPestana('atenciones')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${pestana === 'atenciones' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Atenciones ({consultas.length})
          </button>
        </div>

        <div className="p-6">
          {pestana === 'citas' && (
            <div className="space-y-3">
              {citas.length === 0 && <p className="text-slate-400 text-sm py-6 text-center">No tienes citas registradas.</p>}
              {citas.map((c) => {
                const cancelable = c.estado === 'pendiente' || c.estado === 'confirmada';
                return (
                  <div key={c.id_cita} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{c.medico}</p>
                      <p className="text-xs text-slate-400">{formatearFecha(c.fecha_hora)}</p>
                      {c.motivo && <p className="text-sm text-slate-500 mt-1 truncate">{c.motivo}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_CITA_COLORES[c.estado] || ESTADO_CITA_COLORES.pendiente}`}>
                        {ESTADO_CITA_LABEL[c.estado] || c.estado}
                      </span>
                      {cancelable && (
                        <button
                          onClick={() => handleCancelar(c)}
                          disabled={cancelando === c.id_cita}
                          className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-full transition disabled:opacity-50"
                        >
                          {cancelando === c.id_cita ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pestana === 'atenciones' && (
            <div className="space-y-3">
              {consultas.length === 0 && <p className="text-slate-400 text-sm py-6 text-center">No tienes atenciones registradas.</p>}
              {consultas.map((c) => (
                <div key={c.id_consulta} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800">{c.medico}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_ATENCION_COLORES[c.estado_atencion] || ESTADO_ATENCION_COLORES.pendiente}`}>
                      {ESTADO_ATENCION_LABEL[c.estado_atencion] || c.estado_atencion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{formatearFecha(c.fecha)}</p>
                  {c.motivo && <p className="text-sm text-slate-500 mt-1"><span className="font-medium">Motivo:</span> {c.motivo}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
