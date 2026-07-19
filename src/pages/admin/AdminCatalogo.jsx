// src/pages/admin/AdminCatalogo.jsx
// ============================================================
// Catálogo administrable: especialidad, medicos, enfermeros,
// farmacéuticos, técnicos de laboratorio y tipos de seguro.
// El stock (mínimo/máximo) se gestiona aparte en stock.
// ============================================================
import { Fragment, useEffect, useMemo, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import {
  IconoPlus,
  IconoEdit,
  IconoTrash,
  IconoStethoscope,
  IconoHeart,
  IconoPill,
  IconoBeaker,
  IconoShield,
  IconoUsers,
} from '../../components/Iconos.jsx';

const ESTADOS = { activo: 'Activo', inactivo: 'Inactivo' };

function claseEstado(v) {
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ` + (v === 'activo' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-700 border-red-200');
}

const TABS = [
  { id: 'especialidad', label: 'Especialidades', icono: IconoStethoscope, entidad: 'especialidad' },
  { id: 'medico', label: 'Médicos', icono: IconoStethoscope, entidad: 'medico' },
  { id: 'enfermero', label: 'Enfermeros', icono: IconoHeart, entidad: 'enfermero' },
  { id: 'farmaceutico', label: 'Farmacéuticos', icono: IconoPill, entidad: 'farmaceutico' },
  { id: 'tecnico', label: 'Téc. Laboratorio', icono: IconoBeaker, entidad: 'tecnico' },
  { id: 'tipo_seguro', label: 'Tipos de Seguro', icono: IconoShield, entidad: 'tipo_seguro' },
];

const VACIO = {
  especialidad: { nombre: '', tarifa: '', descripcion: '', estado: 'activo' },
  medico: { nombre: '', apellido: '', ci: '', telefono: '', fecha_nac: '', sexo: 'M', correo: '', contrasena: '', nro_licencia: '', id_especialidad: '', estado: 'activo' },
  enfermero: { nombre: '', apellido: '', ci: '', telefono: '', fecha_nac: '', sexo: 'M', correo: '', contrasena: '', estado: 'activo' },
  farmaceutico: { nombre: '', apellido: '', ci: '', telefono: '', fecha_nac: '', sexo: 'M', correo: '', contrasena: '', nro_licencia: '', estado: 'activo' },
  tecnico: { nombre: '', apellido: '', ci: '', telefono: '', fecha_nac: '', sexo: 'M', correo: '', contrasena: '', numero_licencia: '', especialidad_laboratorio: '', estado: 'activo' },
  tipo_seguro: { nombre: '', descripcion: '', estado: 'activo' },
};

export default function AdminCatalogo() {
  const usuario = obtenerUsuario();
  const [tab, setTab] = useState('especialidad');
  const [datos, setDatos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [faltaMigracion, setFaltaMigracion] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [form, setForm] = useState(VACIO.especialidad);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const tabActual = useMemo(() => TABS.find((t) => t.id === tab), [tab]);

  async function cargar(entidad = tabActual.entidad) {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch(`/api/catalogo?entidad=${entidad}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.mensaje || 'No se pudo cargar el catálogo.');
      const key = {
        especialidad: 'especialidades',
        medico: 'medicos',
        enfermero: 'enfermeros',
        farmaceutico: 'farmaceuticos',
        tecnico: 'tecnicos',
        tipo_seguro: 'tipos_seguro',
      }[entidad];
      setDatos(json[key] || []);
      if (entidad === 'medico' && json.especialidades) setEspecialidades(json.especialidades);
      setFaltaMigracion(entidad === 'tipo_seguro' && json.faltaMigracion === true);
    } catch (e) {
      setErrorGeneral(e.message);
      setDatos([]);
      setFaltaMigracion(false);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(tabActual.entidad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function resetForm() {
    setForm({ ...VACIO[tab] });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
  }

  function abrirCrear() {
    setModoEdicion(false);
    resetForm();
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setModoEdicion(true);
    const base = { ...VACIO[tab] };
    if (tab === 'especialidad') {
      Object.assign(base, { id: item.id_especialidad, nombre: item.nombre, tarifa: item.tarifa ?? '', descripcion: item.descripcion || '', estado: item.estado || 'activo' });
    } else if (tab === 'tipo_seguro') {
      Object.assign(base, { id: item.id_tipo_seguro, nombre: item.nombre, descripcion: item.descripcion || '', estado: item.estado || 'activo' });
    } else if (tab === 'medico') {
      Object.assign(base, { id: item.id_medico, nombre: item.nombre, apellido: item.apellido, ci: item.ci, telefono: item.telefono, fecha_nac: item.fecha_nac, sexo: item.sexo, correo: item.correo, nro_licencia: item.nro_licencia, id_especialidad: item.id_especialidad || '', estado: item.estado || 'activo' });
    } else if (tab === 'enfermero') {
      Object.assign(base, { id: item.id_enfermero, nombre: item.nombre, apellido: item.apellido, ci: item.ci, telefono: item.telefono, fecha_nac: item.fecha_nac, sexo: item.sexo, correo: item.correo, estado: item.estado || 'activo' });
    } else if (tab === 'farmaceutico') {
      Object.assign(base, { id: item.id_farmaceutico, nombre: item.nombre, apellido: item.apellido, ci: item.ci, telefono: item.telefono, fecha_nac: item.fecha_nac, sexo: item.sexo, correo: item.correo, nro_licencia: item.nro_licencia, estado: item.estado || 'activo' });
    } else if (tab === 'tecnico') {
      Object.assign(base, { id: item.id_tecnico_laboratorio, nombre: item.nombre, apellido: item.apellido, ci: item.ci, telefono: item.telefono, fecha_nac: item.fecha_nac, sexo: item.sexo, correo: item.correo, numero_licencia: item.numero_licencia, especialidad_laboratorio: item.especialidad_laboratorio, estado: item.estado || 'activo' });
    }
    setForm(base);
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrores((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    const json = {
      ...form,
      tarifa: form.tarifa === '' ? undefined : Number(form.tarifa),
      id_especialidad: form.id_especialidad === '' ? undefined : Number(form.id_especialidad),
    };
    if (modoEdicion) json.id = form.id;

    try {
      const res = await fetch('/api/catalogo?entidad=' + tabActual.entidad, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const out = await res.json();
      if (!out.ok) {
        setErrorGeneral(out.errores?.general || out.mensaje || 'No se pudo guardar.');
        if (out.errores) setErrores(out.errores);
        return;
      }
      setMensaje(out.mensaje || 'Guardado correctamente.');
      await cargar(tabActual.entidad);
      setTimeout(() => { setModalAbierto(false); setMensaje(null); }, 1200);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(item) {
    const id = item.id_especialidad ?? item.id_tipo_seguro ?? item.id_medico ?? item.id_enfermero ?? item.id_farmaceutico ?? item.id_tecnico_laboratorio;
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/catalogo?entidad=${tabActual.entidad}&id=${id}`, { method: 'DELETE' });
      const out = await res.json();
      if (!out.ok) { alert(out.mensaje || 'No se pudo eliminar.'); return; }
      await cargar(tabActual.entidad);
    } catch {
      alert('No se pudo conectar con el servidor.');
    }
  }

  const inputBase = 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition';
  const esPersonal = tab === 'medico' || tab === 'enfermero' || tab === 'farmaceutico' || tab === 'tecnico';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo del Hospital</h1>
          <p className="text-slate-500 text-sm mt-1">Administra especialidades, personal y tipos de seguro.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-2 self-start"
        >
          <IconoPlus className="w-4 h-4" />
          Nuevo registro
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icono;
          const activo = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition -mb-px border-b-2 ${
                activo ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {errorGeneral && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        {tab === 'especialidad' && (
          <TablaCRUD
            cargando={cargando}
            emptyMessage="No hay especialidades registradas"
            columnas={[
              { clave: 'nombre', titulo: 'Nombre' },
              { clave: 'tarifa', titulo: 'Tarifa (Bs)', render: (v) => (v != null ? Number(v).toFixed(2) : '—') },
              { clave: 'descripcion', titulo: 'Descripción', render: (v) => v || '—' },
              { clave: 'estado', titulo: 'Estado', render: (v) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${v === 'activo' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{ESTADOS[v] || v}</span>
              ) },
            ]}
            datos={datos}
            onEditar={abrirEditar}
            onEliminar={handleEliminar}
            iconoEditar={<IconoEdit className="w-4 h-4" />}
            iconoEliminar={<IconoTrash className="w-4 h-4" />}
          />
        )}

        {tab === 'tipo_seguro' && (
          <Fragment>
            {faltaMigracion && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                La tabla <b>tipo_seguro</b> aún no existe. Ejecuta la migración <b>sql/008_catalogo_administracion.sql</b> en el SQL Editor de Supabase para habilitar el registro y la lista de tipos de seguro.
              </div>
            )}
            <TablaCRUD
              cargando={cargando}
              emptyMessage="No hay tipos de seguro registrados"
              columnas={[
                { clave: 'nombre', titulo: 'Nombre' },
                { clave: 'descripcion', titulo: 'Descripción', render: (v) => v || '—' },
                { clave: 'estado', titulo: 'Estado', render: (v) => (
                  <span className={claseEstado(v)}>{ESTADOS[v] || v}</span>
                ) },
              ]}
              datos={datos}
              onEditar={abrirEditar}
              onEliminar={handleEliminar}
              iconoEditar={<IconoEdit className="w-4 h-4" />}
              iconoEliminar={<IconoTrash className="w-4 h-4" />}
            />
          </Fragment>
        )}
        )}

        {esPersonal && (
          <TablaCRUD
            cargando={cargando}
            emptyMessage={`No hay ${tabActual.label.toLowerCase()} registrados`}
            columnas={(() => {
              const cols = [
                { clave: 'nombre_completo', titulo: 'Nombre completo' },
                { clave: 'ci', titulo: 'CI' },
                { clave: 'correo', titulo: 'Correo' },
              ];
              if (tab === 'medico') {
                cols.push({ clave: 'especialidad', titulo: 'Especialidad', render: (v) => v || '—' });
              }
              if (tab !== 'enfermero') {
                cols.push({ clave: 'nro_licencia', titulo: 'Nro. Licencia', render: (v) => v || (tab === 'tecnico' ? form.numero_licencia : '—') });
              }
              cols.push({ clave: 'estado', titulo: 'Estado', render: (v) => (
                <span className={claseEstado(v)}>{ESTADOS[v] || v}</span>
              ) });
              return cols;
            })()}
            datos={datos}
            onEditar={abrirEditar}
            onEliminar={handleEliminar}
            iconoEditar={<IconoEdit className="w-4 h-4" />}
            iconoEliminar={<IconoTrash className="w-4 h-4" />}
          />
        )}
      </div>

      {/* MODAL */}
      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEdicion ? 'Editar registro' : `Nuevo ${tabActual.label.replace(/s$/, '').toLowerCase()}`} ancho="max-w-2xl">
        {mensaje && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>}
        {errorGeneral && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(tab === 'especialidad' || tab === 'tipo_seguro') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required className={`${inputBase} ${errores.nombre ? 'border-red-400' : 'border-slate-300'}`} />
                {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
              </div>
              {tab === 'especialidad' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tarifa (Bs)</label>
                  <input type="number" step="0.01" name="tarifa" value={form.tarifa} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                <input name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
              </div>
            </>
          )}

          {esPersonal && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required className={`${inputBase} ${errores.nombre ? 'border-red-400' : 'border-slate-300'}`} />
                  {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Apellido *</label>
                  <input name="apellido" value={form.apellido} onChange={handleChange} required className={`${inputBase} ${errores.apellido ? 'border-red-400' : 'border-slate-300'}`} />
                  {errores.apellido && <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CI *</label>
                  <input name="ci" value={form.ci} onChange={handleChange} className={`${inputBase} ${errores.ci ? 'border-red-400' : 'border-slate-300'}`} />
                  {errores.ci && <p className="text-red-500 text-xs mt-1">{errores.ci}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Correo *</label>
                  <input type="email" name="correo" value={form.correo} onChange={handleChange} required className={`${inputBase} ${errores.correo ? 'border-red-400' : 'border-slate-300'}`} />
                  {errores.correo && <p className="text-red-500 text-xs mt-1">{errores.correo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha nac.</label>
                  <input type="date" name="fecha_nac" value={form.fecha_nac} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sexo</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              {tab === 'medico' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad</label>
                  <select name="id_especialidad" value={form.id_especialidad} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
                    <option value="">Sin asignar</option>
                    {especialidades.map((e) => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                  </select>
                </div>
              )}
              {tab === 'medico' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nro. Licencia</label>
                  <input name="nro_licencia" value={form.nro_licencia} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
              )}
              {tab === 'farmaceutico' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nro. Licencia</label>
                  <input name="nro_licencia" value={form.nro_licencia} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                </div>
              )}
              {tab === 'tecnico' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nro. Licencia</label>
                    <input name="numero_licencia" value={form.numero_licencia} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad de laboratorio</label>
                    <input name="especialidad_laboratorio" value={form.especialidad_laboratorio} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{modoEdicion ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña (opcional, por defecto su CI)'}</label>
                <input type="password" name="contrasena" value={form.contrasena} onChange={handleChange} className={`${inputBase} ${errores.contrasena ? 'border-red-400' : 'border-slate-300'}`} placeholder="Si la dejas vacía se usará el CI" />
                {errores.contrasena && <p className="text-red-500 text-xs mt-1">{errores.contrasena}</p>}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition">
              {Object.entries(ESTADOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {enviando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
