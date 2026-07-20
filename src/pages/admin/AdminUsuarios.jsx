import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import { IconoPlus, IconoEdit, IconoTrash } from '../../components/Iconos.jsx';

const ROLES = {
  paciente: 'Paciente',
  enfermero: 'Enfermero',
  medico: 'Medico',
  administrativo: 'Administrativo',
  farmaceutico: 'Farmaceutico',
  tecnico_laboratorio: 'Tecnico laboratorio',
};

const ESTADOS = {
  activo: 'Activo',
  inactivo: 'Inactivo',
};

const ROLES_CON_DOCUMENTO_UNIVERSITARIO = ['paciente', 'enfermero', 'medico', 'administrativo', 'farmaceutico', 'tecnico_laboratorio'];

const FORM_INICIAL = {
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
  numero_licencia: '',
  id_especialidad: '',
  especialidad_laboratorio: '',
  area_servicio: '',
  cargo: '',
  codigo_universitario: '',
  documento_validacion_tipo: 'Credencial universitaria',
  documento_validacion_url: '',
  documento_validacion_estado: 'no_requerido',
  id_area: '',
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const pideDocumentoUniversitario = ROLES_CON_DOCUMENTO_UNIVERSITARIO.includes(form.rol);

  function cargarArchivoEnCampo(name, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, [name]: reader.result }));
      setErrores((prev) => ({ ...prev, [name]: '' }));
    };
    reader.readAsDataURL(file);
  }

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

  async function cargarEspecialidades() {
    try {
      const res = await fetch('/api/especialidades/listar');
      const data = await res.json();
      if (data.ok) setEspecialidades(data.especialidades || []);
    } catch {
      setEspecialidades([]);
    }
  }

  async function cargarFacultades() {
    try {
      const res = await fetch('/api/facultades/listar');
      const data = await res.json();
      if (data.ok) setFacultades(data.facultades || []);
    } catch {
      setFacultades([]);
    }
  }

  useEffect(() => {
    cargarUsuarios();
    cargarEspecialidades();
    cargarFacultades();
  }, []);

  function abrirModalCrear() {
    setModoEdicion(false);
    setForm(FORM_INICIAL);
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirModalEditar(user) {
    setModoEdicion(true);
    setForm({
      ...FORM_INICIAL,
      id_usuario: user.id_usuario,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      ci: user.ci || '',
      telefono: user.telefono || '',
      fecha_nac: user.fecha_nac || '',
      sexo: user.sexo || 'M',
      correo: user.correo || '',
      rol: user.rol || 'paciente',
      estado: user.estado || 'activo',
      id_area: user.id_area || '',
      nro_licencia: user.nro_licencia || '',
      numero_licencia: user.numero_licencia || '',
      id_especialidad: user.id_especialidad || '',
      especialidad_laboratorio: user.especialidad_laboratorio || '',
      area_servicio: user.area_servicio || '',
      cargo: user.cargo || '',
      codigo_universitario: user.codigo_universitario || '',
      documento_validacion_tipo: user.documento_validacion_tipo || 'Credencial universitaria',
      documento_validacion_url: user.documento_validacion_url || '',
      documento_validacion_estado: user.documento_validacion_estado || 'pendiente',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const siguiente = { ...prev, [name]: value };
      if (name === 'rol') {
        siguiente.documento_validacion_estado = 'pendiente';
      }
      return siguiente;
    });
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
      const body = modoEdicion ? { id_usuario: form.id_usuario, ...form } : form;

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
      }, 900);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(user) {
    if (!confirm(`Eliminar al usuario ${user.nombre_completo}? Esta accion no se puede deshacer.`)) return;

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
            <h1 className="text-2xl font-bold text-white">Gestion de Usuarios</h1>
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
                { clave: 'telefono', titulo: 'Telefono' },
                { clave: 'rol', titulo: 'Rol', render: (v) => ROLES[v] || v },
                { clave: 'facultad', titulo: 'Facultad / Area', render: (v) => v || '-' },
                {
                  clave: 'documento_validacion_estado',
                  titulo: 'Doc. Univ.',
                  render: (v) => v || 'pendiente',
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
        {mensaje && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>}
        {errorGeneral && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo label="Nombre *" name="nombre" value={form.nombre} onChange={handleChange} error={errores.nombre} required />
            <Campo label="Apellido *" name="apellido" value={form.apellido} onChange={handleChange} error={errores.apellido} required />
            <Campo label="CI *" name="ci" value={form.ci} onChange={handleChange} error={errores.ci} required />
            <Campo label="Telefono" name="telefono" value={form.telefono} onChange={handleChange} />
            <Campo label="Fecha de nacimiento" type="date" name="fecha_nac" value={form.fecha_nac} onChange={handleChange} />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <Campo label="Correo electronico *" type="email" name="correo" value={form.correo} onChange={handleChange} error={errores.correo} required />

          {!modoEdicion && (
            <Campo label="Contrasena *" type="password" name="contrasena" value={form.contrasena} onChange={handleChange} error={errores.contrasena} required />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                {Object.entries(ROLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado *</label>
              <select name="estado" value={form.estado} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                {Object.entries(ESTADOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Facultad / Area *</label>
            <select
              name="id_area"
              value={form.id_area}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white ${errores.id_area ? 'border-red-400' : 'border-slate-300'}`}
              required
            >
              <option value="">Selecciona una facultad o area</option>
              {facultades.map((facultad) => (
                <option key={facultad.id_area} value={facultad.id_area}>
                  {facultad.nombre_area}
                </option>
              ))}
            </select>
            {errores.id_area && <p className="text-red-500 text-xs mt-1">{errores.id_area}</p>}
          </div>

          {form.rol === 'medico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Nro. de licencia *" name="nro_licencia" value={form.nro_licencia} onChange={handleChange} error={errores.nro_licencia} required />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad *</label>
                <select name="id_especialidad" value={form.id_especialidad} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.id_especialidad ? 'border-red-400' : 'border-slate-300'}`} required>
                  <option value="">Selecciona una especialidad</option>
                  {especialidades.map((e) => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                </select>
                {errores.id_especialidad && <p className="text-red-500 text-xs mt-1">{errores.id_especialidad}</p>}
              </div>
            </div>
          )}

          {form.rol === 'enfermero' && (
            <Campo label="Area / servicio de enfermeria *" name="area_servicio" value={form.area_servicio} onChange={handleChange} error={errores.area_servicio} required />
          )}

          {form.rol === 'farmaceutico' && (
            <Campo label="Nro. de licencia farmaceutica *" name="nro_licencia" value={form.nro_licencia} onChange={handleChange} error={errores.nro_licencia} required />
          )}

          {form.rol === 'administrativo' && (
            <Campo label="Cargo administrativo *" name="cargo" value={form.cargo} onChange={handleChange} error={errores.cargo} required />
          )}

          {form.rol === 'tecnico_laboratorio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Numero de licencia *" name="numero_licencia" value={form.numero_licencia} onChange={handleChange} error={errores.numero_licencia} required />
              <Campo label="Especialidad laboratorio *" name="especialidad_laboratorio" value={form.especialidad_laboratorio} onChange={handleChange} error={errores.especialidad_laboratorio} required />
            </div>
          )}

          {pideDocumentoUniversitario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Codigo / item / matricula *" name="codigo_universitario" value={form.codigo_universitario} onChange={handleChange} error={errores.codigo_universitario} required />
              <Campo label="Tipo de documento" name="documento_validacion_tipo" value={form.documento_validacion_tipo} onChange={handleChange} />
              <div className="md:col-span-2">
                <ArchivoCampo
                  label="Foto / documento de respaldo *"
                  value={form.documento_validacion_url}
                  error={errores.documento_validacion_url}
                  onFile={(file) => cargarArchivoEnCampo('documento_validacion_url', file)}
                />
              </div>
              {modoEdicion && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estado documento</label>
                  <select name="documento_validacion_estado" value={form.documento_validacion_estado} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                    <option value="pendiente">Pendiente</option>
                    <option value="validado">Validado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar usuario' : 'Registrar usuario'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Campo({ label, name, value, onChange, error, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${error ? 'border-red-400' : 'border-slate-300'}`}
        required={required}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function ArchivoCampo({ label, value, error, onFile }) {
  const tieneArchivo = Boolean(value);

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className={`rounded-lg border bg-white p-3 ${error ? 'border-red-400' : 'border-slate-300'}`}>
        <input
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
          required={!tieneArchivo}
        />
        {tieneArchivo && (
          <p className="mt-2 text-xs text-green-700">
            Archivo cargado correctamente.
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
