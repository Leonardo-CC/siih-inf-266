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
  const formInicial = {
    ci: '',
    id_area: '',
    matricula_numero: '',
    matricula_foto_url: '',
    monto: '50',
    metodo_pago: 'efectivo',
    razon_social: '',
    nit_ci: '',
  };
  const [form, setForm] = useState(formInicial);
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

      setMensaje(data.advertencia_factura ? `${data.mensaje} ${data.advertencia_factura}` : data.mensaje || 'Inscripcion registrada correctamente.');
      setForm(formInicial);
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

  function cargarArchivoMatricula(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, matricula_foto_url: reader.result }));
      setErrores((prev) => ({ ...prev, matricula_foto_url: '' }));
    };
    reader.readAsDataURL(file);
  }

  function handleDescargarFactura(inscripcion) {
    if (!inscripcion.id_pago) return;
    window.location.href = `/api/pagos/factura?id_pago=${inscripcion.id_pago}`;
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Numero de matricula *</label>
              <input
                name="matricula_numero"
                value={form.matricula_numero}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.matricula_numero ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.matricula_numero && <p className="text-red-500 text-xs mt-1">{errores.matricula_numero}</p>}
            </div>

            <ArchivoCampo
              label="Foto / respaldo matricula *"
              value={form.matricula_foto_url}
              error={errores.matricula_foto_url}
              onFile={cargarArchivoMatricula}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Monto Bs. *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.monto ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.monto && <p className="text-red-500 text-xs mt-1">{errores.monto}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Metodo de pago *</label>
              <select
                name="metodo_pago"
                value={form.metodo_pago}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white ${errores.metodo_pago ? 'border-red-400' : 'border-slate-300'}`}
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
              {errores.metodo_pago && <p className="text-red-500 text-xs mt-1">{errores.metodo_pago}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Razon social</label>
              <input
                name="razon_social"
                value={form.razon_social}
                onChange={handleChange}
                placeholder="Nombre para factura"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">NIT / CI</label>
              <input
                name="nit_ci"
                value={form.nit_ci}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
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
              { clave: 'pago', titulo: 'Pago', render: (v) => v ? `Bs. ${Number(v.monto).toFixed(2)} (${v.metodo_pago})` : '-' },
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
              {
                clave: 'id_pago',
                titulo: 'Factura',
                render: (v, fila) => v ? (
                  <button
                    type="button"
                    onClick={() => handleDescargarFactura(fila)}
                    className="text-primary hover:text-primary-dark font-medium text-sm"
                  >
                    PDF factura
                  </button>
                ) : '-',
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

function ArchivoCampo({ label, value, error, onFile }) {
  const tieneArchivo = Boolean(value);

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className={`rounded-lg border bg-white p-3 ${error ? 'border-red-400' : 'border-slate-300'}`}>
        <input
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
          required={!tieneArchivo}
        />
        {tieneArchivo && <p className="mt-2 text-xs text-green-700">Archivo cargado correctamente.</p>}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
