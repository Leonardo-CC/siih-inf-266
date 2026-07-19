import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import { IconoEdit, IconoBeaker, IconoEye } from '../../components/Iconos.jsx';

const ESTADOS = {
  pendiente: 'Pendiente',
  en_atencion: 'En atención',
  atendida: 'Atendida',
  derivada: 'Derivada',
};

const ESTADO_CLASES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_atencion: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  derivada: 'bg-purple-100 text-purple-800 border-purple-200',
};

// HU-15: catálogo de tipos de análisis para la solicitud de laboratorio.
const TIPOS_ANALISIS = [
  'Hemograma completo',
  'Glucosa',
  'Perfil lipidico',
  'Perfil hepatico',
  'Perfil renal',
  'Orina',
  'Heces',
  'PCR',
  'Coagulacion',
  'Grupo sanguineo',
  'Serologia',
  'Microbiologia',
  'Otro',
];

const ESTADOS_ANALISIS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function obtenerFechaHoy() {
  const hoy = new Date();
  return hoy.getFullYear() + '-' + 
         String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
         String(hoy.getDate()).padStart(2, '0');
}

const estadoInicial = {
  id_consulta: null,
  paciente: '',
  motivo_consulta: '',
  estado_atencion: 'pendiente',
  diagnostico: '',
  tratamiento: '',
  receta: '',
  observaciones: '',
};

