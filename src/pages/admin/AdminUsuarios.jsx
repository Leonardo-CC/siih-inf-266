import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import {
  IconoPlus,
  IconoEdit,
  IconoTrash,
  IconoUsers,
  IconoCog,
} from '../../components/Iconos.jsx';

const ROLES = {
  paciente: 'Paciente',
  enfermero: 'Enfermero',
  medico: 'Médico',
  administrativo: 'Administrativo',
  farmaceutico: 'Farmacéutico',
};

const ESTADOS = {
  activo: 'Activo',
  inactivo: 'Inactivo',
};

export default function AdminUsuarios() {
  const usuario = obtenerUsuario();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState({
    id_usuario: null,
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    fecha_nac: '',
    sexo: 'M',
    correo: '',
    contrasena: '',
    rol: 'paciente',
    estado: 'activo',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  async function cargarUsuarios() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/usuarios/listar');
      const data = await res.json();
      if (data.ok) {
        setUsuarios(data.usuarios || []);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar los usuarios.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm({
      id_usuario: null,
      nombre: '',
      apellido: '',
      ci: '',
      telefono: '',
      fecha_nac: '',
      sexo: 'M',
      correo: '',
      contrasena: '',
      rol: 'paciente',
      estado: 'activo',
      nro_licencia: '',
id_especialidad: '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(user) {
    setModoEdicion(true);
    setForm({
      id_usuario: user.id_usuario,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      ci: user.ci || '',
      telefono: user.telefono || '',
      fecha_nac: user.fecha_nac || '',
      sexo: user.sexo || 'M',
      correo: user.correo || '',
      contrasena: '',
      rol: user.rol || 'paciente',
      estado: user.estado || 'activo',
      nro_licencia: user.nro_licencia || '',
id_especialidad: user.id_especialidad || '',
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
      const url = modoEdicion ? '/api/usuarios/actualizar' : '/api/usuarios/registro';
      const method = modoEdicion ? 'PUT' : 'POST';

      const body = modoEdicion
        ? { id_usuario: form.id_usuario, ...form }
        : form;

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
      await cargarUsuarios();
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

 const [especialidades, setEspecialidades] = useState([]);

async function cargarEspecialidades() {
  try {
    const res = await fetch('/api/especialidades/listar');
    const data = await res.json();
    if (data.ok) setEspecialidades(data.especialidades || []);
  } catch {
    // si falla, el select queda vacío; no bloqueamos el resto del modal
  }
}

useEffect(() => {
  cargarUsuarios();
  cargarEspecialidades();
}, []);
  
  async function handleEliminar(user) {
    if (!confirm(`¿Eliminar al usuario ${user.nombre_completo}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/usuarios/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: user.id_usuario }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.mensaje || 'No se pudo eliminar.');
        return;
      }
      await cargarUsuarios();
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
            <p className="text-blue-100 mt-1 text-sm">Administra todos los usuarios del sistema.</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <IconoPlus className="w-4 h-4" />
            Nuevo usuario
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
              { clave: 'telefono', titulo: 'Teléfono' },
              {
                clave: 'rol',
                titulo: 'Rol',
                render: (v) => ROLES[v] || v,
              },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (v) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    v === 'activo' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {ESTADOS[v] || v}
                  </span>
                ),
              },
            ]}
            datos={usuarios}
            cargando={cargando}
            emptyMessage="No hay usuarios registrados"
            onEditar={abrirModalEditar}
            onEliminar={handleEliminar}
            iconoEditar={<IconoEdit className="w-4 h-4" />}
            iconoEliminar={<IconoTrash className="w-4 h-4" />}
          />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar usuario' : 'Nuevo usuario'} ancho="max-w-2xl">
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
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.ci ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errores.ci && <p className="text-red-500 text-xs mt-1">{errores.ci}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nac"
                value={form.fecha_nac}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Sexo</label>
              <select
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electrónico *</label>
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

          {!modoEdicion && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña *</label>
              <input
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.contrasena ? 'border-red-400' : 'border-slate-300'}`}
                required={!modoEdicion}
              />
              {errores.contrasena && <p className="text-red-500 text-xs mt-1">{errores.contrasena}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rol *</label>
              <select
                name="rol"
                value={form.rol}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                {Object.entries(ROLES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado *</label>
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
          </div>
          {form.rol === 'medico' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">Nro. de licencia *</label>
      <input
        name="nro_licencia"
        value={form.nro_licencia}
        onChange={handleChange}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.nro_licencia ? 'border-red-400' : 'border-slate-300'}`}
        required
      />
      {errores.nro_licencia && <p className="text-red-500 text-xs mt-1">{errores.nro_licencia}</p>}
    </div>
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad *</label>
      <select
        name="id_especialidad"
        value={form.id_especialidad}
        onChange={handleChange}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_especialidad ? 'border-red-400' : 'border-slate-300'}`}
        required
      >
        <option value="">Selecciona una especialidad</option>
        {especialidades.map((e) => (
          <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
        ))}
      </select>
      {errores.id_especialidad && <p className="text-red-500 text-xs mt-1">{errores.id_especialidad}</p>}
    </div>
  </div>
)}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar usuario' : 'Registrar usuario'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
