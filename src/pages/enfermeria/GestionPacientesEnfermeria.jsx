import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';

export default function GestionPacientesEnfermeria() {
  const usuario = obtenerUsuario();
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState({
    id_paciente: null,
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    correo: '',
    id_tipo_seguro: '',
    numero_seguro: '',
  });
  const [tiposSeguro, setTiposSeguro] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  async function cargarPacientes() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/pacientes/listar');
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
    fetch('/api/catalogo?entidad=tipo_seguro')
      .then((r) => r.json())
      .then((json) => setTiposSeguro(json.tipos_seguro || []))
      .catch(() => setTiposSeguro([]));
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm({
      id_paciente: null,
      nombre: '',
      apellido: '',
      ci: '',
      telefono: '',
      correo: '',
      id_tipo_seguro: '',
      numero_seguro: '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(paciente) {
    setModoEdicion(true);
    setForm({
      id_paciente: paciente?.id_paciente || null,
      nombre: paciente?.nombre || '',
      apellido: paciente?.apellido || '',
      ci: paciente?.ci || '',
      telefono: paciente?.telefono || '',
      correo: paciente?.correo || '',
      id_tipo_seguro: paciente?.id_tipo_seguro || '',
      numero_seguro: paciente?.numero_seguro || '',
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
      const url = modoEdicion ? '/api/pacientes/actualizar' : '/api/pacientes/registro';
      const method = modoEdicion ? 'PUT' : 'POST';

      const body = modoEdicion ? form : { ...form, contrasena: form.ci };

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
      await cargarPacientes();
      setTimeout(() => setModalAbierto(false), 1200);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(paciente) {
    if (!confirm(`¿Eliminar a ${paciente.nombre_completo}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/pacientes/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_paciente: paciente.id_paciente }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarPacientes();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion de Pacientes</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra los pacientes registrados en el sistema.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nuevo paciente
          </button>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorGeneral}
            </div>
          )}

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TablaCRUD
              columnas={[
                { clave: 'nombre_completo', titulo: 'Nombre completo' },
                { clave: 'correo', titulo: 'Correo' },
                { clave: 'ci', titulo: 'CI' },
                { clave: 'telefono', titulo: 'Telefono' },
                { clave: 'tipo_seguro', titulo: 'Seguro' },
              ]}
              datos={pacientes}
              cargando={cargando}
              emptyMessage="No hay pacientes registrados"
              onEditar={abrirModalEditar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar paciente' : 'Nuevo paciente'} ancho="max-w-2xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.nombre ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Apellido *</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.apellido ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.apellido && <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">CI</label>
              <input
                name="ci"
                value={form.ci}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Telefono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electronico *</label>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.correo ? 'border-red-400' : 'border-slate-300'}`}
              required
            />
            {errores.correo && <p className="text-red-500 text-xs mt-1">{errores.correo}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de seguro</label>
              <select
                name="id_tipo_seguro"
                value={form.id_tipo_seguro}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                <option value="">Ninguno</option>
                {tiposSeguro.map((ts) => (
                  <option key={ts.id_tipo_seguro} value={ts.id_tipo_seguro}>
                    {ts.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Numero de seguro</label>
              <input
                name="numero_seguro"
                value={form.numero_seguro}
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
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar paciente' : 'Registrar paciente'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
