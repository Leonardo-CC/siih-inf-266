// src/pages/enfermeria/RegistroSignosVitales.jsx
import { useEffect, useMemo, useState } from 'react';

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const estadoInicial = {
  id_consulta: '',
  id_enfermero: '',
  presion_arterial: '',
  temperatura: '',
  frecuencia_cardiaca: '',
  observaciones: '',
};

export default function RegistroSignosVitales() {
  const [form, setForm] = useState(estadoInicial);
  const [consultas, setConsultas] = useState([]);
  const [enfermeros, setEnfermeros] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const consultaSeleccionada = useMemo(
    () => consultas.find((c) => String(c.id_consulta) === String(form.id_consulta)),
    [consultas, form.id_consulta]
  );

  async function cargarDatos() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const [opcionesRes, listaRes] = await Promise.all([
        fetch('/api/signos-vitales/opciones'),
        fetch('/api/signos-vitales/listar'),
      ]);

      const opciones = await opcionesRes.json();
      const lista = await listaRes.json();

      if (!opciones.ok) {
        setErrorGeneral(opciones.mensaje || 'No se pudieron cargar los datos.');
        return;
      }

      setConsultas(opciones.consultas || []);
      setEnfermeros(opciones.enfermeros || []);
      setRegistros(lista.signos || []);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensajeExito(null);
    setErrorGeneral(null);

    setEnviando(true);
    try {
      const res = await fetch('/api/signos-vitales/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        const errores = data.errores || {};
        setErrorGeneral(
          errores.general ||
            errores.signos ||
            errores.id_consulta ||
            errores.id_enfermero ||
            errores.presion_arterial ||
            errores.temperatura ||
            errores.frecuencia_cardiaca ||
            'No se pudieron registrar los signos vitales.'
        );
        return;
      }

      setMensajeExito(data.mensaje || 'Signos vitales registrados correctamente.');
      setForm((actual) => ({ ...estadoInicial, id_enfermero: actual.id_enfermero }));
      await cargarDatos();
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="siih-container siih-container-wide">
      <div className="siih-header">
        <h1>Registro de signos vitales</h1>
        <p>HU-10 · Registra presion, temperatura y frecuencia cardiaca previo a la atencion medica.</p>
      </div>

      <div className="siih-body">
        {mensajeExito && <div className="siih-alert siih-alert-success">{mensajeExito}</div>}
        {errorGeneral && <div className="siih-alert siih-alert-error">{errorGeneral}</div>}

        {cargando ? (
          <p className="siih-hint">Cargando datos...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="siih-section-title">Datos del paciente</div>

            <div className="siih-field">
              <label>Consulta del paciente *</label>
              <select
                value={form.id_consulta}
                onChange={(e) => actualizarCampo('id_consulta', e.target.value)}
                required
              >
                <option value="">Selecciona la consulta</option>
                {consultas.map((c) => (
                  <option key={c.id_consulta} value={c.id_consulta}>
                    #{c.id_consulta} · {c.paciente_nombre} · {formatearFecha(c.fecha_consulta)}
                  </option>
                ))}
              </select>
              {consultaSeleccionada && (
                <p className="siih-hint">
                  Motivo: {consultaSeleccionada.motivo_consulta || 'Sin motivo registrado'}
                </p>
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

            <div className="siih-section-title">Signos vitales</div>

            <div className="siih-row">
              <div className="siih-field">
                <label>Presion arterial (mmHg) *</label>
                <input
                  type="text"
                  value={form.presion_arterial}
                  onChange={(e) => actualizarCampo('presion_arterial', e.target.value)}
                  placeholder="Ej. 120/80"
                />
              </div>

              <div className="siih-field">
                <label>Temperatura (°C) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  value={form.temperatura}
                  onChange={(e) => actualizarCampo('temperatura', e.target.value)}
                  placeholder="Ej. 36.8"
                />
              </div>

              <div className="siih-field">
                <label>Frecuencia cardiaca (lpm) *</label>
                <input
                  type="number"
                  step="1"
                  min="30"
                  max="220"
                  value={form.frecuencia_cardiaca}
                  onChange={(e) => actualizarCampo('frecuencia_cardiaca', e.target.value)}
                  placeholder="Ej. 80"
                />
              </div>
            </div>

            <div className="siih-hint">
              * Se requiere al menos un signo vital. Completa los campos que correspondan.
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

            <button type="submit" className="siih-button" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Registrar signos vitales'}
            </button>
          </form>
        )}

        {!cargando && registros.length > 0 && (
          <>
            <div className="siih-section-title">Registros recientes</div>
            <table className="siih-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Presion</th>
                  <th>Temp.</th>
                  <th>FC</th>
                  <th>Enfermero(a)</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id_signos}>
                    <td>{formatearFecha(r.fecha_hora)}</td>
                    <td>
                      {r.paciente_nombre} {r.paciente_apellido}
                    </td>
                    <td>{r.presion_arterial || '-'}</td>
                    <td>{r.temperatura != null ? `${r.temperatura} °C` : '-'}</td>
                    <td>{r.frecuencia_cardiaca != null ? `${r.frecuencia_cardiaca} lpm` : '-'}</td>
                    <td>
                      {r.enfermero_nombre} {r.enfermero_apellido}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
