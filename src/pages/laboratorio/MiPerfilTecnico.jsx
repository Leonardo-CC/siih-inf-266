import { useEffect, useState } from 'react';
import { obtenerUsuario, guardarUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import {
  IconoUser,
  IconoMail,
  IconoPhone,
  IconoLock,
  IconoKey,
  IconoShield,
  IconoCheck,
  IconoExclamation,
  IconoX,
  IconoCog,
} from '../../components/Iconos.jsx';

// Campos que el técnico NO puede modificar (bloqueados por integridad/seguridad).
const CAMPOS_BLOQUEADOS = ['ci', 'rol', 'nombre', 'apellido', 'numero_licencia', 'especialidad_laboratorio'];

function formatearValor(v) {
  if (v === '' || v == null) return '—';
  return v;
}

export default function MiPerfilTecnico() {
  const usuario = obtenerUsuario();
  const [idTecnico, setIdTecnico] = useState(null);
  const [form, setForm] = useState({
    correo: '',
    telefono: '',
    contrasenaActual: '',
    contrasenaNueva: '',
    repetirContrasena: '',
  });
  const [bloqueados, setBloqueados] = useState({ ci: '', rol: '', nombre: '', apellido: '', numero_licencia: '', especialidad_laboratorio: '' });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [recuperarForm, setRecuperarForm] = useState({ ci: '', correo: '', nuevaContrasena: '', repetir: '' });
  const [recuperarErrores, setRecuperarErrores] = useState({});
  const [recuperarEnviando, setRecuperarEnviando] = useState(false);
  const [recuperarMensaje, setRecuperarMensaje] = useState(null);
  const [recuperarError, setRecuperarError] = useState(null);

  useEffect(() => {
    async function cargarPerfil() {
      setCargando(true);
      setErrorGeneral(null);
      try {
        let idTec = usuario.id_tecnico_laboratorio;
        if (!idTec) {
          // Sesion antigua sin el id: lo resolvemos a partir del persona_id.
          const resId = await fetch('/api/tecnico-laboratorio/mi-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario }),
          });
          const jsonId = await resId.json();
          if (!jsonId.ok) throw new Error(jsonId.mensaje || 'No se encontro tu perfil.');
          idTec = jsonId.id_tecnico_laboratorio;
          setIdTecnico(idTec);
        }

        const resPerfil = await fetch(`/api/tecnico-laboratorio/perfil?id_tecnico_laboratorio=${idTec}`);
        const jsonPerfil = await resPerfil.json();
        if (!jsonPerfil.ok) throw new Error(jsonPerfil.mensaje || 'No se pudo cargar el perfil.');

        const p = jsonPerfil.perfil;
        setBloqueados({
          ci: p.ci || '',
          rol: p.rol || '',
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          numero_licencia: p.numero_licencia || '',
          especialidad_laboratorio: p.especialidad_laboratorio || '',
        });
        setIdTecnico(p.id_tecnico_laboratorio);
        setForm((prev) => ({
          ...prev,
          correo: p.correo || '',
          telefono: p.telefono || '',
        }));
      } catch (e) {
        setErrorGeneral(e.message || 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, [usuario.id_tecnico_laboratorio]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
    setMensaje(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    const errs = {};
    if (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) errs.correo = 'El formato del correo no es válido.';
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
      const res = await fetch('/api/tecnico-laboratorio/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tecnico_laboratorio: idTecnico,
          correo: form.correo,
          telefono: form.telefono,
          contrasenaActual: form.contrasenaActual,
          contrasenaNueva: form.contrasenaNueva,
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
        guardarUsuario({ ...sesion, correo: form.correo });
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  function handleRecuperarChange(e) {
    const { name, value } = e.target;
    setRecuperarForm((prev) => ({ ...prev, [name]: value }));
    setRecuperarErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleRecuperar(e) {
    e.preventDefault();
    setRecuperarEnviando(true);
    setRecuperarErrores({});
    setRecuperarError(null);
    setRecuperarMensaje(null);

    const errs = {};
    if (!recuperarForm.ci) errs.ci = 'Ingresa tu CI.';
    if (!recuperarForm.correo) errs.correo = 'Ingresa tu correo registrado.';
    if (recuperarForm.nuevaContrasena.length < 6) errs.nuevaContrasena = 'La contraseña debe tener al menos 6 caracteres.';
    if (recuperarForm.nuevaContrasena !== recuperarForm.repetir) errs.repetir = 'Las contraseñas no coinciden.';

    if (Object.keys(errs).length > 0) {
      setRecuperarErrores(errs);
      setRecuperarEnviando(false);
      return;
    }

    try {
      const res = await fetch('/api/tecnico-laboratorio/recuperar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ci: recuperarForm.ci,
          correo: recuperarForm.correo,
          nuevaContrasena: recuperarForm.nuevaContrasena,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setRecuperarError(json.mensaje || json.errores?.general || 'No se pudo recuperar la contraseña.');
        if (json.errores) setRecuperarErrores(json.errores);
        return;
      }
      setRecuperarMensaje(json.mensaje);
      setTimeout(() => {
        setModalRecuperar(false);
        setRecuperarForm({ ci: '', correo: '', nuevaContrasena: '', repetir: '' });
        setRecuperarMensaje(null);
      }, 1500);
    } catch {
      setRecuperarError('No se pudo conectar con el servidor.');
    } finally {
      setRecuperarEnviando(false);
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
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
            <p className="text-blue-100 mt-1 text-sm">Actualiza tus datos de contacto, correo y contraseña.</p>
          </div>
          <div className="hidden sm:block text-white"><IconoCog className="w-10 h-10" /></div>
        </div>

        <div className="p-8">
          {mensaje && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">{mensaje}</div>
          )}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">{errorGeneral}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos bloqueados (solo lectura) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <IconoLock className="w-4 h-4" /> Datos de identidad (no editables)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
                  <input
                    value={`${formatearValor(bloqueados.nombre)} ${formatearValor(bloqueados.apellido)}`.trim()}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> No modificable</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Carnet de Identidad (CI)</label>
                  <input
                    value={formatearValor(bloqueados.ci)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> Dato de identidad único</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                  <input
                    value={formatearValor(bloqueados.rol)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> Asignado por el hospital</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Licencia / Especialidad</label>
                  <input
                     value={`${formatearValor(bloqueados.numero_licencia)} · ${formatearValor(bloqueados.especialidad_laboratorio)}`.trim()}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1"><IconoLock className="w-3 h-3 inline mr-1" /> Asignado por el hospital</p>
                </div>
              </div>
            </div>

            {/* Datos editables: contacto */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <IconoMail className="w-4 h-4" /> Datos de contacto
              </h2>
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconoPhone className="w-5 h-5" /></span>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 77712345"
                    className={`${inputBase} pl-10 border-slate-300`}
                  />
                </div>
              </div>
            </div>

            {/* Cambio de contraseña */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
                <IconoKey className="w-4 h-4" /> Cambiar contraseña
              </h2>
              <p className="text-xs text-slate-500 -mt-2">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña actual</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconoLock className="w-5 h-5" /></span>
                  <input
                    type="password"
                    name="contrasenaActual"
                    value={form.contrasenaActual}
                    onChange={handleChange}
                    autoComplete="current-password"
                    className={`${inputBase} pl-10 border-slate-300`}
                  />
                </div>
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
                    autoComplete="new-password"
                    className={`${inputBase} ${errores.contrasenaNueva ? 'border-red-400' : 'border-slate-300'}`}
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
                    autoComplete="new-password"
                    className={`${inputBase} ${errores.repetirContrasena ? 'border-red-400' : 'border-slate-300'}`}
                  />
                  {errores.repetirContrasena && <p className="text-red-500 text-xs mt-1">{errores.repetirContrasena}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {enviando ? <IconoExclamation className="w-5 h-5 animate-spin" /> : <IconoCheck className="w-5 h-5" />}
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setModalRecuperar(true)}
                className="text-sm text-primary hover:text-primary-dark font-medium underline flex items-center justify-center gap-1"
              >
                <IconoShield className="w-4 h-4" /> ¿Olvidaste tu contraseña? Recupérala aquí
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal abierto={modalRecuperar} alCerrar={() => setModalRecuperar(false)} titulo="Recuperar contraseña" ancho="max-w-lg">
        {recuperarMensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">{recuperarMensaje}</div>
        )}
        {recuperarError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">{recuperarError}</div>
        )}
        <p className="text-sm text-slate-500 mb-4">
          Verifica tu identidad ingresando tu CI y correo registrados, luego define una nueva contraseña.
        </p>
        <form onSubmit={handleRecuperar} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Carnet de Identidad (CI)</label>
            <input
              name="ci"
              value={recuperarForm.ci}
              onChange={handleRecuperarChange}
              className={`${inputBase} ${recuperarErrores.ci ? 'border-red-400' : 'border-slate-300'}`}
            />
            {recuperarErrores.ci && <p className="text-red-500 text-xs mt-1">{recuperarErrores.ci}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Correo registrado</label>
            <input
              type="email"
              name="correo"
              value={recuperarForm.correo}
              onChange={handleRecuperarChange}
              className={`${inputBase} ${recuperarErrores.correo ? 'border-red-400' : 'border-slate-300'}`}
            />
            {recuperarErrores.correo && <p className="text-red-500 text-xs mt-1">{recuperarErrores.correo}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                name="nuevaContrasena"
                value={recuperarForm.nuevaContrasena}
                onChange={handleRecuperarChange}
                className={`${inputBase} ${recuperarErrores.nuevaContrasena ? 'border-red-400' : 'border-slate-300'}`}
              />
              {recuperarErrores.nuevaContrasena && <p className="text-red-500 text-xs mt-1">{recuperarErrores.nuevaContrasena}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Repetir contraseña</label>
              <input
                type="password"
                name="repetir"
                value={recuperarForm.repetir}
                onChange={handleRecuperarChange}
                className={`${inputBase} ${recuperarErrores.repetir ? 'border-red-400' : 'border-slate-300'}`}
              />
              {recuperarErrores.repetir && <p className="text-red-500 text-xs mt-1">{recuperarErrores.repetir}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalRecuperar(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition flex items-center gap-2"
            >
              <IconoX className="w-4 h-4" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={recuperarEnviando}
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {recuperarEnviando ? <IconoExclamation className="w-4 h-4 animate-spin" /> : <IconoCheck className="w-4 h-4" />}
              {recuperarEnviando ? 'Procesando...' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
