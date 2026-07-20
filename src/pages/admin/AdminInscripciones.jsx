import { useEffect, useState } from 'react';
import TablaCRUD from '../../components/TablaCRUD.jsx';

const ESTADO_CLASES = {
  activa: 'bg-green-100 text-green-800 border-green-200',
  anulada: 'bg-red-100 text-red-700 border-red-200',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-BO', { dateStyle: 'medium' });
}

export default function AdminInscripciones() {
  const [facultades, setFacultades] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ ci: '', id_area: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [descargandoId, setDescargandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  async function cargarTodo() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const [resFac, resInsc] = await Promise.all([
        fetch('/api/facultades/listar'),
        fetch('/api/inscripciones/listar'),
      ]);
      const dataFac = await resFac.json();
      const dataInsc = await resInsc.json();

      if (dataFac.ok) setFacultades(dataFac.facultades || []);
      if (dataInsc.ok) setInscripciones(dataInsc.inscripciones || []);
      if (!dataFac.ok || !dataInsc.ok) {
        setErrorGeneral(dataFac.mensaje || dataInsc.mensaje || 'No se pudo cargar la información.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    try {
      const res = await fetch('/api/inscripciones/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.errores?.general || data.mensaje || 'No se pudo registrar la inscripción.');
        if (data.errores) setErrores(data.errores);
        return;
      }

      setMensaje(data.mensaje || 'Inscripción registrada correctamente.');
      setForm({ ci: '', id_area: '' });
      await cargarTodo();
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleDescargarComprobante(inscripcion) {
    setDescargandoId(inscripcion.id_inscripcion);
    setErrorGeneral(null);
    try {
      const res = await fetch(`/api/inscripciones/comprobante?id_inscripcion=${inscripcion.id_inscripcion}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.errores?.general || data?.mensaje || 'No se pudo generar el comprobante.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_inscripcion_${inscripcion.id_inscripcion}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setDescargandoId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Formulario de inscripción */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Gestión de Inscripción</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Inscribe a un paciente/estudiante ya registrado (HU-01) en una facultad/área, sin repetir sus datos.
          </p>
        </div>

        <div className="p-6">
          {mensaje && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
          )}
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">CI del paciente/estudiante *</label>
              <input
                name="ci"
                value={form.ci}
                onChange={handleChange}
                placeholder="Ej. 9876543"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.ci ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.ci && <p className="text-red-500 text-xs mt-1">{errores.ci}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Facultad / Área *</label>
              <select
                name="id_area"
                value={form.id_area}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white ${errores.id_area ? 'border-red-400' : 'border-slate-300'}`}
                required
              >
                <option value="">Selecciona...</option>
                {facultades.map((f) => (
                  <option key={f.id_area} value={f.id_area}>{f.nombre_area}</option>
                ))}
              </select>
              {errores.id_area && <p className="text-red-500 text-xs mt-1">{errores.id_area}</p>}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Registrando...' : 'Registrar inscripción'}
            </button>
          </form>
        </div>
      </div>

      {/* Tabla de inscripciones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Inscripciones registradas</h2>
        </div>
        <div className="p-6">
          <TablaCRUD
            columnas={[
              { clave: 'id_inscripcion', titulo: 'ID' },
              { clave: 'paciente_nombre_completo', titulo: 'Paciente/Estudiante' },
              { clave: 'facultad', titulo: 'Facultad / Área' },
              { clave: 'fecha_inscripcion', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (v) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CLASES[v] || ESTADO_CLASES.activa}`}>
                    {v === 'activa' ? 'Activa' : 'Anulada'}
                  </span>
                ),
              },
              {
                clave: 'id_inscripcion',
                titulo: 'Comprobante',
                render: (v, fila) => (
                  <button
                    type="button"
                    onClick={() => handleDescargarComprobante(fila)}
                    disabled={descargandoId === fila.id_inscripcion}
                    className="text-primary hover:text-primary-dark font-medium text-sm disabled:opacity-50"
                  >
                    {descargandoId === fila.id_inscripcion ? 'Generando...' : '📄 PDF'}
                  </button>
                ),
              },
            ]}
            datos={inscripciones}
            cargando={cargando}
            emptyMessage="No hay inscripciones registradas todavía"
          />
        </div>
      </div>
    </div>
  );
}