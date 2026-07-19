import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-10 py-12 text-white">
          <h1 className="text-3xl font-bold">SIIH</h1>
          <p className="text-blue-100 mt-2 text-lg">Sistema Integrado de Informacion Hospitalaria</p>
          <p className="text-blue-200 mt-1 text-sm">UMSA - Facultad de Ciencias Puras y Naturales</p>
        </div>
        <div className="p-10">
          <p className="text-slate-600 mb-8">
            Sprint 1 - HU-01: Registro de paciente/estudiante - HU-03: Solicitud de cita medica -
            HU-11: Gestion de admision - HU-10: Registro de signos vitales.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/paciente/registro" className="block">
              <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition">
                Ir al registro de paciente
              </button>
            </Link>
            <Link to="/paciente/cita" className="block">
              <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition">
                Solicitar cita medica
              </button>
            </Link>
            <Link to="/enfermeria/admisiones" className="block">
              <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition">
                Gestionar admisiones
              </button>
            </Link>
            <Link to="/enfermeria/signos-vitales" className="block">
              <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition">
                Registrar signos vitales
              </button>
            </Link>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <Link to="/medico/agenda">
            <button className="siih-button" style={{ backgroundColor: '#3b82f6' }}>Ver agenda del médico</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
