import { useEffect, useState } from 'react';
import { obtenerUsuario, guardarUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';

// Campos que el paciente NO puede modificar (bloqueados por integridad/seguridad).
const CAMPOS_BLOQUEADOS = ['ci', 'rol', 'nombre', 'apellido'];

function formatearValor(v) {
  if (v === '' || v == null) return '—';
  return v;
}

export default function MiPerfil() {
  const usuario = obtenerUsuario();
  const [idPaciente, setIdPaciente] = useState(null);
  const [form, setForm] = useState({
    correo: '',
    telefono: '',
    id_tipo_seguro: '',
    numero_seguro: '',
    contrasenaActual: '',
    contrasenaNueva: '',
    repetirContrasena: '',
  });
  const [tiposSeguro, setTiposSeguro] = useState([]);
  const [bloqueados, setBloqueados] = useState({ ci: '', rol: '', nombre: '', apellido: '' });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  // Modal de recuperacion de contrasena
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
        const resCat = await fetch('/api/catalogo?entidad=tipo_seguro');
        const jsonCat = await resCat.json();
        setTiposSeguro(jsonCat.tipos_seguro || []);

        const resId = await fetch('/api/pacientes/mi-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario }),
        });
        const jsonId = await resId.json();
        if (!jsonId.ok) throw new Error(jsonId.mensaje || 'No se encontro tu perfil.');
        setIdPaciente(jsonId.id_paciente);

        const res = await fetch(`/api/paciente/perfil?id_paciente=${jsonId.id_paciente}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.mensaje || 'No se pudo cargar el perfil.');

        const p = json.perfil;
        setBloqueados({
          ci: p.ci,
          rol: p.rol,
          nombre: p.nombre,
          apellido: p.apellido,
        });
        setForm((prev) => ({
          ...prev,
          correo: p.correo || '',
          telefono: p.telefono || '',
          id_tipo_seguro: p.id_tipo_seguro || '',
          numero_seguro: p.numero_seguro || '',
        }));
      } catch (e) {
        setErrorGeneral(e.message || 'No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Validacion de contrasena (frontend)
    const errs = {};
    if (form.contrasenaNueva) {
      if (form.contrasenaNueva.length < 6) errs.contrasenaNueva = 'La nueva contrasena debe tener al menos 6 caracteres.';
      if (form.contrasenaNueva !== form.repetirContrasena) errs.repetirContrasena = 'Las contrasenas no coinciden.';
      if (!form.contrasenaActual) errs.contrasenaActual = 'Ingresa tu contrasena actual para confirmar el cambio.';
    }

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      setEnviando(false);
      return;
    }

    try {
      const res = await fetch('/api/paciente/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paciente: idPaciente,
          correo: form.correo,
          telefono: form.telefono,
          id_tipo_seguro: form.id_tipo_seguro || null,
          numero_seguro: form.numero_seguro,
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

      // Refrescar la sesion local con el correo actualizado
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
    if (recuperarForm.nuevaContrasena.length < 6) errs.nuevaContrasena = 'La contrasena debe tener al menos 6 caracteres.';
    if (recuperarForm.nuevaContrasena !== recuperarForm.repetir) errs.repetir = 'Las contrasenas no coinciden.';

    if (Object.keys(errs).length > 0) {
      setRecuperarErrores(errs);
      setRecuperarEnviando(false);
      return;
    }

    try {
      const res = await fetch('/api/paciente/recuperar-contrasena', {
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
        setRecuperarError(json.mensaje || json.errores?.general || 'No se pudo recuperar la contrasena.');
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
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-blue-100 mt-1 text-sm">Actualiza tus datos de contacto, correo y contrasena.</p>
        </div>

        <div className="p-8">
          {mensaje && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
          )}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos bloqueados (solo lectura) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos de identidad (no editables)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
                  <input
                    value={`${formatearValor(bloqueados.nombre)} ${formatearValor(bloqueados.apellido)}`.trim()}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">🔒 No modificable</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Carnet de Identidad (CI)</label>
                  <input
                    value={formatearValor(bloqueados.ci)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">🔒 Dato de identidad unico</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                  <input
                    value={formatearValor(bloqueados.rol)}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
                  />
                  <p className="text-xs text-slate-400 mt-1">🔒 Asignado por el hospital</p>
                </div>
              </div>
            </div>

            {/* Datos editables: contacto */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Datos de contacto</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electronico *</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className={`${inputBase} border-slate-300`}
                />
              </div>
            </div>

            {/* Datos editables: seguro */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Informacion de seguro</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de seguro</label>
                  <select
                    name="id_tipo_seguro"
                    value={form.id_tipo_seguro}
                    onChange={handleChange}
                    className={`${inputBase} border-slate-300`}
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
                    className={`${inputBase} border-slate-300`}
                  />
                </div>
              </div>
            </div>

            {/* Cambio de contrasena */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Cambiar contrasena</h2>
              <p className="text-xs text-slate-500 -mt-2">Deja estos campos en blanco si no deseas cambiar tu contrasena.</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contrasena actual</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva contrasena</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Repetir nueva contrasena</label>
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => setModalRecuperar(true)}
                className="text-sm text-primary hover:text-primary-dark font-medium underline"
              >
                ¿Olvidaste tu contrasena? Recuperala aqui
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal abierto={modalRecuperar} alCerrar={() => setModalRecuperar(false)} titulo="Recuperar contrasena" ancho="max-w-lg">
        {recuperarMensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{recuperarMensaje}</div>
        )}
        {recuperarError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{recuperarError}</div>
        )}
        <p className="text-sm text-slate-500 mb-4">
          Verifica tu identidad ingresando tu CI y correo registrados, luego define una nueva contrasena.
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva contrasena</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Repetir contrasena</label>
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
          <button
            type="submit"
            disabled={recuperarEnviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recuperarEnviando ? 'Procesando...' : 'Restablecer contrasena'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
