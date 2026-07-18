// src/pages/Home.jsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="siih-container">
      <div className="siih-header">
        <h1>SIIH - Sistema Integrado de Informacion Hospitalaria</h1>
        <p>UMSA - Facultad de Ciencias Puras y Naturales</p>
      </div>
      <div className="siih-body">
        <p>
          Sprint 1 - HU-01: Registro de paciente/estudiante - HU-03: Solicitud de cita medica -
          HU-11: Gestion de admision - HU-10: Registro de signos vitales.
        </p>

        <Link to="/paciente/registro">
          <button className="siih-button">Ir al registro de paciente</button>
        </Link>

        <div style={{ marginTop: '12px' }}>
          <Link to="/paciente/cita">
            <button className="siih-button">Solicitar cita medica</button>
          </Link>
        </div>

        <div style={{ marginTop: '12px' }}>
          <Link to="/enfermeria/admisiones">
            <button className="siih-button">Gestionar admisiones</button>
          </Link>
        </div>

        <div style={{ marginTop: '12px' }}>
          <Link to="/enfermeria/signos-vitales">
            <button className="siih-button">Registrar signos vitales</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
