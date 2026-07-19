import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerUsuario } from '../../lib/authSession.js';
import {
  IconoUsers,
  IconoBuildingHospital,
  IconoCalendar,
  IconoClipboardDocument,
  IconoHeart,
  IconoCog,
} from '../../components/Iconos.jsx';

export default function AdminDashboard() {
  const usuario = obtenerUsuario();
  const [stats, setStats] = useState({
    usuarios: 0,
    pacientes: 0,
    citas: 0,
    admisiones: 0,
    signos: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarStats() {
      setCargando(true);
      try {
        const [usuariosRes, pacientesRes, citasRes, admisionesRes, signosRes] = await Promise.all([
          fetch('/api/usuarios/listar'),
          fetch('/api/pacientes/listar'),
          fetch('/api/citas/listar'),
          fetch('/api/admisiones/listar'),
          fetch('/api/signos-vitales/listar'),
        ]);

        const [usuariosData, pacientesData, citasData, admisionesData, signosData] = await Promise.all([
          usuariosRes.json(),
          pacientesRes.json(),
          citasRes.json(),
          admisionesRes.json(),
          signosRes.json(),
        ]);

        setStats({
          usuarios: usuariosData.ok ? (usuariosData.usuarios || []).length : 0,
          pacientes: pacientesData.ok ? (pacientesData.pacientes || []).length : 0,
          citas: citasData.ok ? (citasData.citas || []).length : 0,
          admisiones: admisionesData.ok ? (admisionesData.admisiones || []).length : 0,
          signos: signosData.ok ? (signosData.signos || []).length : 0,
        });
      } catch {
        console.error('Error cargando estadísticas');
      } finally {
        setCargando(false);
      }
    }
    cargarStats();
  }, []);

  const tarjetas = [
    { titulo: 'Usuarios', valor: stats.usuarios, icono: 'IconoUsers', to: '/admin/usuarios', color: 'from-blue-500 to-blue-600' },
    { titulo: 'Pacientes', valor: stats.pacientes, icono: 'IconoBuildingHospital', to: '/admin/pacientes', color: 'from-emerald-500 to-emerald-600' },
    { titulo: 'Citas', valor: stats.citas, icono: 'IconoCalendar', to: '/admin/citas', color: 'from-amber-500 to-amber-600' },
    { titulo: 'Admisiones', valor: stats.admisiones, icono: 'IconoClipboardDocument', to: '/admin/admisiones', color: 'from-purple-500 to-purple-600' },
    { titulo: 'Signos vitales', valor: stats.signos, icono: 'IconoHeart', to: '/admin/signos-vitales', color: 'from-rose-500 to-rose-600' },
  ];

  const iconMap = {
    IconoUsers,
    IconoBuildingHospital,
    IconoCalendar,
    IconoClipboardDocument,
    IconoHeart,
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg">
        <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel de administración</span>
        <h1 className="text-2xl font-bold mt-1">
          Bienvenido(a), {usuario?.nombre || usuario?.correo}
        </h1>
        <p className="text-blue-100 mt-1">Gestiona todos los módulos del sistema desde un solo lugar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {cargando ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))
        ) : (
          tarjetas.map((stat, idx) => (
            <Link
              key={idx}
              to={stat.to}
              className={`bg-gradient-to-br ${stat.color} rounded-xl p-5 text-white shadow-md hover:shadow-lg transition group`}
            >
              <div className="mb-2">{React.createElement(iconMap[stat.icono], { className: 'w-8 h-8' })}</div>
              <p className="text-sm font-medium text-white/80">{stat.titulo}</p>
              <p className="text-2xl font-bold">{stat.valor}</p>
            </Link>
          ))
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/usuarios" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Gestionar usuarios</h3>
            <p className="text-sm text-slate-500 mt-1">Crear, editar y eliminar usuarios del sistema.</p>
          </Link>
          <Link to="/admin/pacientes" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">🏥</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Gestionar pacientes</h3>
            <p className="text-sm text-slate-500 mt-1">Administra los pacientes registrados.</p>
          </Link>
          <Link to="/admin/citas" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Gestionar citas</h3>
            <p className="text-sm text-slate-500 mt-1">Ver, editar y eliminar citas médicas.</p>
          </Link>
          <Link to="/admin/admisiones" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Gestionar admisiones</h3>
            <p className="text-sm text-slate-500 mt-1">Administra las admisiones y consultas.</p>
          </Link>
          <Link to="/admin/signos-vitales" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">❤️</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Signos vitales</h3>
            <p className="text-sm text-slate-500 mt-1">Registra y administra signos vitales.</p>
          </Link>
          <Link to="/admin/configuracion" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">Mi configuración</h3>
            <p className="text-sm text-slate-500 mt-1">Cambia tu correo y contraseña.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
