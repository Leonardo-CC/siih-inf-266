// src/pages/Home.jsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="siih-container">
      <div className="siih-header">
        <h1>SIIH — Sistema Integrado de Información Hospitalaria</h1>
        <p>UMSA · Facultad de Ciencias Puras y Naturales</p>
      </div>
      <div className="siih-body">
        <p>Sprint 1 · HU-01: Registro de paciente/estudiante · HU-03: Solicitud de cita médica · HU-04: Agenda del médico.</p>
        <Link to="/paciente/registro">
          <button className="siih-button">Ir al registro de paciente</button>
        </Link>
        <div style={{ marginTop: '12px' }}>
          <Link to="/paciente/cita">
            <button className="siih-button">Solicitar cita médica</button>
          </Link>
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
