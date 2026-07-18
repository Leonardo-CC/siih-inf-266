// src/pages/enfermeria/GestionAdmision.jsx
import { useEffect, useMemo, useRef, useState } from 'react';

const TIPO_LABELS = {
  consulta_externa: 'Consulta externa',
  emergencia: 'Emergencia',
  hospitalizacion: 'Hospitalizacion',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const estadoInicial = {
  id_cita: '',
  id_paciente: '',
  paciente_nombre: '',
  id_enfermero: '',
  id_medico: '',
  tipo_admision: 'consulta_externa',
  motivo_consulta: '',
  sala_asignada: '',
  datos_verificados: true,
  observaciones: '',
};

export default function GestionAdmision() {
  const [form, setForm] = useState(estadoInicial);
  const [citas, setCitas] = useState([]);
  const [enfermeros, setEnfermeros] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);

  const citaSeleccionada = useMemo(
    () => citas.find((c) => String(c.id_cita) === String(form.id_cita)),
    [citas, form.id_cita]
  );

  async function cargarOpciones() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/admisiones/opciones');
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.mensaje || 'No se pudieron cargar los datos de admision.');
        return;
      }

      setCitas(data.citas || []);
      setEnfermeros(data.enfermeros || []);
      setMedicos(data.medicos || []);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarOpciones();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  async function buscarPacientes(texto) {
    if (!texto || texto.length < 2) {
      setSugerencias([]);
      return;
    }

    setBuscando(true);
    try {
      const res = await fetch(`/api/admisiones/buscar?q=${encodeURIComponent(texto)}`);
      const data = await res.json();
      if (data.ok) {
        setSugerencias(data.results || []);
      } else {
        setSugerencias([]);
      }
    } catch {
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  }

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function seleccionarCita(idCita) {
    const cita = citas.find((c) => String(c.id_cita) === String(idCita));

    if (!cita) {
      setForm((actual) => ({
        ...actual,
        id_cita: '',
        id_paciente: '',
        paciente_nombre: '',
        id_medico: '',
        motivo_consulta: '',
      }));
      return;
    }

    setForm((actual) => ({
      ...actual,
      id_cita: String(cita.id_cita),
      id_paciente: String(cita.id_paciente),
      paciente_nombre: cita.paciente_nombre,
      id_medico: String(cita.id_medico),
      motivo_consulta: cita.motivo || actual.motivo_consulta,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensajeExito(null);
    setErrorGeneral(null);

    setEnviando(true);
    try {
      const res = await fetch('/api/admisiones/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        const errores = data.errores || {};
        setErrorGeneral(
          errores.general ||
            errores.asignacion ||
            errores.motivo_consulta ||
            errores.id_paciente ||
            errores.id_enfermero ||
            'No se pudo registrar la admision.'
        );
        return;
      }

      setMensajeExito(data.mensaje || 'Admision registrada correctamente.');
      setForm((actual) => ({
        ...estadoInicial,
        id_enfermero: actual.id_enfermero,
      }));
      await cargarOpciones();
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="siih-container siih-container-wide">
      <div className="siih-header">
        <h1>Gestion de admision</h1>
        <p>HU-11 · Verifica datos, registra motivo y asigna medico o sala.</p>
      </div>

      <div className="siih-body">
        {mensajeExito && <div className="siih-alert siih-alert-success">{mensajeExito}</div>}
        {errorGeneral && <div className="siih-alert siih-alert-error">{errorGeneral}</div>}

        {cargando ? (
          <p className="siih-hint">Cargando datos de admision...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="siih-section-title">Datos de ingreso</div>

            <div className="siih-field">
              <label>Cita programada</label>
              <select value={form.id_cita} onChange={(e) => seleccionarCita(e.target.value)}>
                <option value="">Admision directa / sin cita</option>
                {citas.map((cita) => (
                  <option key={cita.id_cita} value={cita.id_cita}>
                    #{cita.id_cita} · {formatearFecha(cita.fecha_hora)} · {cita.paciente_nombre}
                  </option>
                ))}
              </select>
              {citaSeleccionada && (
                <p className="siih-hint">
                  Medico asignado: {citaSeleccionada.medico_nombre} · Estado: {citaSeleccionada.estado}
                </p>
              )}
            </div>

            <div className="siih-row">
              <div className="siih-field">
                <label>Nombre del paciente *</label>
                <input
                  type="text"
                  list="pacientes-list"
                  value={form.paciente_nombre}
                  onChange={(e) => {
                    const v = e.target.value;
                    const match = sugerencias.find((p) => p.nombre_completo === v);
                    actualizarCampo('paciente_nombre', v);
                    actualizarCampo('id_paciente', match ? String(match.id_paciente) : '');
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                    }
                    debounceRef.current = setTimeout(() => buscarPacientes(v), 250);
                  }}
                  onBlur={() => {
                    const match = sugerencias.find(
                      (p) => p.nombre_completo.toLowerCase() === form.paciente_nombre.toLowerCase()
                    );
                    if (match) {
                      actualizarCampo('id_paciente', String(match.id_paciente));
                    }
                  }}
                  disabled={Boolean(form.id_cita)}
                  placeholder="Escribe para buscar paciente"
                  required
                />
                <datalist id="pacientes-list">
                  {sugerencias.map((p) => (
                    <option key={p.persona_id} value={p.nombre_completo} />
                  ))}
                </datalist>
                {buscando && <p className="siih-hint">Buscando pacientes...</p>}
                {!buscando && form.paciente_nombre && sugerencias.length === 0 && (
                  <p className="siih-hint">No se encontraron pacientes con ese nombre.</p>
                )}
              </div>

              <div className="siih-field">
                <label>Enfermero(a) responsable *</label>
                <select
                  value={form.id_enfermero}
                  onChange={(e) => actualizarCampo('id_enfermero', e.target.value)}
                  required
                >
                  <option value="">Selecciona enfermero(a)</option>
                  {enfermeros.map((e) => (
                    <option key={e.id_enfermero} value={e.id_enfermero}>
                      {e.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="siih-row">
              <div className="siih-field">
                <label>Tipo de admision *</label>
                <select
                  value={form.tipo_admision}
                  onChange={(e) => actualizarCampo('tipo_admision', e.target.value)}
                  required
                >
                  {Object.entries(TIPO_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="siih-field">
                <label>Medico asignado</label>
                <select
                  value={form.id_medico}
                  onChange={(e) => actualizarCampo('id_medico', e.target.value)}
                  disabled={Boolean(form.id_cita)}
                >
                  <option value="">Sin medico directo</option>
                  {medicos.map((m) => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="siih-field">
              <label>Sala asignada</label>
              <input
                value={form.sala_asignada}
                onChange={(e) => actualizarCampo('sala_asignada', e.target.value)}
                placeholder="Ej. Consultorio 2, Emergencias, Sala A"
              />
            </div>

            <div className="siih-field">
              <label>Motivo de consulta *</label>
              <textarea
                rows="3"
                value={form.motivo_consulta}
                onChange={(e) => actualizarCampo('motivo_consulta', e.target.value)}
                placeholder="Describe el motivo indicado por el paciente"
                required
              />
            </div>

            <div className="siih-field">
              <label>Observaciones</label>
              <textarea
                rows="2"
                value={form.observaciones}
                onChange={(e) => actualizarCampo('observaciones', e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <label className="siih-check">
              <input
                type="checkbox"
                checked={form.datos_verificados}
                onChange={(e) => actualizarCampo('datos_verificados', e.target.checked)}
              />
              Datos del paciente verificados
            </label>

            <button type="submit" className="siih-button" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Registrar admision'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
