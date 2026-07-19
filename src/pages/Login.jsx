import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { guardarUsuario } from '../lib/authSession.js';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.errores?.general || 'No se pudo iniciar sesion.');
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

            <Link to="/paciente/registro" className="block text-center text-primary hover:text-primary-dark font-medium text-sm">
              Registrar nuevo paciente
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
