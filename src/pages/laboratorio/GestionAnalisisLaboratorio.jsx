import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import {
  IconoBeaker,
  IconoPlus,
  IconoEdit,
  IconoTrash,
  IconoSearch,
  IconoClock,
  IconoCheck,
  IconoX,
  IconoExclamation,
} from '../../components/Iconos.jsx';

const ESTADOS_ANALISIS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ESTADO_COLORES = {
  pendiente: 'bg-slate-100 text-slate-700 border-slate-200',
  en_proceso: 'bg-blue-100 text-blue-800 border-blue-200',
  completado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORES[estado] || ESTADO_COLORES.pendiente}`}>
      {ESTADOS_ANALISIS.find((e) => e.value === estado)?.label || estado}
    </span>
  );
}

export default function GestionAnalisisLaboratorio() {
  const usuario = obtenerUsuario();
  const [analisis, setAnalisis] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [form, setForm] = useState({
    id_analisis: null,
    id_paciente: '',
    tipo_analisis: '',
    fecha_solicitud: '',
    fecha_resultado: '',
    estado: 'pendiente',
    resultado: '',
    observaciones: '',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  async function cargarAnalisis() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const url = usuario?.id_tecnico_laboratorio
        ? `/api/tecnico-laboratorio/analisis/listar?id_tecnico_laboratorio=${usuario.id_tecnico_laboratorio}`
        : '/api/tecnico-laboratorio/analisis/listar';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setAnalisis(data.analisis || []);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar los análisis.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarPacientes() {
    try {
      const res = await fetch('/api/tecnico-laboratorio/pacientes');
      const data = await res.json();
      if (data.ok) setPacientes(data.pacientes || []);
    } catch {
      /* Silencioso */
    }
  }

  useEffect(() => {
    cargarAnalisis();
    cargarPacientes();
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm({
      id_analisis: null,
      id_paciente: '',
      tipo_analisis: '',
      fecha_solicitud: new Date().toISOString().slice(0, 16),
      fecha_resultado: '',
      estado: 'pendiente',
      resultado: '',
      observaciones: '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(a) {
    setModoEdicion(true);
    setForm({
      id_analisis: a.id_analisis,
      id_paciente: String(a.id_paciente),
      tipo_analisis: a.tipo_analisis,
      fecha_solicitud: a.fecha_solicitud ? new Date(a.fecha_solicitud).toISOString().slice(0, 16) : '',
      fecha_resultado: a.fecha_resultado ? new Date(a.fecha_resultado).toISOString().slice(0, 16) : '',
      estado: a.estado,
      resultado: a.resultado || '',
      observaciones: a.observaciones || '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    const errs = {};
    if (!form.id_paciente) errs.id_paciente = 'Selecciona un paciente.';
    if (!form.tipo_analisis) errs.tipo_analisis = 'Selecciona un tipo de análisis.';
    if (!ESTADOS_ANALISIS.some((x) => x.value === form.estado)) errs.estado = 'Selecciona un estado válido.';

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      setEnviando(false);
      return;
    }

    try {
      const body = {
        ...form,
        id_paciente: Number(form.id_paciente),
        id_tecnico_laboratorio: usuario.id_tecnico_laboratorio,
      };

      const url = modoEdicion ? '/api/tecnico-laboratorio/analisis/actualizar' : '/api/tecnico-laboratorio/analisis/registrar';
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        return;
      }

      setMensaje(data.mensaje || 'Guardado correctamente.');
      await cargarAnalisis();
      setTimeout(() => setModalAbierto(false), 1200);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(a) {
    if (!confirm(`¿Eliminar el análisis de "${a.paciente_nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch('/api/tecnico-laboratorio/analisis/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_analisis: a.id_analisis }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarAnalisis();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  const analisisFiltrados = analisis.filter((a) => {
    const coincideBusqueda =
      busqueda.trim() === '' ||
      a.paciente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.tipo_analisis?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === '' || a.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Análisis de Laboratorio</h1>
            <p className="text-blue-100 mt-1 text-sm">Registra y gestiona los análisis clínicos.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <IconoPlus className="w-5 h-5" /> Nuevo análisis
          </button>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <IconoExclamation className="w-5 h-5" /> {errorGeneral}
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconoSearch className="w-5 h-5" /></span>
              <input
                type="text"
                placeholder="Buscar por paciente o tipo de análisis..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_ANALISIS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TablaCRUD
              columnas={[
                { clave: 'paciente_nombre', titulo: 'Paciente' },
                { clave: 'tipo_analisis', titulo: 'Tipo de análisis' },
                {
                  clave: 'estado',
                  titulo: 'Estado',
                  render: (v) => <EstadoBadge estado={v} />,
                },
                {
                  clave: 'resultado',
                  titulo: 'Resultado',
                  render: (v) => v || <span className="text-slate-400">—</span>,
                },
                {
                  clave: 'fecha_solicitud',
                  titulo: 'Fecha solicitud',
                  render: (v) => formatearFecha(v),
                },
                {
                  clave: 'fecha_resultado',
                  titulo: 'Fecha resultado',
                  render: (v) => formatearFecha(v),
                },
              ]}
              datos={analisisFiltrados}
              cargando={cargando}
              emptyMessage="No hay análisis que coincidan con la búsqueda"
              onEditar={abrirModalEditar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar análisis' : 'Nuevo análisis'} ancho="max-w-2xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <IconoCheck className="w-5 h-5" /> {mensaje}
          </div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <IconoExclamation className="w-5 h-5" /> {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente *</label>
              <select
                name="id_paciente"
                value={form.id_paciente}
                onChange={handleChange}
                disabled={modoEdicion}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_paciente ? 'border-red-400' : 'border-slate-300'} ${modoEdicion ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Selecciona un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id_paciente} value={p.id_paciente}>{p.nombre_completo}</option>
                ))}
              </select>
              {errores.id_paciente && <p className="text-red-500 text-xs mt-1">{errores.id_paciente}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de análisis *</label>
              <input
                type="text"
                name="tipo_analisis"
                value={form.tipo_analisis}
                onChange={handleChange}
                placeholder="Escribe el tipo de análisis (ej: Hemograma completo)"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.tipo_analisis ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.tipo_analisis && <p className="text-red-500 text-xs mt-1">{errores.tipo_analisis}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha solicitud</label>
              <input
                type="datetime-local"
                name="fecha_solicitud"
                value={form.fecha_solicitud}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha resultado</label>
              <input
                type="datetime-local"
                name="fecha_resultado"
                value={form.fecha_resultado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado *</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.estado ? 'border-red-400' : 'border-slate-300'}`}
              >
                {ESTADOS_ANALISIS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Resultado</label>
              <input
                name="resultado"
                value={form.resultado}
                onChange={handleChange}
                placeholder="Ej: Hemoglobina 14 g/dL"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition flex items-center gap-2"
            >
              <IconoX className="w-4 h-4" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enviando ? <IconoClock className="w-4 h-4 animate-spin" /> : <IconoCheck className="w-4 h-4" />}
              {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar análisis' : 'Registrar análisis'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
