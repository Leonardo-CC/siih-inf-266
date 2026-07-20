// src/pages/medico/TarjetaCita.jsx
// ============================================================
// COMPONENTE: Tarjeta individual de una cita
// Muestra: hora, paciente, estado, especialidad, teléfono
// ============================================================
import React from 'react';
import { IconoClock, IconoCheck, IconoX } from '../../components/Iconos.jsx';

const estadoColores = {
  pendiente: {
    bg: 'bg-yellow-50',
    borde: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  confirmada: {
    bg: 'bg-blue-50',
    borde: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
  },
  completada: {
    bg: 'bg-green-50',
    borde: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
  },
  cancelada: {
    bg: 'bg-red-50',
    borde: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
  },
};

const estadoIcono = {
  pendiente: <IconoClock className="w-3.5 h-3.5" />,
  confirmada: <IconoCheck className="w-3.5 h-3.5" />,
  completada: <><IconoCheck className="w-3.5 h-3.5" /><IconoCheck className="w-3.5 h-3.5 -ml-1" /></>,
  cancelada: <IconoX className="w-3.5 h-3.5" />,
};

export default function TarjetaCita({ cita }) {
  const formatearHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const estado = cita.estado || 'pendiente';
  const colores = estadoColores[estado] || estadoColores.pendiente;

  const pacienteNombre = cita.paciente?.persona
    ? `${cita.paciente.persona.nombre} ${cita.paciente.persona.apellido}`
    : 'Paciente desconocido';

  const telefonoPaciente = cita.paciente?.persona?.telefono || 'No disponible';
  const especialidad = cita.medico?.especialidad?.nombre || 'General';

  return (
    <div className={`border-l-4 ${colores.borde} ${colores.bg} p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {formatearHora(cita.fecha_hora)}
          </div>
          <p className="text-sm text-gray-600">{cita.fecha_hora.split('T')[0]}</p>
        </div>
        <span className={`${colores.badge} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1`}>
          {estadoIcono[estado]} {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <p className="text-sm text-gray-600">Paciente</p>
          <p className="font-semibold text-gray-900">{pacienteNombre}</p>
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-sm text-gray-600">Especialidad</p>
            <p className="text-sm font-medium text-gray-800">{especialidad}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="text-sm font-medium text-gray-800">{telefonoPaciente}</p>
          </div>
        </div>

        {cita.motivo && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Motivo</p>
            <p className="text-sm text-gray-700 italic">{cita.motivo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
