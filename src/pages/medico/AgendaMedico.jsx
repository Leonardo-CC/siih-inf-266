import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      const url = `/api/citas/agenda-medico?id_medico=${idMedico}&fecha=${fechaSeleccionada}`;
      console.log('[v0] Cargando agenda desde:', url);
      console.log('[v0] ID Médico:', idMedico);
      console.log('[v0] Fecha seleccionada:', fechaSeleccionada);

      const respuesta = await fetch(url);

      console.log('[v0] Respuesta status:', respuesta.status);

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        console.error('[v0] Error en respuesta:', textoError);
        throw new Error(`Error HTTP ${respuesta.status}: ${textoError}`);
      }

      const datos = await respuesta.json();
      console.log('[v0] Datos recibidos:', datos);

      if (datos.ok) {
        setCitasAgrupadas(datos.citas);
        setTotalCitas(datos.totalCitas);

        // Aplanar todas las citas para acceso general
        const todas = [
          ...datos.citas.pendiente,
          ...datos.citas.confirmada,
          ...datos.citas.completada,
        ];
        console.log('[v0] Total de citas:', todas.length);
        setCitas(todas);
      } else {
        const mensajeError = datos.mensaje || JSON.stringify(datos.errores) || 'Error desconocido al cargar citas';
        console.error('[v0] Error en datos:', mensajeError);
        setError(mensajeError);
      }
    } catch (err) {
      console.error('[v0] Error capturado:', err);
      setError(`Error: ${err.message}`);
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
      {error && (
        <div className="agenda-error">
          <strong>Error:</strong> {error}
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            📖 Lee la consola (F12) o abre DEBUG_AGENDA.md para más detalles
          </div>
        </div>
      )}

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

      {/* Botón para regresar a Home */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/">
          <button style={{ 
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            Volver a inicio
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AgendaMedico;
