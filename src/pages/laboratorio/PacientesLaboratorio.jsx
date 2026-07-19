import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import {
  IconoUsers,
  IconoSearch,
  IconoMail,
  IconoPhone,
  IconoShield,
  IconoBeaker,
  IconoX,
} from '../../components/Iconos.jsx';

function formatearValor(v) {
  if (v === '' || v == null) return '—';
  return v;
}

export default function PacientesLaboratorio() {
  const usuario = obtenerUsuario();
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  async function cargarPacientes() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/tecnico-laboratorio/pacientes');
      const data = await res.json();
      if (data.ok) {
        setPacientes(data.pacientes || []);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar los pacientes.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter((p) =>
    busqueda.trim() === '' ||
    p.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.ci?.includes(busqueda) ||
    p.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pacientes del Laboratorio</h1>
            <p className="text-blue-100 mt-1 text-sm">Consulta la información de pacientes registrados.</p>
          </div>
          <div className="hidden sm:block text-white"><IconoUsers className="w-10 h-10" /></div>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          {/* Buscador y contador */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconoSearch className="w-5 h-5" /></span>
              <input
                type="text"
                placeholder="Buscar por nombre, CI o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <span className="text-sm text-slate-500 whitespace-nowrap">
              {pacientesFiltrados.length} de {pacientes.length} pacientes
            </span>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No hay pacientes que coincidan con la búsqueda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pacientesFiltrados.map((p) => (
                <button
                  key={p.id_paciente}
                  onClick={() => setPacienteSeleccionado(p)}
                  className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-primary hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {p.nombre?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate group-hover:text-primary transition">{p.nombre_completo}</p>
                      <p className="text-xs text-slate-400">CI: {formatearValor(p.ic)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2"><IconoMail className="w-4 h-4 text-slate-400" /> {formatearValor(p.correo)}</p>
                    <p className="flex items-center gap-2"><IconoPhone className="w-4 h-4 text-slate-400" /> {formatearValor(p.telefono)}</p>
                    <p className="flex items-center gap-2"><IconoShield className="w-4 h-4 text-slate-400" /> {formatearValor(p.tipo_seguro)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      <Modal
        abierto={!!pacienteSeleccionado}
        alCerrar={() => setPacienteSeleccionado(null)}
        titulo="Detalle del paciente"
        ancho="max-w-lg"
      >
        {pacienteSeleccionado && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {pacienteSeleccionado.nombre?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">{pacienteSeleccionado.nombre_completo}</p>
                <p className="text-sm text-slate-400">Paciente #{pacienteSeleccionado.id_paciente}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">CI</p>
                <p className="text-slate-700 mt-0.5">{formatearValor(pacienteSeleccionado.ci)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Teléfono</p>
                <p className="text-slate-700 mt-0.5">{formatearValor(pacienteSeleccionado.telefono)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Correo</p>
                <p className="text-slate-700 mt-0.5 break-words">{formatearValor(pacienteSeleccionado.correo)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Seguro</p>
                <p className="text-slate-700 mt-0.5">{formatearValor(pacienteSeleccionado.tipo_seguro)}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPacienteSeleccionado(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition flex items-center gap-2"
              >
                <IconoX className="w-4 h-4" /> Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
