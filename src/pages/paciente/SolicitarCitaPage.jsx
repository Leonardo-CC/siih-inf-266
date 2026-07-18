import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import SolicitarCita from './SolicitarCita.jsx';

export default function SolicitarCitaPage() {
  const [idPaciente, setIdPaciente] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerIdPaciente() {
      const usuario = obtenerUsuario();
      if (!usuario) {
        setError('Debes iniciar sesion para solicitar una cita.');
        setCargando(false);
        return;
      }

      try {
        const res = await fetch('/api/pacientes/mi-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario }),
        });
        const data = await res.json();

        if (data.ok) {
          setIdPaciente(data.id_paciente);
        } else {
          setError(data.mensaje || 'No se pudo obtener tu perfil de paciente.');
        }
      } catch {
        setError('No se pudo conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    }

    obtenerIdPaciente();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return <SolicitarCita idPaciente={idPaciente} />;
}
