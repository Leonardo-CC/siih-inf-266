import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import { IconoPlus, IconoEdit, IconoTrash, IconoCheck, IconoBuildingHospital } from '../../components/Iconos.jsx';

const TIPOS = {
  consulta_externa: 'Consulta externa',
  emergencia: 'Emergencia',
};

const ESTADOS = {
  registrada: 'Registrada',
  en_triage: 'En triage',
  asignada: 'Asignada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

const ESTADO_CLASES = {
  registrada: 'bg-slate-100 text-slate-700 border-slate-200',
  en_triage: 'bg-amber-100 text-amber-800 border-amber-200',
  asignada: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-700 border-red-200',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const estadoInicial = {
  id_consulta: null,
  id_paciente: '',
  paciente_nombre: '',
  id_enfermero: '',
  id_medico: '',
  tipo_admision: 'consulta_externa',
  estado: 'registrada',
  motivo_consulta: '',
  sala_asignada: '',
  datos_verificados: false,
  observaciones: '',
};

const hospitalizacionInicial = {
  diagnostico_ingreso: '',
  observaciones_clinicas: '',
  tiempo_internacion_dias: 1,
  fecha_estimada_alta: '',
  sala: '',
  cama: '',
};

export default function GestionAdmision() {
  const usuario = obtenerUsuario();
  const [admisiones, setAdmisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [opciones, setOpciones] = useState({ citas: [], enfermeros: [], medicos: [], pacientes: [] });
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalHospitalizacion, setModalHospitalizacion] = useState(false);
  const [admisionHospitalizacion, setAdmisionHospitalizacion] = useState(null);
  const [formHospitalizacion, setFormHospitalizacion] = useState(hospitalizacionInicial);
  const [erroresHospitalizacion, setErroresHospitalizacion] = useState({});
  const [enviandoHospitalizacion, setEnviandoHospitalizacion] = useState(false);
  const [mensajeHospitalizacion, setMensajeHospitalizacion] = useState(null);
  const [errorHospitalizacion, setErrorHospitalizacion] = useState(null);
  const debounceRef = useState(null)[0];

  async function cargarAdmisiones() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      let url;
      if (usuario?.rol === 'enfermero') {
        let idEnfermero = usuario?.id_enfermero;
        if (!idEnfermero) {
          const propio = opciones.enfermeros.find(
            (e) => String(e.persona_id) === String(usuario?.persona_id)
          );
          idEnfermero = propio?.id_enfermero || null;
        }
        url = idEnfermero
          ? `/api/admisiones/listar?id_enfermero=${idEnfermero}`
          : '/api/admisiones/listar';
      } else {
        url = '/api/admisiones/listar';
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setAdmisiones(data.admisiones || []);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar las admisiones.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarOpciones() {
    try {
      const res = await fetch('/api/admisiones/opciones');
      const data = await res.json();
      if (data.ok) {
        setOpciones({
          citas: data.citas || [],
          enfermeros: data.enfermeros || [],
          medicos: data.medicos || [],
          pacientes: data.pacientes || [],
        });
      }
    } catch {
      console.error('Error cargando opciones');
    }
  }

  useEffect(() => {
    cargarOpciones().then(() => {
      cargarAdmisiones();
    });
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    const propio = opciones.enfermeros.find((e) => String(e.persona_id) === String(usuario?.persona_id));
    setForm({ ...estadoInicial, id_enfermero: propio ? String(propio.id_enfermero) : '' });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(admision) {
    setModoEdicion(true);
    const pacienteNombre = `${admision.paciente_nombre || ''} ${admision.paciente_apellido || ''}`.trim();
    setForm({
      id_consulta: admision.id_admision,
      id_paciente: String(admision.id_paciente || ''),
      paciente_nombre: pacienteNombre,
      id_enfermero: String(admision.id_enfermero || ''),
      id_medico: admision.id_medico ? String(admision.id_medico) : '',
      tipo_admision: admision.tipo_admision || 'consulta_externa',
      estado: admision.estado || 'registrada',
      motivo_consulta: admision.motivo_consulta || '',
      sala_asignada: admision.sala_asignada || '',
      datos_verificados: Boolean(admision.datos_verificados),
      observaciones: admision.observaciones || '',
    });
    if (admision.id_paciente && pacienteNombre) {
      setSugerencias((prev) => {
        const existe = prev.some((p) => p.id_paciente === admision.id_paciente);
        if (existe) return prev;
        return [...prev, { id_paciente: admision.id_paciente, nombre_completo: pacienteNombre }];
      });
    }
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function abrirAutorizarHospitalizacion(admision) {
    setAdmisionHospitalizacion(admision);
    setFormHospitalizacion(hospitalizacionInicial);
    setErroresHospitalizacion({});
    setMensajeHospitalizacion(null);
    setErrorHospitalizacion(null);
    setModalHospitalizacion(true);
  }

  function handleChangeHospitalizacion(e) {
    const { name, value } = e.target;
    setFormHospitalizacion((prev) => ({ ...prev, [name]: value }));
    setErroresHospitalizacion((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmitHospitalizacion(e) {
    e.preventDefault();
    setEnviandoHospitalizacion(true);
    setErroresHospitalizacion({});
    setMensajeHospitalizacion(null);
    setErrorHospitalizacion(null);

    try {
      const payload = {
        rol: usuario?.rol,
        id_enfermero: usuario?.id_enfermero || admisionHospitalizacion?.id_enfermero,
        id_profesional: usuario?.id_enfermero || admisionHospitalizacion?.id_enfermero,
        id_consulta: admisionHospitalizacion?.id_admision,
        id_paciente: admisionHospitalizacion?.id_paciente,
        id_medico: admisionHospitalizacion?.id_medico,
        diagnostico_ingreso: formHospitalizacion.diagnostico_ingreso,
        observaciones_clinicas: formHospitalizacion.observaciones_clinicas,
        tiempo_internacion_dias: Number(formHospitalizacion.tiempo_internacion_dias),
        fecha_estimada_alta: formHospitalizacion.fecha_estimada_alta || null,
        sala: formHospitalizacion.sala,
        cama: formHospitalizacion.cama,
      };

      const res = await fetch('/api/hospitalizaciones/autorizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorHospitalizacion(data.mensaje || data.errores?.general || 'No se pudo autorizar la hospitalizacion.');
        if (data.errores) setErroresHospitalizacion(data.errores);
        return;
      }

      setMensajeHospitalizacion(data.mensaje || 'Hospitalizacion autorizada correctamente.');
      setTimeout(() => setModalHospitalizacion(false), 1200);
    } catch {
      setErrorHospitalizacion('No se pudo conectar con el servidor.');
    } finally {
      setEnviandoHospitalizacion(false);
    }
  }

  async function buscarPacientes(texto) {
    if (!texto || texto.length < 2) {
      setSugerencias([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/admisiones/buscar?q=${encodeURIComponent(texto)}`);
      const data = await res.json();
      if (data.ok) setSugerencias(data.results || []);
      else setSugerencias([]);
    } catch {
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    try {
      const url = modoEdicion ? '/api/admisiones/actualizar' : '/api/admisiones/registrar';
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        return;
      }

      setMensaje(data.mensaje || 'Guardado correctamente.');
      await cargarAdmisiones();
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

  async function handleEliminar(admision) {
    if (!confirm(`¿Eliminar admisión #${admision.id_admision}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/admisiones/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_consulta: admision.id_admision }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarAdmisiones();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  const admisionesFiltradas = admisiones.filter((a) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      `${a.paciente_nombre || ''} ${a.paciente_apellido || ''}`.toLowerCase().includes(texto) ||
      `${a.medico_nombre || ''}`.toLowerCase().includes(texto) ||
      `${a.motivo_consulta || ''}`.toLowerCase().includes(texto);
    const coincideEstado = !filtroEstado || a.estado === filtroEstado;
    const coincideTipo = !filtroTipo || a.tipo_admision === filtroTipo;
    return coincideTexto && coincideEstado && coincideTipo;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Admisiones</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra las admisiones y consultas registradas.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <IconoPlus className="w-4 h-4" />
            Nueva admision
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
              {Object.entries(ESTADOS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).map(([v, l]) => (
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
                { clave: 'id_admision', titulo: 'ID' },
                { clave: 'paciente_nombre', titulo: 'Paciente', render: (v, f) => `${v} ${f.paciente_apellido || ''}`.trim() },
                { clave: 'medico_nombre', titulo: 'Médico', render: (v) => v ? `Dr(a). ${v}` : '-' },
                { clave: 'tipo_admision', titulo: 'Tipo', render: (v) => TIPOS[v] || v },
                {
                  clave: 'estado',
                  titulo: 'Estado',
                  render: (v) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CLASES[v] || ESTADO_CLASES.registrada}`}>
                      {ESTADOS[v] || v}
                    </span>
                  ),
                },
                {
                  clave: 'datos_verificados',
                  titulo: 'Verif.',
                  render: (v) => v
                    ? <span className="text-green-600 font-semibold"><IconoCheck className="w-4 h-4 inline" /></span>
                    : <span className="text-slate-300">—</span>,
                },
                { clave: 'sala_asignada', titulo: 'Sala', render: (v) => v || '-' },
                { clave: 'fecha_admision', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              ]}
              datos={admisionesFiltradas}
              cargando={cargando}
              emptyMessage="No hay admisiones que coincidan con el filtro"
              onEditar={abrirModalEditar}
              onEliminar={handleEliminar}
              acciones={[
                {
                  title: 'Autorizar Hospitalizacion',
                  icono: <IconoBuildingHospital className="w-4 h-4" />,
                  className: 'text-purple-600 hover:bg-purple-50',
                  onClick: abrirAutorizarHospitalizacion,
                },
              ]}
              iconoEditar={<IconoEdit className="w-4 h-4" />}
              iconoEliminar={<IconoTrash className="w-4 h-4" />}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar admisión' : 'Nueva admisión'} ancho="max-w-2xl">
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
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Paciente *</label>
            <input
              type="text"
              name="paciente_nombre"
              list="pacientes-datalist"
              value={form.paciente_nombre}
              onChange={(e) => {
                const val = e.target.value;
                handleChange(e);
                if (!modoEdicion) {
                  buscarPacientes(val);
                }
                const match = sugerencias.find((p) => p.nombre_completo === val);
                setForm((prev) => ({
                  ...prev,
                  id_paciente: match ? String(match.id_paciente) : modoEdicion ? prev.id_paciente : '',
                }));
              }}
              placeholder="Buscar paciente por nombre..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_paciente ? 'border-red-400' : 'border-slate-300'}`}
              required
            />
            <datalist id="pacientes-datalist">
              {sugerencias.map((p) => (
                <option key={p.id_paciente} value={p.nombre_completo} />
              ))}
            </datalist>
            {errores.id_paciente && <p className="text-red-500 text-xs mt-1">{errores.id_paciente}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Enfermero(a) *</label>
              <select
                name="id_enfermero"
                value={form.id_enfermero}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                required
              >
                <option value="">Seleccionar enfermero</option>
                {opciones.enfermeros.map((e) => (
                  <option key={e.id_enfermero} value={e.id_enfermero}>
                    {e.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Médico asignado</label>
              <select
                name="id_medico"
                value={form.id_medico}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                <option value="">Sin médico directo</option>
                {opciones.medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    {m.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de admisión *</label>
              <select
                name="tipo_admision"
                value={form.tipo_admision}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                required
              >
                {Object.entries(TIPOS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Sala asignada</label>
              <input
                name="sala_asignada"
                value={form.sala_asignada}
                onChange={handleChange}
                placeholder="Ej. Consultorio 2"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modoEdicion && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                >
                  {Object.entries(ESTADOS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 pt-6">
              <input
                id="datos_verificados"
                type="checkbox"
                name="datos_verificados"
                checked={form.datos_verificados}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/30"
              />
              <label htmlFor="datos_verificados" className="text-sm font-medium text-slate-700">
                Datos del paciente verificados
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de consulta *</label>
            <textarea
              name="motivo_consulta"
              value={form.motivo_consulta}
              onChange={handleChange}
              rows="3"
              placeholder="Describe el motivo de la consulta"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows="2"
              placeholder="Opcional"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar admisión' : 'Registrar admisión'}
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalHospitalizacion}
        alCerrar={() => setModalHospitalizacion(false)}
        titulo="Autorizar Hospitalizacion"
        ancho="max-w-2xl"
      >
        {mensajeHospitalizacion && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensajeHospitalizacion}
          </div>
        )}
        {errorHospitalizacion && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {errorHospitalizacion}
          </div>
        )}

        {admisionHospitalizacion && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Paciente:</span> {admisionHospitalizacion.paciente_nombre} {admisionHospitalizacion.paciente_apellido}</p>
            <p><span className="font-semibold text-slate-700">Admision origen:</span> #{admisionHospitalizacion.id_admision} - {TIPOS[admisionHospitalizacion.tipo_admision] || admisionHospitalizacion.tipo_admision}</p>
            <p><span className="font-semibold text-slate-700">Medico responsable:</span> {admisionHospitalizacion.medico_nombre ? `Dr(a). ${admisionHospitalizacion.medico_nombre}` : 'Debe estar asignado para autorizar'}</p>
          </div>
        )}

        <form onSubmit={handleSubmitHospitalizacion} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnostico de ingreso *</label>
            <textarea
              name="diagnostico_ingreso"
              value={formHospitalizacion.diagnostico_ingreso}
              onChange={handleChangeHospitalizacion}
              rows="3"
              placeholder="Justificacion clinica de la hospitalizacion"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y ${erroresHospitalizacion.diagnostico_ingreso ? 'border-red-400' : 'border-slate-300'}`}
              required
            />
            {erroresHospitalizacion.diagnostico_ingreso && <p className="text-red-500 text-xs mt-1">{erroresHospitalizacion.diagnostico_ingreso}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones clinicas *</label>
            <textarea
              name="observaciones_clinicas"
              value={formHospitalizacion.observaciones_clinicas}
              onChange={handleChangeHospitalizacion}
              rows="4"
              placeholder="Indicaciones, cuidados especiales y detalles de seguimiento"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y ${erroresHospitalizacion.observaciones_clinicas ? 'border-red-400' : 'border-slate-300'}`}
              required
            />
            {erroresHospitalizacion.observaciones_clinicas && <p className="text-red-500 text-xs mt-1">{erroresHospitalizacion.observaciones_clinicas}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Dias internado *</label>
              <input
                type="number"
                min="1"
                name="tiempo_internacion_dias"
                value={formHospitalizacion.tiempo_internacion_dias}
                onChange={handleChangeHospitalizacion}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${erroresHospitalizacion.tiempo_internacion_dias ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {erroresHospitalizacion.tiempo_internacion_dias && <p className="text-red-500 text-xs mt-1">{erroresHospitalizacion.tiempo_internacion_dias}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alta estimada</label>
              <input
                type="date"
                name="fecha_estimada_alta"
                value={formHospitalizacion.fecha_estimada_alta}
                onChange={handleChangeHospitalizacion}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Sala / unidad</label>
              <input
                name="sala"
                value={formHospitalizacion.sala}
                onChange={handleChangeHospitalizacion}
                placeholder="Ej. Medicina interna"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cama</label>
              <input
                name="cama"
                value={formHospitalizacion.cama}
                onChange={handleChangeHospitalizacion}
                placeholder="Ej. A-12"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalHospitalizacion(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviandoHospitalizacion}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <IconoBuildingHospital className="w-4 h-4" />
              {enviandoHospitalizacion ? 'Autorizando...' : 'Autorizar Hospitalizacion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
