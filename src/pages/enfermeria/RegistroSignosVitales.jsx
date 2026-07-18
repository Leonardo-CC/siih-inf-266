import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
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
  const partes = v.split('/').map((n) => parseInt(n, 10));
  if (partes[0] >= 140 || partes[1] >= 90) return 'text-red-600 font-semibold';
  if (partes[0] >= 130 || partes[1] >= 85) return 'text-amber-600 font-medium';
  return 'text-slate-700';
}

const estadoInicial = {
  id_signos: null,
  id_consulta: '',
  id_consulta_label: '',
  id_enfermero: '',
  presion_arterial: '',
  temperatura: '',
  frecuencia_cardiaca: '',
  observaciones: '',
};

export default function RegistroSignosVitales() {
  const usuario = obtenerUsuario();
  const [registros, setRegistros] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [enfermeros, setEnfermeros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  async function cargarDatos() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const opcionesRes = await fetch('/api/signos-vitales/opciones');
      const opciones = await opcionesRes.json();

      if (!opciones.ok) {
        setErrorGeneral(opciones.mensaje || 'No se pudieron cargar los datos.');
        return;
      }

      setConsultas(opciones.consultas || []);
      setEnfermeros(opciones.enfermeros || []);

      let listarUrl = '/api/signos-vitales/listar';
      if (usuario?.rol === 'enfermero') {
        let idEnfermero = usuario?.id_enfermero;
        if (!idEnfermero) {
          const propio = opciones.enfermeros.find(
            (e) => String(e.persona_id) === String(usuario?.persona_id)
          );
          idEnfermero = propio?.id_enfermero || null;
        }
        if (idEnfermero) {
          listarUrl = `/api/signos-vitales/listar?id_enfermero=${idEnfermero}`;
        }
      }

      const listaRes = await fetch(listarUrl);
      const lista = await listaRes.json();
      setRegistros(lista.signos || []);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    // Preseleccionar al enfermero logueado mapeando su persona_id -> id_enfermero.
    const propio = enfermeros.find((e) => String(e.persona_id) === String(usuario?.persona_id));
    setForm({
      ...estadoInicial,
      id_enfermero: propio ? String(propio.id_enfermero) : '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(registro) {
    setModoEdicion(true);
    setForm({
      id_signos: registro.id_signos,
      id_consulta: String(registro.id_consulta || ''),
      id_consulta_label: `#${registro.id_consulta} · ${registro.paciente_nombre || ''} ${registro.paciente_apellido || ''}`.trim(),
      id_enfermero: String(registro.id_enfermero || ''),
      presion_arterial: registro.presion_arterial || '',
      temperatura: registro.temperatura != null ? String(registro.temperatura) : '',
      frecuencia_cardiaca: registro.frecuencia_cardiaca != null ? String(registro.frecuencia_cardiaca) : '',
      observaciones: registro.observaciones || '',
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
      const url = modoEdicion ? '/api/signos-vitales/actualizar' : '/api/signos-vitales/registrar';
      const method = modoEdicion ? 'PUT' : 'POST';

      const headers = {
        'Content-Type': 'application/json',
        'x-user': JSON.stringify(usuario),
      };

      const body = modoEdicion ? form : { ...form, id_signos: undefined };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        return;
      }

      setMensaje(data.mensaje || 'Guardado correctamente.');
      await cargarDatos();
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

  async function handleEliminar(registro) {
    if (!confirm(`¿Eliminar registro de signos vitales #${registro.id_signos}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/signos-vitales/eliminar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user': JSON.stringify(usuario),
        },
        body: JSON.stringify({ id_signos: registro.id_signos }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarDatos();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

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

  const registrosFiltrados = registros.filter((r) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      `${r.paciente_nombre || ''} ${r.paciente_apellido || ''}`.toLowerCase().includes(texto) ||
      `${r.enfermero_nombre || ''}`.toLowerCase().includes(texto);
    const coincideAlerta = !soloAlertas || esAlerta(r);
    return coincideTexto && coincideAlerta;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Registro de Signos Vitales</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra los signos vitales registrados por el personal de enfermería.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nuevo registro
          </button>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorGeneral}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente o enfermero(a)..."
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
                { clave: 'enfermero_nombre', titulo: 'Enfermero(a)', render: (v, f) => `${v} ${f.enfermero_apellido || ''}`.trim() },
                { clave: 'fecha_hora', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              ]}
              datos={registrosFiltrados}
              cargando={cargando}
              emptyMessage="No hay signos vitales que coincidan con el filtro"
              onEditar={abrirModalEditar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar signos vitales' : 'Nuevo registro de signos vitales'} ancho="max-w-2xl">
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Consulta del paciente *</label>
            {modoEdicion ? (
              <input
                type="text"
                value={form.id_consulta_label || `#${form.id_consulta}`}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed"
              />
            ) : (
              <select
                name="id_consulta"
                value={form.id_consulta}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_consulta ? 'border-red-400' : 'border-slate-300'}`}
                required
              >
                <option value="">Seleccionar consulta</option>
                {consultas.map((c) => (
                  <option key={c.id_consulta} value={c.id_consulta}>
                    #{c.id_consulta} · {c.paciente_nombre} · {formatearFecha(c.fecha_consulta)}
                  </option>
                ))}
              </select>
            )}
            {errores.id_consulta && <p className="text-red-500 text-xs mt-1">{errores.id_consulta}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Enfermero(a) responsable *</label>
            <select
              name="id_enfermero"
              value={form.id_enfermero}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_enfermero ? 'border-red-400' : 'border-slate-300'}`}
              required
            >
              <option value="">Seleccionar enfermero(a)</option>
              {enfermeros.map((e) => (
                <option key={e.id_enfermero} value={e.id_enfermero}>
                  {e.nombre_completo}
                </option>
              ))}
            </select>
            {errores.id_enfermero && <p className="text-red-500 text-xs mt-1">{errores.id_enfermero}</p>}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Signos vitales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Presión arterial (mmHg) *</label>
                <input
                  type="text"
                  name="presion_arterial"
                  value={form.presion_arterial}
                  onChange={handleChange}
                  placeholder="Ej. 120/80"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.presion_arterial ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errores.presion_arterial && <p className="text-red-500 text-xs mt-1">{errores.presion_arterial}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura"
                  value={form.temperatura}
                  onChange={handleChange}
                  placeholder="Ej. 36.5"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.temperatura ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errores.temperatura && <p className="text-red-500 text-xs mt-1">{errores.temperatura}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Frecuencia cardíaca (lpm) *</label>
                <input
                  type="number"
                  step="1"
                  name="frecuencia_cardiaca"
                  value={form.frecuencia_cardiaca}
                  onChange={handleChange}
                  placeholder="Ej. 80"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.frecuencia_cardiaca ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errores.frecuencia_cardiaca && <p className="text-red-500 text-xs mt-1">{errores.frecuencia_cardiaca}</p>}
              </div>
            </div>
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
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar signos vitales' : 'Registrar signos vitales'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
