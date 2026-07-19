import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';

const ESTADO_CITA_COLORES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmada: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
};

const ESTADO_CITA_LABEL = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminCitas() {
  const usuario = obtenerUsuario();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState({
    id_cita: null,
    id_paciente: '',
    id_medico: '',
    fecha_hora: '',
    motivo: '',
    estado: 'pendiente',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [opciones, setOpciones] = useState({ pacientes: [], especialidades: [], medicos: [] });
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  async function cargarCitas() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/citas/listar');
      const data = await res.json();
      if (data.ok) {
        setCitas(data.citas || []);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar las citas.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarOpciones() {
    try {
      const [pacientesRes, espRes] = await Promise.all([
        fetch('/api/citas/opciones?accion=pacientes'),
        fetch('/api/citas/opciones?accion=especialidades'),
      ]);
      const [pacientesData, espData] = await Promise.all([pacientesRes.json(), espRes.json()]);
      setOpciones({
        pacientes: pacientesData.ok ? pacientesData.pacientes : [],
        especialidades: espData.ok ? espData.especialidades : [],
        medicos: [],
      });
    } catch {
      console.error('Error cargando opciones');
    }
  }

  async function cargarMedicos(especialidad) {
    if (!especialidad) {
      setOpciones((prev) => ({ ...prev, medicos: [] }));
      return;
    }
    try {
      const res = await fetch(`/api/citas/opciones?accion=medicos&especialidad=${encodeURIComponent(especialidad)}`);
      const data = await res.json();
      if (data.ok) {
        setOpciones((prev) => ({ ...prev, medicos: data.medicos || [] }));
      }
    } catch {
      console.error('Error cargando médicos');
    }
  }

  useEffect(() => {
    cargarOpciones().then(() => {
      cargarCitas();
    });
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm({
      id_cita: null,
      id_paciente: '',
      id_medico: '',
      fecha_hora: '',
      motivo: '',
      estado: 'pendiente',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(cita) {
    setModoEdicion(true);
    setForm({
      id_cita: cita.id_cita,
      id_paciente: String(cita.id_paciente || ''),
      id_medico: String(cita.id_medico || ''),
      fecha_hora: cita.fecha_hora ? cita.fecha_hora.slice(0, 16) : '',
      motivo: cita.motivo || '',
      estado: cita.estado || 'pendiente',
    });
    // Precargar el medico actual para que el select lo muestre en edicion
    // (los medicos solo se cargan por especialidad al crear).
    setOpciones((prev) => {
      const yaExiste = (prev.medicos || []).some((m) => String(m.id_medico) === String(cita.id_medico));
      if (yaExiste || !cita.id_medico) return prev;
      const medicoActual = {
        id_medico: cita.id_medico,
        nombre_completo: cita.medico_completo ? cita.medico_completo.replace(/^Dr\(a\)\.\s*/, '') : `Médico #${cita.id_medico}`,
      };
      return { ...prev, medicos: [medicoActual, ...prev.medicos] };
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
    if (name === 'especialidad') {
      cargarMedicos(value);
      setForm((prev) => ({ ...prev, id_medico: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    try {
      const url = modoEdicion ? '/api/citas/actualizar' : '/api/citas/solicitar';
      const method = modoEdicion ? 'PUT' : 'POST';

      const body = modoEdicion
        ? { id_cita: form.id_cita, ...form }
        : { id_paciente: form.id_paciente, id_medico: form.id_medico, fecha_hora: form.fecha_hora, motivo: form.motivo };

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
      await cargarCitas();
      setTimeout(() => {
        setModalAbierto(false);
        setMensaje(null);
      }, 1200);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(cita) {
    if (!confirm(`¿Eliminar la cita #${cita.id_cita}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/citas/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_cita: cita.id_cita }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarCitas();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  const citasFiltradas = citas.filter((c) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase().includes(texto) ||
      `${c.medico_nombre || ''} ${c.medico_apellido || ''}`.toLowerCase().includes(texto) ||
      (c.motivo || '').toLowerCase().includes(texto);
    const coincideEstado = !filtroEstado || c.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Citas</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra todas las citas médicas del sistema.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nueva cita
          </button>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorGeneral}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente, médico o motivo..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_CITA_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
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
                { clave: 'id_cita', titulo: 'ID' },
                {
                  clave: 'paciente_completo',
                  titulo: 'Paciente',
                  render: (v) => v || '-',
                },
                {
                  clave: 'medico_completo',
                  titulo: 'Médico',
                  render: (v) => v ? `Dr(a). ${v}` : '-',
                },
                { clave: 'fecha_hora', titulo: 'Fecha', render: (v) => formatearFecha(v) },
                { clave: 'motivo', titulo: 'Motivo', render: (v) => v || '-' },
                {
                  clave: 'estado',
                  titulo: 'Estado',
                  render: (v) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CITA_COLORES[v] || ESTADO_CITA_COLORES.pendiente}`}>
                      {ESTADO_CITA_LABEL[v] || v}
                    </span>
                  ),
                },
              ]}
              datos={citasFiltradas}
              cargando={cargando}
              emptyMessage="No hay citas que coincidan con el filtro"
              onEditar={abrirModalEditar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar cita' : 'Nueva cita'} ancho="max-w-2xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {modoEdicion && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                {Object.entries(ESTADO_CITA_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente *</label>
            <select
              name="id_paciente"
              value={form.id_paciente}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_paciente ? 'border-red-400' : 'border-slate-300'}`}
              required
            >
              <option value="">Seleccionar paciente</option>
              {opciones.pacientes.map((p) => (
                <option key={p.id_paciente} value={p.id_paciente}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>
            {errores.id_paciente && <p className="text-red-500 text-xs mt-1">{errores.id_paciente}</p>}
          </div>

          {!modoEdicion && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad *</label>
              <select
                name="especialidad"
                value={form.especialidad || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                required
              >
                <option value="">Seleccionar especialidad</option>
                {opciones.especialidades.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Médico *</label>
            <select
              name="id_medico"
              value={form.id_medico}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_medico ? 'border-red-400' : 'border-slate-300'}`}
              required
            >
              <option value="">Seleccionar médico</option>
              {opciones.medicos.map((m) => (
                <option key={m.id_medico} value={m.id_medico}>
                  {m.nombre_completo}
                </option>
              ))}
            </select>
            {errores.id_medico && <p className="text-red-500 text-xs mt-1">{errores.id_medico}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha y hora *</label>
              <input
                type="datetime-local"
                name="fecha_hora"
                value={form.fecha_hora}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.fecha_hora ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.fecha_hora && <p className="text-red-500 text-xs mt-1">{errores.fecha_hora}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo</label>
              <input
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar cita' : 'Registrar cita'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
