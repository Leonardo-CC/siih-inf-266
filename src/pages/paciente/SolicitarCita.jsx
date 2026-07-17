// src/pages/paciente/SolicitarCita.jsx
import { useEffect, useState } from 'react';
import PagoCita from './PagoCita.jsx';

// CAPA DE PRESENTACIÓN
// Vista del ACTOR "Paciente/Estudiante" — HU-03
// Solo se encarga de mostrar el formulario y llamar a los endpoints /api/citas/*.
// Toda la validación real (horarios ocupados, fechas pasadas) vive en /api,
// igual que RegistroPaciente.jsx (server-side) llama a /api/pacientes/registro.
//
// IMPORTANTE PARA PROBARLO: estos endpoints viven en /api (Vercel Functions),
// así que corriendo solo `npm run dev` (Vite) NO van a responder — hay que
// correr `vercel dev` para que sirva a la vez el frontend y las funciones.
export default function SolicitarCita({ idPaciente }) {
  const hoyISO = new Date().toISOString().slice(0, 10);

  const [especialidades, setEspecialidades] = useState([]);
  const [especialidad, setEspecialidad] = useState('');

  const [medicos, setMedicos] = useState([]);
  const [idMedico, setIdMedico] = useState('');

  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);

  const [motivo, setMotivo] = useState('');

  const [cargandoMedicos, setCargandoMedicos] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  // Estados para flujo de pago después de solicitar cita
  const [citaCreada, setCitaCreada] = useState(null); // { id_cita, id_medico } cuando se crea exitosamente

  // 1. Cargar especialidades al montar
  useEffect(() => {
    async function cargarEspecialidades() {
      try {
        const res = await fetch('/api/citas/especialidades');
        const data = await res.json();
        if (data.ok) setEspecialidades(data.especialidades);
        else setErrorGeneral(data.mensaje || 'No se pudo cargar la lista de especialidades.');
      } catch {
        setErrorGeneral('No se pudo conectar con el servidor. Intenta nuevamente ......');
      }
    }
    cargarEspecialidades();
  }, []);

  // 2. Cuando cambia la especialidad, cargar médicos y resetear lo siguiente
  useEffect(() => {
    setIdMedico('');
    setFecha('');
    setHorarios([]);
    setHoraSeleccionada(null);
    setMedicos([]);
    if (!especialidad) return;

    async function cargarMedicos() {
      setCargandoMedicos(true);
      try {
        const res = await fetch(`/api/citas/medicos?especialidad=${encodeURIComponent(especialidad)}`);
        const data = await res.json();
        if (data.ok) setMedicos(data.medicos);
        else setErrorGeneral(data.mensaje || 'No se pudo cargar la lista de médicos.');
      } catch {
        setErrorGeneral('No se pudo conectar con el servidor. Intenta nuevamente.');
      } finally {
        setCargandoMedicos(false);
      }
    }
    cargarMedicos();
  }, [especialidad]);

  // 3. Cuando cambia médico o fecha, cargar horarios disponibles
  useEffect(() => {
    setHorarios([]);
    setHoraSeleccionada(null);
    if (!idMedico || !fecha) return;

    async function cargarHorarios() {
      setCargandoHorarios(true);
      setErrorGeneral(null);
      try {
        const res = await fetch(`/api/citas/horarios?id_medico=${idMedico}&fecha=${fecha}`);
        const data = await res.json();
        if (data.ok) setHorarios(data.horarios);
        else setErrorGeneral(data.mensaje || 'No se pudieron cargar los horarios.');
      } catch {
        setErrorGeneral('No se pudo conectar con el servidor. Intenta nuevamente.');
      } finally {
        setCargandoHorarios(false);
      }
    }
    cargarHorarios();
  }, [idMedico, fecha]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGeneral(null);
    setMensajeExito(null);

    if (!horaSeleccionada) {
      setErrorGeneral('Selecciona un horario disponible.');
      return;
    }
    if (!idPaciente) {
      setErrorGeneral('No se identificó al paciente (falta sesión/idPaciente).');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/citas/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paciente: idPaciente,
          id_medico: idMedico,
          fecha_hora: horaSeleccionada.fecha_hora,
          motivo,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        // Cita creada exitosamente, ir al flujo de pago
        setCitaCreada({
          id_cita: data.cita.id_cita,
          id_medico: idMedico,
        });
        setMensajeExito(`${data.mensaje} (Estado: ${data.cita.estado}). Proceeding to payment...`);
      } else {
        setErrorGeneral(
          data.errores?.general || data.errores?.fecha_hora || data.mensaje || 'Ocurrió un error inesperado.'
        );
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  // Si la cita fue creada exitosamente, mostrar flujo de pago
  if (citaCreada) {
    return (
      <PagoCita
        idPaciente={idPaciente}
        idCita={citaCreada.id_cita}
        idMedico={citaCreada.id_medico}
      />
    );
  }

  return (
    <div className="siih-container">
      <div className="siih-header">
        <h1>Solicitar cita médica</h1>
        <p>HU-03 · Elige especialidad, médico y un horario libre. Podrás ver el estado de tu cita.</p>
      </div>

      <div className="siih-body">
        {mensajeExito && <div className="siih-alert siih-alert-success">{mensajeExito}</div>}
        {errorGeneral && <div className="siih-alert siih-alert-error">{errorGeneral}</div>}

        <form onSubmit={handleSubmit}>
          <div className="siih-row">
            <div className="siih-field">
              <label>Especialidad *</label>
              <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} required>
                <option value="">Selecciona una especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            <div className="siih-field">
              <label>Médico *</label>
              <select
                value={idMedico}
                onChange={(e) => setIdMedico(e.target.value)}
                disabled={!especialidad || cargandoMedicos}
                required
              >
                <option value="">{cargandoMedicos ? 'Cargando médicos...' : 'Selecciona un médico'}</option>
                {medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    {m.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="siih-field">
            <label>Fecha *</label>
            <input
              type="date"
              value={fecha}
              min={hoyISO}
              onChange={(e) => setFecha(e.target.value)}
              disabled={!idMedico}
              required
            />
          </div>

          {idMedico && fecha && (
            <div className="siih-field">
              <label>Horario disponible *</label>
              {cargandoHorarios && <p className="siih-hint">Cargando horarios...</p>}
              {!cargandoHorarios && horarios.length === 0 && (
                <p className="siih-hint">No hay horarios para este día (día no laboral o sin cupos).</p>
              )}
              {!cargandoHorarios && horarios.length > 0 && (
                <div className="siih-slot-grid">
                  {horarios.map((h) => {
                    const seleccionado = horaSeleccionada?.fecha_hora === h.fecha_hora;
                    return (
                      <button
                        type="button"
                        key={h.fecha_hora}
                        disabled={!h.disponible}
                        onClick={() => setHoraSeleccionada(h)}
                        className={
                          'siih-slot' +
                          (!h.disponible ? ' siih-slot-ocupado' : '') +
                          (seleccionado ? ' siih-slot-selected' : '')
                        }
                      >
                        {h.hora}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="siih-field">
            <label>Motivo de la consulta</label>
            <input
              name="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Opcional: describe brevemente el motivo"
            />
          </div>

          <button type="submit" className="siih-button" disabled={enviando || !horaSeleccionada}>
            {enviando ? 'Solicitando...' : 'Solicitar cita'}
          </button>
        </form>
      </div>
    </div>
  );
}
