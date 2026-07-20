import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';

const TIPOS = {
  Academica: 'Académica',
  Clinica: 'Clínica',
  Administrativa: 'Administrativa',
};

const estadoInicialForm = {
  id_area: null,
  nombre_area: '',
  tipo_area: 'Academica',
  descripcion: '',
};

export default function AdminFacultades() {
  const [facultades, setFacultades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(estadoInicialForm);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  async function cargarFacultades() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/facultades/listar');
      const data = await res.json();
      if (data.ok) setFacultades(data.facultades || []);
      else setErrorGeneral(data.mensaje || 'No se pudieron cargar las facultades.');
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarFacultades();
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm(estadoInicialForm);
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(facultad) {
    setModoEdicion(true);
    setForm({
      id_area: facultad.id_area,
      nombre_area: facultad.nombre_area || '',
      tipo_area: facultad.tipo_area || 'Academica',
      descripcion: facultad.descripcion || '',
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
      const url = modoEdicion ? '/api/facultades/actualizar' : '/api/facultades/registro';
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
      await cargarFacultades();
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

  async function handleEliminar(facultad) {
    if (!confirm(`¿Eliminar "${facultad.nombre_area}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/facultades/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_area: facultad.id_area }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarFacultades();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Facultades / Áreas</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra el catálogo usado para inscribir pacientes/estudiantes.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nueva facultad/área
          </button>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TablaCRUD
  columnas={[
    { clave: 'nombre_area', titulo: 'Nombre' },
    {
      clave: 'tipo_area',
      titulo: 'Tipo',
      render: (v) => TIPOS[v] || v || '-'
    },
    {
      clave: 'descripcion',
      titulo: 'Descripción',
      render: (v) => v || '-'
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (v, fila) => (
        <div className="flex gap-2">
          <button
            onClick={() => abrirModalEditar(fila)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition"
          >
            Editar
          </button>

          <button
            onClick={() => handleEliminar(fila)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]}
  datos={facultades}
  cargando={cargando}
  emptyMessage="No hay facultades/áreas registradas"
/>
          )}
        </div>
      </div>

      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={modoEdicion ? 'Editar facultad/área' : 'Nueva facultad/área'}
        ancho="max-w-lg"
      >
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
            <input
              name="nombre_area"
              value={form.nombre_area}
              onChange={handleChange}
              placeholder="Ej. Facultad de Ingeniería"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.nombre_area ? 'border-red-400' : 'border-slate-300'}`}
              required
            />
            {errores.nombre_area && <p className="text-red-500 text-xs mt-1">{errores.nombre_area}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo *</label>
            <select
              name="tipo_area"
              value={form.tipo_area}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              {Object.entries(TIPOS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
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
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}