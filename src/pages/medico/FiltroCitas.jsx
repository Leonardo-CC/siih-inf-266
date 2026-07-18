// src/pages/medico/FiltroCitas.jsx
// ============================================================
// COMPONENTE: Filtros para la agenda del médico
// Permite filtrar por: fecha, especialidad, estado
// ============================================================
import React from 'react';

export default function FiltroCitas({
  fecha,
  setFecha,
  filtroEstado,
  setFiltroEstado,
  loading,
}) {
  const hoy = new Date().toISOString().split('T')[0];

  const estados = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'confirmada', label: 'Confirmadas' },
    { value: 'completada', label: 'Completadas' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros de Agenda</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector de Fecha */}
        <div>
          <label htmlFor="fecha" className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={hoy}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Filtro de Estado */}
        <div>
          <label htmlFor="estado" className="block text-sm font-semibold text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Consejo:</strong> Selecciona una fecha para ver tu agenda del día en tiempo real. Las citas se actualizan automáticamente.
        </p>
      </div>
    </div>
  );
}
