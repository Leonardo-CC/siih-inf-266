import { useEffect, useState } from 'react';
import PagoCita from './PagoCita.jsx';

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
  const [tipoConsulta, setTipoConsulta] = useState('consulta_externa');

  const [cargandoMedicos, setCargandoMedicos] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const [citaCreada, setCitaCreada] = useState(null);

  useEffect(() => {
    async function cargarEspecialidades() {
      try {
        const res = await fetch('/api/citas/especialidades');
        const data = await res.json();
        if (data.ok) setEspecialidades(data.especialidades);
        else setErrorGeneral(data.mensaje || 'No se pudo cargar la lista de especialidades.');
      } catch {
        setErrorGeneral('No se pudo conectar con el servidor.');
      }
    }
    cargarEspecialidades();
  }, []);

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
        else setErrorGeneral(data.mensaje || 'No se pudo cargar la lista de medicos.');
      } catch {
        setErrorGeneral('No se pudo conectar con el servidor.');
      } finally {
        setCargandoMedicos(false);
      }
    }
    cargarMedicos();
  }, [especialidad]);

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
        setErrorGeneral('No se pudo conectar con el servidor.');
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
      setErrorGeneral('No se identifico al paciente (falta sesion/idPaciente).');
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
          tipo_consulta: tipoConsulta,
          motivo,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setCitaCreada({
          id_cita: data.cita.id_cita,
          id_medico: idMedico,
        });
        setMensajeExito(`${data.mensaje} (Estado: ${data.cita.estado}). Redirigiendo al pago...`);
      } else {
        setErrorGeneral(
          data.errores?.general || data.errores?.fecha_hora || data.mensaje || 'Ocurrio un error inesperado.'
        );
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Solicitar cita medica</h1>
          <p className="text-blue-100 mt-1 text-sm">HU-03 · Elige especialidad, medico y un horario libre. Podras ver el estado de tu cita.</p>
        </div>

        <div className="p-8">
          {mensajeExito && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {mensajeExito}
            </div>
          )}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorGeneral}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de consulta *</label>
                <select
                  value={tipoConsulta}
                  onChange={(e) => setTipoConsulta(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  required
                >
                  <option value="consulta_externa">Consulta Externa</option>
                  <option value="emergencia">Emergencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidad *</label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  required
                >
                  <option value="">Selecciona una especialidad</option>
                  {especialidades.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Medico *</label>
                <select
                  value={idMedico}
                  onChange={(e) => setIdMedico(e.target.value)}
                  disabled={!especialidad || cargandoMedicos}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition disabled:bg-slate-100"
                  required
                >
                  <option value="">{cargandoMedicos ? 'Cargando medicos...' : 'Selecciona un medico'}</option>
                  {medicos.map((m) => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                min={hoyISO}
                onChange={(e) => setFecha(e.target.value)}
                disabled={!idMedico}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition disabled:bg-slate-100"
                required
              />
            </div>

            {idMedico && fecha && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Horario disponible *</label>
                {cargandoHorarios && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Cargando horarios...
                  </div>
                )}
                {!cargandoHorarios && horarios.length === 0 && (
                  <p className="text-sm text-slate-500">No hay horarios para este dia (dia no laboral o sin cupos).</p>
                )}
                {!cargandoHorarios && horarios.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {horarios.map((h) => {
                      const seleccionado = horaSeleccionada?.fecha_hora === h.fecha_hora;
                      return (
                        <button
                          type="button"
                          key={h.fecha_hora}
                          disabled={!h.disponible}
                          onClick={() => setHoraSeleccionada(h)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                            !h.disponible
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : seleccionado
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-primary hover:bg-primary-light'
                          }`}
                        >
                          {h.hora}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de la consulta</label>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Opcional: describe brevemente el motivo"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={enviando || !horaSeleccionada}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Solicitando...' : 'Solicitar cita'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
