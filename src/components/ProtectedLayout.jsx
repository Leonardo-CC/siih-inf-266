// src/components/ProtectedLayout.jsx
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cerrarSesion, obtenerUsuario } from '../lib/authSession.js';

const navPorRol = {
  paciente: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/paciente/cita', label: 'Solicitar cita', icono: '📅' },
    { to: '/paciente/citas', label: 'Mis citas', icono: '🗂️' },
    { to: '/paciente/perfil', label: 'Mi perfil', icono: '⚙️' },
  ],
  enfermero: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/enfermeria/admisiones', label: 'Admisiones', icono: '📋' },
    { to: '/enfermeria/signos-vitales', label: 'Signos vitales', icono: '❤️' },
    { to: '/enfermeria/pacientes', label: 'Pacientes', icono: '👥' },
  ],
  medico: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/medico/consultas', label: 'Mis consultas', icono: '🩺' },
    { to: '/medico/signos', label: 'Signos vitales', icono: '❤️' },
  ],
  farmaceutico: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/farmacia/despachos', label: 'Despachos', icono: '📋' },
    { to: '/farmacia/inventario', label: 'Inventario', icono: '🗄️' },
  ],
  administrativo: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
    { to: '/paciente/registro', label: 'Registrar paciente', icono: '👤' },
    { to: '/enfermeria/admisiones', label: 'Admisiones', icono: '📋' },
  ],
  direccion: [
    { to: '/dashboard', label: 'Dashboard', icono: '📊' },
  ],
};

export default function ProtectedLayout() {
  const usuario = obtenerUsuario();
  const navigate = useNavigate();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const navItems = navPorRol[usuario.rol] || navPorRol.paciente;

  function salir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-slate-700">
          <strong className="text-xl tracking-tight">SIIH</strong>
          <span className="block text-xs text-slate-400 mt-1 capitalize">{usuario.rol}</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icono}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {usuario.nombre?.[0]?.toUpperCase() || usuario.correo[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {usuario.nombre_completo || usuario.correo}
              </p>
              <p className="text-xs text-slate-400 truncate">{usuario.correo}</p>
            </div>
          </div>
          <button
            onClick={salir}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-700 capitalize">
            {location.pathname === '/dashboard' ? 'Panel de control' : location.pathname.split('/').pop()?.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 capitalize bg-slate-100 px-3 py-1 rounded-full">
              {usuario.rol}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