export default function GestionConsultasMedico() {
  const usuario = obtenerUsuario();
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(obtenerFechaHoy());
  const [descargando, setDescargando] = useState(false);

  // HU-15: estado del modal para solicitar analisis de laboratorio vinculado a la consulta.
  const [modalAnalisisAbierto, setModalAnalisisAbierto] = useState(false);
  const [consultaAnalisis, setConsultaAnalisis] = useState(null);
  const [formAnalisis, setFormAnalisis] = useState({
    tipo_analisis: '',
    estado: 'pendiente',
    observaciones: '',
  });
  const [erroresAnalisis, setErroresAnalisis] = useState({});
  const [enviandoAnalisis, setEnviandoAnalisis] = useState(false);
  const [mensajeAnalisis, setMensajeAnalisis] = useState(null);
  const [errorAnalisis, setErrorAnalisis] = useState(null);

  // HU-15: solicitudes ya registradas por consulta (para mostrar "Ver solicitud").
  const [solicitudesPorConsulta, setSolicitudesPorConsulta] = useState({});
  const [modalVerSolicitudAbierto, setModalVerSolicitudAbierto] = useState(false);
  const [consultaVerSolicitud, setConsultaVerSolicitud] = useState(null);
  const [solicitudesVista, setSolicitudesVista] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState(null);

  // HU-15: abre la solicitud de analisis precargada con la consulta de origen y su paciente.
  function abrirModalSolicitarAnalisis(consulta) {
    setConsultaAnalisis(consulta);
    setFormAnalisis({ tipo_analisis: '', estado: 'pendiente', observaciones: '' });
    setErroresAnalisis({});
    setMensajeAnalisis(null);
    setErrorAnalisis(null);
    setModalAnalisisAbierto(true);
  }

  function handleChangeAnalisis(e) {
    const { name, value } = e.target;
    setFormAnalisis((prev) => ({ ...prev, [name]: value }));
    setErroresAnalisis((prev) => ({ ...prev, [name]: '' }));
  }

  // HU-15: marca la consulta como "con solicitud" en el mapa local.
  function marcarSolicitud(consulta, analisis) {
    setSolicitudesPorConsulta((prev) => ({
      ...prev,
      [consulta.id_consulta]: {
        id_consulta: consulta.id_consulta,
        analisis: analisis || null,
      },
    }));
  }

  // HU-15: abre el modal para ver las solicitudes ya registradas de una consulta.
  async function abrirVerSolicitud(consulta) {
    setConsultaVerSolicitud(consulta);
    const previas = solicitudesPorConsulta[consulta.id_consulta]?.analisis
      ? [solicitudesPorConsulta[consulta.id_consulta].analisis]
      : [];
    setSolicitudesVista(previas);
    setCargandoSolicitudes(true);
    setErrorSolicitudes(null);
    setModalVerSolicitudAbierto(true);
    try {
      // La BD vincula el analisis al paciente; se filtra por id_paciente y,
      // si la columna id_consulta existe, tambien por la consulta de origen.
      let url = `/api/tecnico-laboratorio/analisis/listar?id_paciente=${consulta.id_paciente}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        let lista = data.analisis || [];
        // Filtro fino por consulta solo si la columna existe (id_consulta != null).
        lista = lista.filter((a) => !a.id_consulta || a.id_consulta === consulta.id_consulta);
        setSolicitudesVista(lista);
        if (lista.length) marcarSolicitud(consulta, lista[0]);
        else marcarSolicitud(consulta, null);
      } else {
        setErrorSolicitudes(data.mensaje || 'No se pudieron cargar las solicitudes.');
      }
    } catch {
      setErrorSolicitudes('No se pudo conectar con el servidor.');
    } finally {
      setCargandoSolicitudes(false);
    }
  }

  async function handleSubmitAnalisis(e) {
    e.preventDefault();
    setEnviandoAnalisis(true);
    setErroresAnalisis({});
    setErrorAnalisis(null);
    setMensajeAnalisis(null);

    const errs = {};
    if (!formAnalisis.tipo_analisis) errs.tipo_analisis = 'Selecciona un tipo de análisis.';
    if (!ESTADOS_ANALISIS.some((x) => x.value === formAnalisis.estado)) errs.estado = 'Selecciona un estado válido.';

    if (Object.keys(errs).length > 0) {
      setErroresAnalisis(errs);
      setEnviandoAnalisis(false);
      return;
    }

    try {
      const res = await fetch('/api/tecnico-laboratorio/analisis/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paciente: consultaAnalisis.id_paciente,
          id_consulta: consultaAnalisis.id_consulta,
          tipo_analisis: formAnalisis.tipo_analisis,
          estado: formAnalisis.estado,
          fecha_solicitud: new Date().toISOString(),
          observaciones: formAnalisis.observaciones || null,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        const msgError =
          data.mensaje ||
          data.errores?.general ||
          (data.errores ? Object.values(data.errores).join(' ') : '') ||
          'No se pudo registrar la solicitud.';
        setErrorAnalisis(msgError);
        if (data.errores) setErroresAnalisis(data.errores);
        setEnviandoAnalisis(false);
        return;
      }

      marcarSolicitud(consultaAnalisis, {
        id_analisis: data.analisis?.id_analisis,
        tipo_analisis: formAnalisis.tipo_analisis,
        estado: formAnalisis.estado,
        observaciones: formAnalisis.observaciones || '',
      });
      setMensajeAnalisis('Solicitud de análisis registrada y vinculada a la consulta.');
      setTimeout(() => setModalAnalisisAbierto(false), 1200);
    } catch {
      setErrorAnalisis('No se pudo conectar con el servidor.');
    } finally {
      setEnviandoAnalisis(false);
    }
  }

  // HU-15: marca las consultas que ya tienen solicitud de analisis del paciente.
  // La BD vincula el analisis al paciente; se usa id_paciente (y id_consulta
  // como filtro adicional cuando la columna existe).
  async function cargarSolicitudesPorConsulta(lista) {
    const mapa = {};
    await Promise.all(
      lista.map(async (c) => {
        try {
          const res = await fetch(`/api/tecnico-laboratorio/analisis/listar?id_paciente=${c.id_paciente}`);
          const data = await res.json();
          if (data.ok && data.analisis && data.analisis.length) {
            mapa[c.id_consulta] = {
              id_consulta: c.id_consulta,
              id_paciente: c.id_paciente,
              analisis: data.analisis[0],
              total: data.analisis.length,
            };
          }
        } catch {
          /* Silencioso */
        }
      })
    );
    setSolicitudesPorConsulta(mapa);
  }

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      if (!usuario?.id_medico) {
        setErrorGeneral('Tu sesión no tiene un médico asociado. Vuelve a iniciar sesión.');
        setCargando(false);
        return;
      }
      const res = await fetch(`/api/medico/consultas?id_medico=${usuario.id_medico}&fecha=${filtroFecha}`);
      const data = await res.json();
      if (data.ok) {
        const lista = data.consultas || [];
        setConsultas(lista);
        await cargarSolicitudesPorConsulta(lista);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar las consultas.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [filtroFecha]);

  function abrirModalAtender(consulta) {
    setForm({
      id_consulta: consulta.id_consulta,
      paciente: `${consulta.paciente_nombre || ''} ${consulta.paciente_apellido || ''}`.trim(),
      motivo_consulta: consulta.motivo_consulta || '',
      estado_atencion: consulta.estado_atencion || 'pendiente',
      diagnostico: consulta.diagnostico || '',
      tratamiento: consulta.tratamiento || '',
      receta: consulta.receta || '',
      observaciones: consulta.observaciones || '',
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
    try {
      const res = await fetch('/api/medico/actualizar-atencion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id_medico: usuario.id_medico }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        return;
      }
      setMensaje(data.mensaje || 'Atención guardada correctamente.');
      await cargar();
      setTimeout(() => {
        setModalAbierto(false);
        setMensaje(null);
      }, 1000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  // HU-09 / RF09: descarga el resumen formal de la consulta.
  // Depende de HU-06: el servidor rechaza (409) si aún no hay diagnóstico.
  async function handleDescargarPdf() {
    setDescargando(true);
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch(
        `/api/medico/reporte-consulta?id_consulta=${form.id_consulta}&id_medico=${usuario.id_medico}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.errores?.general || data?.mensaje || 'No se pudo generar el reporte.'
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_consulta_${form.id_consulta}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setDescargando(false);
    }
  }

  const consultasFiltradas = consultas.filter((c) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase().includes(texto) ||
      `${c.motivo_consulta || ''}`.toLowerCase().includes(texto) ||
      `${c.diagnostico || ''}`.toLowerCase().includes(texto);
    const coincideEstado = !filtroEstado || c.estado_atencion === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Mis Consultas</h1>
          <p className="text-blue-100 mt-1 text-sm">Registra diagnóstico, tratamiento y estado de atención de tus pacientes.</p>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <label htmlFor="filtroFecha" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Fecha:
              </label>
              <input
                type="date"
                id="filtroFecha"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white"
              />
            </div>
            
            <div className="hidden sm:block w-px bg-slate-300 mx-2"></div>

            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente, motivo o diagnóstico..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([v, l]) => (
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
                { clave: 'id_consulta', titulo: 'ID' },
                { clave: 'paciente_nombre', titulo: 'Paciente', render: (v, f) => `${v} ${f.paciente_apellido || ''}`.trim() },
                { clave: 'motivo_consulta', titulo: 'Motivo', render: (v) => v || '-' },
                {
                  clave: 'estado_atencion',
                  titulo: 'Estado',
                  render: (v) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CLASES[v] || ESTADO_CLASES.pendiente}`}>
                      {ESTADOS[v] || v}
                    </span>
                  ),
                },
                { clave: 'diagnostico', titulo: 'Diagnóstico', render: (v) => v ? (v.length > 30 ? v.slice(0, 30) + '…' : v) : '-' },
                { clave: 'fecha_consulta', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              ]}
              datos={consultasFiltradas}
              cargando={cargando}
              emptyMessage={
                filtroFecha === obtenerFechaHoy() 
                  ? "No tienes consultas agendadas para el día de hoy."
                  : `No hay consultas registradas para la fecha seleccionada.`
              }
              onEditar={abrirModalAtender}
              renderAcciones={(consulta) => {
                const yaSolicitado = Boolean(solicitudesPorConsulta[consulta.id_consulta]);
                return (
                  <div className="flex items-center gap-1 justify-end">
                    {yaSolicitado ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirVerSolicitud(consulta); }}
                        className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium text-xs transition-colors"
                        title="Ver solicitud de análisis"
                      >
                        <IconoEye className="w-4 h-4" />
                        Ver solicitud
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirModalSolicitarAnalisis(consulta); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Solicitar análisis de laboratorio"
                      >
                        <IconoBeaker className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={`Atender consulta #${form.id_consulta}`} ancho="max-w-2xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente</label>
              <input value={form.paciente} readOnly className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado de atención *</label>
              <select
                name="estado_atencion"
                value={form.estado_atencion}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                {Object.entries(ESTADOS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de consulta</label>
            <input
              name="motivo_consulta"
              value={form.motivo_consulta}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico</label>
            <textarea
              name="diagnostico"
              value={form.diagnostico}
              onChange={handleChange}
              rows="2"
              placeholder="Diagnóstico clínico"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tratamiento</label>
            <textarea
              name="tratamiento"
              value={form.tratamiento}
              onChange={handleChange}
              rows="2"
              placeholder="Indicaciones de tratamiento"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Receta / Medicación</label>
            <textarea
              name="receta"
              value={form.receta}
              onChange={handleChange}
              rows="2"
              placeholder="Ej. Paracetamol 500mg c/8h por 5 días"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
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
            {enviando ? 'Guardando...' : 'Guardar atención'}
          </button>
        </form>

        {/* HU-09: exportar el resumen formal en PDF (requiere diagnóstico ya guardado) */}
        <button
          type="button"
          onClick={handleDescargarPdf}
          disabled={descargando || !form.diagnostico}
          title={!form.diagnostico ? 'Registra y guarda un diagnóstico antes de exportar el PDF' : ''}
          className="w-full mt-3 border border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
        >
          {descargando ? (
            <>
              <span className="btn-pdf-spinner" />
              Generando PDF...
            </>
          ) : (
            'Descargar reporte'
          )}
        </button>
      </Modal>

      {/* HU-15: Solicitud de análisis de laboratorio vinculada a la consulta (dependencia HU-06) */}
      <Modal
        abierto={modalAnalisisAbierto}
        alCerrar={() => setModalAnalisisAbierto(false)}
        titulo="Solicitar análisis de laboratorio"
        ancho="max-w-2xl"
      >
        {mensajeAnalisis && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensajeAnalisis}</div>
        )}
        {errorAnalisis && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorAnalisis}</div>
        )}

        {consultaAnalisis && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Paciente:</span> {consultaAnalisis.paciente_nombre} {consultaAnalisis.paciente_apellido}</p>
            <p><span className="font-semibold text-slate-700">Consulta de origen:</span> #{consultaAnalisis.id_consulta} — {consultaAnalisis.motivo_consulta || 'Consulta'}</p>
          </div>
        )}

        <form onSubmit={handleSubmitAnalisis} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de análisis *</label>
            <select
              name="tipo_analisis"
              value={formAnalisis.tipo_analisis}
              onChange={handleChangeAnalisis}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${erroresAnalisis.tipo_analisis ? 'border-red-400' : 'border-slate-300'}`}
              required
            >
              <option value="">Selecciona un tipo de análisis</option>
              {TIPOS_ANALISIS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {erroresAnalisis.tipo_analisis && <p className="text-red-500 text-xs mt-1">{erroresAnalisis.tipo_analisis}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Estado *</label>
            <select
              name="estado"
              value={formAnalisis.estado}
              onChange={handleChangeAnalisis}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${erroresAnalisis.estado ? 'border-red-400' : 'border-slate-300'}`}
            >
              {ESTADOS_ANALISIS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={formAnalisis.observaciones}
              onChange={handleChangeAnalisis}
              rows="3"
              placeholder="Indicaciones para el técnico de laboratorio (opcional)"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalAnalisisAbierto(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviandoAnalisis}
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <IconoBeaker className="w-4 h-4" />
              {enviandoAnalisis ? 'Registrando...' : 'Registrar solicitud'}
            </button>
          </div>
        </form>
      </Modal>

      {/* HU-15: Ver solicitudes de analisis ya registradas para la consulta */}
      <Modal
        abierto={modalVerSolicitudAbierto}
        alCerrar={() => setModalVerSolicitudAbierto(false)}
        titulo="Solicitudes de análisis"
        ancho="max-w-2xl"
      >
        {consultaVerSolicitud && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Paciente:</span> {consultaVerSolicitud.paciente_nombre} {consultaVerSolicitud.paciente_apellido}</p>
            <p><span className="font-semibold text-slate-700">Consulta:</span> #{consultaVerSolicitud.id_consulta} — {consultaVerSolicitud.motivo_consulta || 'Consulta'}</p>
          </div>
        )}

        {errorSolicitudes && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorSolicitudes}</div>
        )}

        {cargandoSolicitudes ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : solicitudesVista.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Aún no se ha registrado ninguna solicitud de análisis para este paciente.</div>
        ) : (
          <div className="space-y-3">
            {solicitudesVista.map((s) => (
              <div key={s.id_analisis} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-800">{s.tipo_analisis}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    s.estado === 'pendiente' ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : s.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : s.estado === 'completado' ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {ESTADOS_ANALISIS.find((e) => e.value === s.estado)?.label || s.estado}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold">ID análisis:</span> #{s.id_analisis}</p>
                  <p><span className="font-semibold">Fecha solicitud:</span> {formatearFecha(s.fecha_solicitud)}</p>
                  {s.resultado ? <p><span className="font-semibold">Resultado:</span> {s.resultado}</p> : null}
                  {s.observaciones ? <p><span className="font-semibold">Observaciones:</span> {s.observaciones}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => setModalVerSolicitudAbierto(false)}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}