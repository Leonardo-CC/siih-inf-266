import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerUsuario } from '../lib/authSession.js';
import StatCard from '../components/StatCard.jsx';
import Modal from '../components/Modal.jsx';
import TablaCRUD from '../components/TablaCRUD.jsx';
import EnfermeroDashboard from './enfermeria/EnfermeroDashboard.jsx';
import MedicoDashboard from './medico/MedicoDashboard.jsx';
import PacienteDashboard from './paciente/PacienteDashboard.jsx';

const accionesPorRol = {
  paciente: [
    { to: '/paciente/cita', titulo: 'Solicitar cita medica', texto: 'Elige especialidad, medico y horario disponible.', icono: '📅' },
  ],
  enfermero: [
    { to: '/enfermeria/admisiones', titulo: 'Gestion de admision', texto: 'Verifica datos, motivo de consulta y asignacion.', icono: '📋' },
    { to: '/enfermeria/signos-vitales', titulo: 'Signos vitales', texto: 'Registra presion, temperatura y frecuencia cardiaca.', icono: '❤️' },
  ],
  medico: [],
  administrativo: [
    { to: '/paciente/registro', titulo: 'Registrar paciente', texto: 'Crea persona, usuario y perfil de paciente.', icono: '👤' },
    { to: '/enfermeria/admisiones', titulo: 'Admisiones', texto: 'Consulta ingresos recientes y asignaciones.', icono: '📋' },
  ],
  farmaceutico: [
    { to: '/dashboard', titulo: 'Farmacia', texto: 'Modulo listo para conectar inventario y recetas.', icono: '💊' },
  ],
  direccion: [
    { to: '/dashboard', titulo: 'Indicadores', texto: 'Vista preparada para reportes institucionales.', icono: '📈' },
  ],
};

export default function Dashboard() {
  const usuario = obtenerUsuario();
  const [stats, setStats] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showPacientesModal, setShowPacientesModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);

  const esEnfermero = usuario?.rol === 'enfermero';
  const esMedico = usuario?.rol === 'medico';
  const esPaciente = usuario?.rol === 'paciente';

  useEffect(() => {
    if (esEnfermero || esMedico) {
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
        if (data.ok) setStats(data.stats?.tarjetas || []);
      } catch {
        setStats([]);
      } finally {
        setCargando(false);
      }
    }
    cargarStats();
  }, [usuario, esEnfermero, esMedico]);

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

  const acciones = accionesPorRol[usuario?.rol] || [];

  if (esEnfermero) {
    return <EnfermeroDashboard usuario={usuario} />;
  }

  if (esMedico) {
    return <MedicoDashboard usuario={usuario} />;
  }

  if (esPaciente) {
    return <PacienteDashboard usuario={usuario} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white shadow-lg">
        <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Panel {usuario?.rol}</span>
        <h1 className="text-2xl font-bold mt-1">
          Bienvenido(a), {usuario?.nombre || usuario?.correo}
        </h1>
        <p className="text-blue-100 mt-1">Accede a las funciones disponibles para tu rol dentro del SIIH.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargando ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))
        ) : (
          stats.map((stat, idx) => (
            <StatCard key={idx} titulo={stat.titulo} valor={stat.valor} icono={stat.icono} link={stat.link} />
          ))
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Acciones rapidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {acciones.map((accion) => (
            <Link
              key={accion.titulo}
              to={accion.to}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition group"
            >
              <div className="text-3xl mb-3">{accion.icono}</div>
              <h3 className="font-semibold text-slate-800 group-hover:text-primary transition">{accion.titulo}</h3>
              <p className="text-sm text-slate-500 mt-1">{accion.texto}</p>
            </Link>
          ))}
          {usuario?.rol === 'administrativo' && (
            <button
              onClick={abrirCRUD}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary hover:shadow-md transition text-left"
            >
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-slate-800">Gestionar pacientes</h3>
              <p className="text-sm text-slate-500 mt-1">Ver, editar y eliminar pacientes registrados.</p>
            </button>
          )}
        </div>
      </div>

      {usuario?.rol === 'administrativo' && (
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
            onEditar={(paciente) => alert('Editar: ' + paciente.nombre_completo)}
            onEliminar={(paciente) => alert('Eliminar: ' + paciente.nombre_completo)}
          />
        </Modal>
      )}
    </div>
  );
}
