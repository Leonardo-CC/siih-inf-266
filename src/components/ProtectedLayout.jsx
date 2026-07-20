// src/components/ProtectedLayout.jsx
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cerrarSesion, obtenerUsuario } from '../lib/authSession.js';
import {
  IconoHome,
  IconoCalendar,
  IconoClipboardDocument,
  IconoHeart,
  IconoUsers,
  IconoCog,
  IconoStethoscope,
  IconoArchiveBox,
  IconoBeaker,
  IconoUser,
  IconoChart,
  IconoPill,
  IconoDocumentText,
  IconoBuildingHospital,
  IconoArrowDown,
  IconoBanknotes,
} from './Iconos.jsx';

const navPorRol = {
  paciente: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/paciente/cita', label: 'Solicitar cita', icono: IconoCalendar },
    { to: '/paciente/citas', label: 'Mis citas', icono: IconoClipboardDocument },
    { to: '/paciente/historial', label: 'Mi Historial', icono: IconoDocumentText },
    { to: '/paciente/perfil', label: 'Mi perfil', icono: IconoUser },
  ],
  enfermero: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/enfermeria/admisiones', label: 'Admisiones', icono: IconoClipboardDocument },
    { to: '/enfermeria/signos-vitales', label: 'Signos vitales', icono: IconoHeart },
    { to: '/enfermeria/pacientes', label: 'Pacientes', icono: IconoUsers },
  ],
  tecnico_laboratorio: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/laboratorio/analisis', label: 'Analisis', icono: IconoBeaker },
    { to: '/laboratorio/pacientes', label: 'Pacientes', icono: IconoUsers },
    { to: '/laboratorio/perfil', label: 'Mi perfil', icono: IconoUser },
  ],
  medico: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/medico/consultas', label: 'Mis consultas', icono: IconoStethoscope },
    { to: '/medico/signos', label: 'Signos vitales', icono: IconoHeart },
    { to: '/medico/perfil', label: 'Mi perfil', icono: IconoUser },
  ],
  farmaceutico: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/farmacia/despachos', label: 'Despachos', icono: IconoDocumentText },
    { to: '/farmacia/inventario', label: 'Inventario', icono: IconoArchiveBox },
    { to: '/farmacia/medicamentos', label: 'Medicamentos', icono: IconoPill },
    { to: '/farmacia/perfil', label: 'Mi perfil', icono: IconoUser },
  ],
  administrativo: [
    { to: '/dashboard', label: 'Dashboard', icono: IconoHome },
    { to: '/admin/usuarios', label: 'Usuarios', icono: IconoUsers },
    { to: '/admin/pacientes', label: 'Pacientes', icono: IconoBuildingHospital },
    { to: '/admin/citas', label: 'Citas', icono: IconoCalendar },
    { to: '/admin/admisiones', label: 'Admisiones', icono: IconoClipboardDocument },
    { to: '/admin/signos-vitales', label: 'Signos vitales', icono: IconoHeart },
    { to: '/admin/catalogo', label: 'Catálogo', icono: IconoCog },
    { to: '/admin/stock', label: 'Stock', icono: IconoArchiveBox },
    { to: '/admin/medicamentos', label: 'Medicamentos', icono: IconoPill },
    { to: '/admin/movimientos', label: 'Movimientos', icono: IconoArrowDown },
    { to: '/admin/finanzas', label: 'Finanzas', icono: IconoBanknotes },
    { to: '/admin/facultades', label: 'Facultades / Áreas', icono: IconoBuildingHospital },
    { to: '/admin/configuracion', label: 'Configuracion', icono: IconoCog },
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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl shrink-0">
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <IconoBuildingHospital className="w-5 h-5 text-white" />
            </div>
            <div>
              <strong className="text-xl tracking-tight block leading-none">SIIH</strong>
              <span className="block text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">Hospital</span>
            </div>
          </div>
          <span className="block text-xs text-slate-400 mt-3 capitalize font-medium">{usuario.rol.replace('_', ' ')}</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icono;
            const activo = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activo
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${activo ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {activo && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
              {usuario.nombre?.[0]?.toUpperCase() || usuario.correo[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {usuario.nombre_completo || usuario.correo}
              </p>
              <p className="text-xs text-slate-400 truncate">{usuario.correo}</p>
            </div>
          </div>
          <button
            onClick={salir}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-red-500/15 text-slate-300 hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-slate-700/60 hover:border-red-500/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-700 capitalize">
              {location.pathname === '/dashboard' ? 'Panel de control' : location.pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-primary bg-primary-light border border-primary/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {usuario.rol.replace('_', ' ')}
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
