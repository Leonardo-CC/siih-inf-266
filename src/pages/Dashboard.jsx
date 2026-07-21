import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerUsuario } from '../lib/authSession.js';
import StatCard from '../components/StatCard.jsx';
import Modal from '../components/Modal.jsx';
import { GraficaDona, GraficaBarras } from '../components/Graficas.jsx';
import TablaCRUD from '../components/TablaCRUD.jsx';
import {
  IconoCalendar,
  IconoUser,
  IconoClipboardDocument,
  IconoHeart,
  IconoUsers,
  IconoBeaker,
  IconoCog,
  IconoChart,
  IconoDocumentText,
  IconoStethoscope,
  IconoArchiveBox,
  IconoUserGroup,
  IconoClock,
  IconoPill,
  IconoBanknotes,
} from '../components/Iconos.jsx';
import EnfermeroDashboard from './enfermeria/EnfermeroDashboard.jsx';
import MedicoDashboard from './medico/MedicoDashboard.jsx';
import PacienteDashboard from './paciente/PacienteDashboard.jsx';
import TecnicoLaboratorioDashboard from './laboratorio/TecnicoLaboratorioDashboard.jsx';
import FarmaciaDashboard from './farmacia/FarmaciaDashboard.jsx';

const accionesPorRol = {
  paciente: [
    { to: '/paciente/cita', titulo: 'Solicitar cita medica', texto: 'Elige especialidad, medico y horario disponible.', icono: <IconoCalendar className="w-6 h-6" />, color: 'from-sky-500 to-sky-600' },
    { to: '/paciente/perfil', titulo: 'Mi perfil', texto: 'Revisa y actualiza tus datos personales.', icono: <IconoUser className="w-6 h-6" />, color: 'from-violet-500 to-violet-600' },
  ],
  enfermero: [
    { to: '/enfermeria/admisiones', titulo: 'Gestion de admision', texto: 'Verifica datos, motivo de consulta y asignacion.', icono: <IconoClipboardDocument className="w-6 h-6" />, color: 'from-rose-500 to-rose-600' },
    { to: '/enfermeria/signos-vitales', titulo: 'Signos vitales', texto: 'Registra presion, temperatura y frecuencia cardiaca.', icono: <IconoHeart className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-600' },
    { to: '/enfermeria/pacientes', titulo: 'Pacientes', texto: 'Busca y consulta la informacion de pacientes.', icono: <IconoUsers className="w-6 h-6" />, color: 'from-amber-500 to-amber-600' },
  ],
  tecnico_laboratorio: [
    { to: '/laboratorio/analisis', titulo: 'Analisis de laboratorio', texto: 'Registra y gestiona analisis clinicos.', icono: <IconoBeaker className="w-6 h-6" />, color: 'from-blue-500 to-blue-600' },
    { to: '/laboratorio/pacientes', titulo: 'Pacientes', texto: 'Consulta informacion de pacientes.', icono: <IconoUsers className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-600' },
    { to: '/laboratorio/perfil', titulo: 'Mi perfil', texto: 'Actualiza tu correo y contrasena.', icono: <IconoCog className="w-6 h-6" />, color: 'from-violet-500 to-violet-600' },
  ],
  medico: [
    { to: '/medico/consultas', titulo: 'Mis consultas', texto: 'Registrar diagnostico, tratamiento y estado de atencion.', icono: <IconoStethoscope className="w-6 h-6" />, color: 'from-blue-500 to-blue-600' },
    { to: '/medico/signos', titulo: 'Signos vitales', texto: 'Consultar los signos vitales de mis pacientes.', icono: <IconoHeart className="w-6 h-6" />, color: 'from-rose-500 to-rose-600' },
    { to: '/medico/perfil', titulo: 'Mi perfil', texto: 'Actualiza tu correo y contrasena.', icono: <IconoCog className="w-6 h-6" />, color: 'from-violet-500 to-violet-600' },
  ],
  administrativo: [
    { to: '/paciente/registro', titulo: 'Registrar paciente', texto: 'Crea persona, usuario y perfil de paciente.', icono: <IconoUser className="w-6 h-6" />, color: 'from-sky-500 to-sky-600' },
    { to: '/admin/usuarios', titulo: 'Gestionar usuarios', texto: 'Crea y administra las cuentas del sistema.', icono: <IconoUsers className="w-6 h-6" />, color: 'from-violet-500 to-violet-600' },
    { to: '/admin/admisiones', titulo: 'Admisiones', texto: 'Consulta ingresos recientes y asignaciones.', icono: <IconoClipboardDocument className="w-6 h-6" />, color: 'from-rose-500 to-rose-600' },
    { to: '/admin/citas', titulo: 'Citas', texto: 'Administra las citas medicas del hospital.', icono: <IconoCalendar className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-600' },
    { to: '/admin/inscripciones', titulo: 'Inscripciones', texto: 'Inscribe pacientes/estudiantes en una facultad/area y emite el comprobante.', icono: <IconoDocumentText className="w-6 h-6" />, color: 'from-indigo-500 to-indigo-600' },
    { to: '/admin/finanzas', titulo: 'Finanzas', texto: 'Controla ingresos, egresos, facturas e IVA.', icono: <IconoBanknotes className="w-6 h-6" />, color: 'from-slate-600 to-slate-800' },
    { to: '/admin/facultades', titulo: 'Facultades / Areas', texto: 'Administra el catalogo de facultades y areas institucionales.', icono: <IconoArchiveBox className="w-6 h-6" />, color: 'from-amber-500 to-amber-600' },
  ],
  farmaceutico: [
    { to: '/farmacia/despachos', titulo: 'Despachar recetas', texto: 'Atender fila virtual de recetas medicas.', icono: <IconoDocumentText className="w-6 h-6" />, color: 'from-teal-500 to-teal-600' },
    { to: '/farmacia/inventario', titulo: 'Inventario', texto: 'Controlar stock, lotes y alertas de medicamentos.', icono: <IconoArchiveBox className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-600' },
    { to: '/farmacia/perfil', titulo: 'Mi perfil', texto: 'Actualiza tu correo y contrasena.', icono: <IconoCog className="w-6 h-6" />, color: 'from-violet-500 to-violet-600' },
  ],
};

const ROL_ETIQUETA = {
  paciente: 'Paciente',
  enfermero: 'Enfermeria',
  medico: 'Medico',
  administrativo: 'Administracion',
  farmaceutico: 'Farmacia',
  tecnico_laboratorio: 'Laboratorio',
};

const iconMap = {
  calendar: IconoCalendar,
  clipboard: IconoClipboardDocument,
  chart: IconoChart,
  heart: IconoHeart,
  stethoscope: IconoStethoscope,
  users: IconoUsers,
  userGroup: IconoUserGroup,
  clock: IconoClock,
  pill: IconoPill,
  documentText: IconoDocumentText,
  archiveBox: IconoArchiveBox,
};

const ESTADO_COLOR = {
  pendiente: 'bg-amber-100 text-amber-700',
  confirmada: 'bg-sky-100 text-sky-700',
  atendida: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-rose-100 text-rose-700',
};

function formatearHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const usuario = obtenerUsuario();
  const [stats, setStats] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [distribucionCitas, setDistribucionCitas] = useState([]);
  const [usuariosPorRol, setUsuariosPorRol] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showPacientesModal, setShowPacientesModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);

  const esEnfermero = usuario?.rol === 'enfermero';
  const esMedico = usuario?.rol === 'medico';
  const esPaciente = usuario?.rol === 'paciente';
  const esTecnicoLaboratorio = usuario?.rol === 'tecnico_laboratorio';
  const esFarmaceutico = usuario?.rol === 'farmaceutico';
  const rol = usuario?.rol;
  const nombre = usuario?.nombre || usuario?.correo || '';
  const horaAct = new Date().getHours();
  const saludo = horaAct < 12 ? 'Buenos dias' : horaAct < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    if (esEnfermero || esMedico || esFarmaceutico || esTecnicoLaboratorio) {
      setCargando(false);
      return;
    }
    async function cargarStats() {
      try {
        const res = await fetch('/api/dashboard/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario }),
        });
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats?.tarjetas || []);
          setActividad(data.stats?.actividadReciente || []);
          setDistribucionCitas(data.stats?.distribucionCitas || []);
          setUsuariosPorRol(data.stats?.usuariosPorRol || []);
        }
      } catch {
        setStats([]);
      } finally {
        setCargando(false);
      }
    }
    cargarStats();
  }, [usuario, esEnfermero, esMedico, esTecnicoLaboratorio, esFarmaceutico]);

  async function abrirCRUD() {
    setShowPacientesModal(true);
    setCargandoPacientes(true);
    try {
      const res = await fetch('/api/pacientes/listar');
      const data = await res.json();
      if (data.ok) setPacientes(data.pacientes || []);
    } catch {
      setPacientes([]);
    } finally {
      setCargandoPacientes(false);
    }
  }

  const acciones = accionesPorRol[rol] || [];

  if (esEnfermero) return <EnfermeroDashboard usuario={usuario} />;
  if (esMedico) return <MedicoDashboard usuario={usuario} />;
  if (esPaciente) return <PacienteDashboard usuario={usuario} />;
  if (esTecnicoLaboratorio) return <TecnicoLaboratorioDashboard usuario={usuario} />;
  if (esFarmaceutico) { return <FarmaciaDashboard usuario={usuario} />; }

  return (
    <div className="space-y-6 fade-in">
      {/* Header de bienvenida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-primary-light p-7 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 bottom-0 w-28 h-28 rounded-full bg-white/5 blur-xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-100 bg-white/10 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            {ROL_ETIQUETA[rol] || rol}
          </span>
          <h1 className="text-3xl font-bold mt-3">
            {saludo}, {nombre}
          </h1>
          <p className="text-blue-100 mt-1 max-w-xl">
            Este es el resumen de actividad del hospital. Desde aqui puedes acceder a todas las funciones de tu rol.
          </p>
        </div>
      </div>

      {/* Tarjetas de estadisticas */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Indicadores generales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cargando ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="h-9 bg-slate-200 rounded w-1/3" />
              </div>
            ))
          ) : stats.length === 0 ? (
            <p className="text-slate-500 col-span-full">No hay indicadores disponibles.</p>
          ) : (
            stats.map((stat, idx) => (
              <StatCard
                key={idx}
                titulo={stat.titulo}
                valor={stat.valor}
                icono={React.createElement(iconMap[stat.icono] || IconoChart, { className: 'w-6 h-6' })}
                color={stat.color || 'bg-primary'}
                link={stat.link}
                retraso={idx * 80}
              />
            ))
          )}
        </div>
      </section>

      {/* Graficas */}
      {rol === 'administrativo' && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Visualizacion de datos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GraficaDona
              datos={cargando ? [] : distribucionCitas}
              titulo="Estado de las citas"
              centro="Citas"
            />
            <GraficaBarras
              datos={cargando ? [] : usuariosPorRol}
              titulo="Usuarios por rol"
              color="#7c3aed"
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones rapidas */}
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Acciones rapidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {acciones.map((accion) => (
              <Link
                key={accion.titulo}
                to={accion.to}
                className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accion.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative flex items-start gap-4">
                  <div className={`shrink-0 text-2xl bg-gradient-to-br ${accion.color} text-white rounded-xl p-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {accion.icono}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{accion.titulo}</h3>
                    <p className="text-sm text-slate-500 mt-1">{accion.texto}</p>
                  </div>
                </div>
              </Link>
            ))}
            {rol === 'administrativo' && (
              <button
                onClick={abrirCRUD}
                className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative flex items-start gap-4">
                  <div className="shrink-0 bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-xl p-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconoUsers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-primary transition-colors">Gestionar pacientes</h3>
                    <p className="text-sm text-slate-500 mt-1">Ver, editar y eliminar pacientes registrados.</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </section>

        {/* Actividad reciente */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Actividad reciente</h2>
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
            {cargando ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : actividad.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin actividad reciente.</p>
            ) : (
              <ul className="space-y-1">
                {actividad.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.titulo}</p>
                      <p className="text-xs text-slate-500 truncate">{item.subtitulo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${ESTADO_COLOR[item.estado] || 'bg-slate-100 text-slate-600'}`}>
                        {item.estado}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatearHora(item.fecha)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {rol === 'administrativo' && (
        <Modal abierto={showPacientesModal} alCerrar={() => setShowPacientesModal(false)} titulo="Gestion de Pacientes" ancho="max-w-4xl">
          <TablaCRUD
            columnas={[
              { clave: 'nombre_completo', titulo: 'Nombre' },
              { clave: 'correo', titulo: 'Correo' },
              { clave: 'ci', titulo: 'CI' },
              { clave: 'telefono', titulo: 'Telefono' },
              { clave: 'tipo_seguro', titulo: 'Seguro' },
            ]}
            datos={pacientes}
            cargando={cargandoPacientes}
            emptyMessage="No hay pacientes registrados"
          />
        </Modal>
      )}
    </div>
  );
}
