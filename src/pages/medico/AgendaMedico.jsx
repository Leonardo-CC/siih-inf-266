import React, { useState, useEffect } from 'react';
import TarjetaCita from './TarjetaCita';
import './AgendaMedico.css';

const AgendaMedico = () => {
  const [citas, setCitas] = useState([]);
  const [citasAgrupadas, setCitasAgrupadas] = useState({
    pendiente: [],
    confirmada: [],
    completada: [],
  });
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [totalCitas, setTotalCitas] = useState(0);

  // Obtener el ID del médico del usuario actual (ajusta según tu auth)
  const idMedico = localStorage.getItem('id_medico') || 1;

  // Cargar citas del día seleccionado
  useEffect(() => {
    cargarAgenda();
  }, [fechaSeleccionada]);

  const cargarAgenda = async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch(
        `/api/citas/agenda-medico?id_medico=${idMedico}&fecha=${fechaSeleccionada}`
      );

      if (!respuesta.ok) {
        throw new Error('Error al cargar la agenda');
      }

      const datos = await respuesta.json();

      if (datos.ok) {
        setCitasAgrupadas(datos.citas);
        setTotalCitas(datos.totalCitas);

        // Aplanar todas las citas para acceso general
        const todas = [
          ...datos.citas.pendiente,
          ...datos.citas.confirmada,
          ...datos.citas.completada,
        ];
        setCitas(todas);
      } else {
        setError(datos.mensaje || 'Error al cargar citas');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las citas. Intenta más tarde.');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar citas según el estado seleccionado
  const citasFiltradas = () => {
    if (filtroEstado === 'todas') {
      return citas;
    }
    return citasAgrupadas[filtroEstado] || [];
  };



  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };



  const citasAMostrar = citasFiltradas();

  return (
    <div className="agenda-medico-container">
      <header className="agenda-header">
        <h1>📋 Mi Agenda</h1>
        <p className="agenda-subtitle">Gestiona tus citas de hoy</p>
      </header>

      {/* Controles de filtro y fecha */}
      <div className="agenda-controles">
        <div className="control-fecha">
          <label htmlFor="fecha-input">Seleccionar fecha:</label>
          <input
            id="fecha-input"
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="input-fecha"
          />
        </div>

        <div className="control-filtros">
          <label htmlFor="filtro-estado">Filtrar por estado:</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">Todas las citas</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
          </select>
        </div>

        <button onClick={cargarAgenda} className="btn-recargar" disabled={cargando}>
          {cargando ? 'Cargando...' : '🔄 Recargar'}
        </button>
      </div>

      {/* Información de resumen */}
      <div className="agenda-resumen">
        <div className="resumen-card">
          <div className="resumen-numero">{totalCitas}</div>
          <div className="resumen-etiqueta">Citas totales</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-numero">{citasAgrupadas.pendiente?.length || 0}</div>
          <div className="resumen-etiqueta">Pendientes</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-numero">{citasAgrupadas.confirmada?.length || 0}</div>
          <div className="resumen-etiqueta">Confirmadas</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-numero">{citasAgrupadas.completada?.length || 0}</div>
          <div className="resumen-etiqueta">Completadas</div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && <div className="agenda-error">{error}</div>}

      {/* Fecha seleccionada */}
      <div className="fecha-actual">
        <strong>{formatearFecha(fechaSeleccionada)}</strong>
      </div>

      {/* Lista de citas */}
      <div className="agenda-citas">
        {cargando ? (
          <div className="cargando">Cargando citas...</div>
        ) : citasAMostrar.length === 0 ? (
          <div className="sin-citas">
            <p>No hay citas {filtroEstado !== 'todas' ? `con estado "${filtroEstado}"` : ''} para este día.</p>
          </div>
        ) : (
          citasAMostrar.map((cita) => (
            <TarjetaCita
              key={cita.id_cita}
              cita={cita}
              onVer={() => console.log('Ver cita:', cita.id_cita)}
              onConfirmar={() => console.log('Confirmar cita:', cita.id_cita)}
              onCancelar={() => console.log('Cancelar cita:', cita.id_cita)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AgendaMedico;
