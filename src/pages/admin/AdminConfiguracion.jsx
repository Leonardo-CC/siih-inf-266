import { useEffect, useState } from 'react';
import { obtenerUsuario, guardarUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import { IconoLock } from '../../components/Iconos.jsx';

function formatearValor(v) {
  if (v === '' || v == null) return '—';
  return v;
}

export default function AdminConfiguracion() {
  const usuario = obtenerUsuario();
  const usuarioId = usuario?.id_usuario;
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    contrasenaActual: '',
    contrasenaNueva: '',
    repetirContrasena: '',
  });
  const [bloqueados, setBloqueados] = useState({ ci: '', rol: '' });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true);
      setErrorGeneral(null);
      try {
        const res = await fetch('/api/administrativo/perfil', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user': JSON.stringify(usuario),
          },
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.mensaje || 'No se pudo cargar el perfil.');

        const p = json.perfil;
        setBloqueados({
          ci: p.ci,
          rol: p.rol,
        });
        setForm((prev) => ({
          ...prev,
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          telefono: p.telefono || '',
          correo: p.correo || '',
        }));
      } catch (e) {
        setErrorGeneral(e.message || 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, [usuarioId]);

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
    if (form.contrasenaNueva) {
      if (form.contrasenaNueva.length < 6) errs.contrasenaNueva = 'La nueva contraseña debe tener al menos 6 caracteres.';
      if (form.contrasenaNueva !== form.repetirContrasena) errs.repetirContrasena = 'Las contraseñas no coinciden.';
      if (!form.contrasenaActual) errs.contrasenaActual = 'Ingresa tu contraseña actual para confirmar el cambio.';
    }

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      setEnviando(false);
      return;
    }

    try {
      const res = await fetch('/api/administrativo/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user': JSON.stringify(usuario),
        },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          correo: form.correo,
          contrasenaActual: form.contrasenaActual,
          contrasenaNueva: form.contrasenaNueva,
          repetirContrasena: form.repetirContrasena,
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        setErrorGeneral(json.mensaje || json.errores?.general || 'No se pudo guardar.');
        if (json.errores) setErrores(json.errores);
        return;
      }

      setMensaje(json.mensaje || 'Perfil actualizado correctamente.');
      setForm((prev) => ({
        ...prev,
        contrasenaActual: '',
        contrasenaNueva: '',
        repetirContrasena: '',
      }));

      const sesion = obtenerUsuario();
      if (sesion) {
        guardarUsuario({ ...sesion, correo: form.correo, nombre: form.nombre, apellido: form.apellido });
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputBase = 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Mi configuración</h1>
          <p className="text-blue-100 mt-1 text-sm">Actualiza tu correo y contraseña de administrador.</p>
        </div>

        <div className="p-8">
          {mensaje && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
          )}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos de identidad (no editables)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
                  <input
                    value={form.nombre ? `${form.nombre} ${form.apellido}`.trim() : '—'}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Carnet de Identidad (CI)</label>
                  <input
                    value={formatearValor(bloqueados.ci)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> Dato de identidad unico</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                  <input
                    value={formatearValor(bloqueados.rol)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> Asignado por el sistema</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Datos de contacto</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  className={`${inputBase} ${errores.correo ? 'border-red-400' : 'border-slate-300'}`}
                  required
                />
                {errores.correo && <p className="text-red-500 text-xs mt-1">{errores.correo}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className={`${inputBase} border-slate-300`}
                />
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Cambiar contraseña</h2>
              <p className="text-xs text-slate-500 -mt-2">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña actual</label>
                <input
                  type="password"
                  name="contrasenaActual"
                  value={form.contrasenaActual}
                  onChange={handleChange}
                  className={`${inputBase} border-slate-300`}
                  autoComplete="current-password"
                />
                {errores.contrasenaActual && <p className="text-red-500 text-xs mt-1">{errores.contrasenaActual}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    name="contrasenaNueva"
                    value={form.contrasenaNueva}
                    onChange={handleChange}
                    className={`${inputBase} ${errores.contrasenaNueva ? 'border-red-400' : 'border-slate-300'}`}
                    autoComplete="new-password"
                  />
                  {errores.contrasenaNueva && <p className="text-red-500 text-xs mt-1">{errores.contrasenaNueva}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Repetir nueva contraseña</label>
                  <input
                    type="password"
                    name="repetirContrasena"
                    value={form.repetirContrasena}
                    onChange={handleChange}
                    className={`${inputBase} ${errores.repetirContrasena ? 'border-red-400' : 'border-slate-300'}`}
                    autoComplete="new-password"
                  />
                  {errores.repetirContrasena && <p className="text-red-500 text-xs mt-1">{errores.repetirContrasena}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
