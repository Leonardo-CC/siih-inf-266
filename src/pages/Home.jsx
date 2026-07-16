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
        <p>Sprint 1 · HU-01: Registro de paciente/estudiante.</p>
        <Link to="/paciente/registro">
          <button className="siih-button">Ir al registro de paciente</button>
        </Link>
      </div>
    </div>
  );
}
