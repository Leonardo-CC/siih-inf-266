// src/pages/paciente/SolicitarCitaPage.jsx
import { useState } from 'react';
import SolicitarCita from './SolicitarCita.jsx';

// CAPA DE PRESENTACIÓN
// Wrapper temporal para HU-03 mientras no existe login (HU-02 aún no implementada).
// Pide el id_paciente a mano y luego renderiza el formulario real.
// Cuando exista sesión de usuario, reemplaza este archivo por uno que lea
// el id_paciente del contexto de auth y borra este paso intermedio.
export default function SolicitarCitaPage() {
  const [idPaciente, setIdPaciente] = useState('');
  const [confirmado, setConfirmado] = useState(null);

  if (confirmado) {
    return <SolicitarCita idPaciente={confirmado} />;
  }

  return (
    <div className="siih-container">
      <div className="siih-header">
        <h1>Solicitar cita médica</h1>
        <p>Antes de continuar, confirma tu ID de paciente (temporal, hasta que exista login).</p>
      </div>
      <div className="siih-body">
        <div className="siih-field">
          <label>ID de paciente (id_paciente) *</label>
          <input
            type="number"
            value={idPaciente}
            onChange={(e) => setIdPaciente(e.target.value)}
            placeholder="Ej: 1"
          />
        </div>
        <button
          type="button"
          className="siih-button"
          disabled={!idPaciente}
          onClick={() => setConfirmado(Number(idPaciente))}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}