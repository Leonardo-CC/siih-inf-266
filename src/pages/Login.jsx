import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { guardarUsuario } from '../lib/authSession.js';
import { IconoEdit, IconoRefresh } from '../components/Iconos.jsx';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaRespuesta, setCaptchaRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function cargarCaptcha() {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      if (data.ok) {
        setCaptcha(data.captcha);
        setCaptchaRespuesta('');
      }
    } catch {
      setCaptcha(null);
    }
  }

  useEffect(() => {
    cargarCaptcha();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena, captchaToken: captcha?.token, captchaRespuesta }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.errores?.general || 'No se pudo iniciar sesion.');
        await cargarCaptcha();
        return;
      }

      guardarUsuario(data.usuario);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-primary-dark p-10 text-white flex flex-col justify-center">
          <span className="text-4xl font-bold tracking-tight mb-4">SIIH</span>
          <h1 className="text-3xl font-bold mb-4 leading-tight">Sistema Integrado de Informacion Hospitalaria</h1>
          <p className="text-blue-100 leading-relaxed">
            Acceso por roles para paciente, enfermeria, medico, farmacia, administracion y laboratorio.
          </p>
        </div>

        <div className="p-10 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Iniciar sesion</h2>
              <p className="text-slate-500 mt-1">Ingresa con tu correo registrado y contraseña.</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Correo</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@correo.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contrasena</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Tu contrasena"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-stretch overflow-hidden rounded-md border border-slate-300 bg-white">
                  <div className="h-11 w-36 bg-slate-100">
                    {captcha?.imagen ? (
                      <img src={captcha.imagen} alt="Codigo de seguridad" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-slate-200" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={cargarCaptcha}
                    title="Actualizar codigo"
                    className="grid h-11 w-12 place-items-center border-l border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <IconoRefresh className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <input
                  type="text"
                  value={captchaRespuesta}
                  onChange={(e) => setCaptchaRespuesta(e.target.value.toUpperCase())}
                  placeholder="Ingresa el Codigo de Seguridad"
                  className="min-w-0 flex-1 px-4 py-2.5 outline-none"
                  autoComplete="off"
                  required
                />
                <div className="grid w-12 place-items-center border-l border-slate-300 text-slate-700">
                  <IconoEdit className="w-5 h-5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
