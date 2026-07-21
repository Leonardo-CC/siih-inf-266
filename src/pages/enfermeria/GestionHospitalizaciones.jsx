import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import { IconoBuildingHospital, IconoCheck, IconoEye, IconoRefresh } from '../../components/Iconos.jsx';

const altaInicial = {
  motivo_alta: '',
  indicaciones_alta: '',
};

function fecha(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function estadoClase(estado) {
  if (estado === 'alta') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (estado === 'cancelada') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

export default function GestionHospitalizaciones() {
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [modalAlta, setModalAlta] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [formAlta, setFormAlta] = useState(altaInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setCargando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/hospitalizaciones');
      const data = await res.json();
      if (data.ok) setHospitalizaciones(data.hospitalizaciones || []);
      else setMensaje({ tipo: 'error', texto: data.errores?.general || 'No se pudieron cargar las hospitalizaciones.' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirAlta(hospitalizacion) {
    setSeleccionada(hospitalizacion);
    setFormAlta(altaInicial);
    setErrores({});
    setMensaje(null);
    setModalAlta(true);
  }

  function abrirDetalle(hospitalizacion) {
    setSeleccionada(hospitalizacion);
    setModalDetalle(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormAlta((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function guardarAlta(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setMensaje(null);
    try {
      const res = await fetch('/api/hospitalizaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_hospitalizacion: seleccionada?.id_hospitalizacion,
          motivo_alta: formAlta.motivo_alta,
          indicaciones_alta: formAlta.indicaciones_alta,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrores(data.errores || {});
        setMensaje({ tipo: 'error', texto: data.errores?.general || 'No se pudo registrar el alta.' });
        return;
      }
      setMensaje({ tipo: 'exito', texto: data.mensaje || 'Alta registrada correctamente.' });
      setModalAlta(false);
      await cargar();
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setEnviando(false);
    }
  }

  const activas = hospitalizaciones.filter((h) => h.estado === 'activa').length;
  const altas = hospitalizaciones.filter((h) => h.estado === 'alta').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-slate-900 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <IconoBuildingHospital className="w-6 h-6" />
              Hospitalizaciones
            </h1>
            <p className="text-purple-100 mt-1 text-sm">Gestiona internaciones autorizadas, seguimiento y altas hospitalarias.</p>
          </div>
          <button
            type="button"
            onClick={cargar}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
          >
            <IconoRefresh className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        <div className="p-6 space-y-6">
          {mensaje && (
            <div className={`p-4 rounded-lg border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {mensaje.texto}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
              <p className="text-sm font-semibold">Activas</p>
              <p className="text-2xl font-bold mt-1">{activas}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="text-sm font-semibold">Altas</p>
              <p className="text-2xl font-bold mt-1">{altas}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-2xl font-bold mt-1">{hospitalizaciones.length}</p>
            </div>
          </div>

          <TablaCRUD
            columnas={[
              { clave: 'id_hospitalizacion', titulo: 'ID' },
              { clave: 'paciente_nombre', titulo: 'Paciente' },
              { clave: 'medico_nombre', titulo: 'Medico' },
              { clave: 'fecha_ingreso', titulo: 'Ingreso', render: (v) => fecha(v) },
              { clave: 'tiempo_internacion_dias', titulo: 'Dias', render: (v) => v || '-' },
              { clave: 'sala', titulo: 'Sala', render: (v, f) => [v, f.cama].filter(Boolean).join(' / ') || '-' },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (v) => (
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${estadoClase(v)}`}>
                    {v || 'activa'}
                  </span>
                ),
              },
              {
                clave: 'motivo_ingreso',
                titulo: 'Detalle clinico',
                render: (v) => <span title={v}>{v ? `${String(v).slice(0, 72)}${String(v).length > 72 ? '...' : ''}` : '-'}</span>,
              },
            ]}
            datos={hospitalizaciones}
            cargando={cargando}
            emptyMessage="No hay hospitalizaciones autorizadas."
            renderAcciones={(h) => (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => abrirDetalle(h)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                  title="Ver detalle"
                >
                  <IconoEye className="w-4 h-4" />
                  Ver
                </button>
                {h.estado === 'activa' ? (
                  <button
                    type="button"
                    onClick={() => abrirAlta(h)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    title="Dar de alta"
                  >
                    <IconoCheck className="w-4 h-4" />
                    Alta
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Cerrada</span>
                )}
              </div>
            )}
          />
        </div>
      </div>

      <Modal abierto={modalAlta} alCerrar={() => setModalAlta(false)} titulo="Dar de alta hospitalaria" ancho="max-w-2xl">
        {seleccionada && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-700">Paciente:</span> {seleccionada.paciente_nombre}</p>
            <p><span className="font-semibold text-slate-700">Ingreso:</span> {fecha(seleccionada.fecha_ingreso)}</p>
            <p><span className="font-semibold text-slate-700">Sala/Cama:</span> {[seleccionada.sala, seleccionada.cama].filter(Boolean).join(' / ') || '-'}</p>
          </div>
        )}

        <form onSubmit={guardarAlta} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de alta *</label>
            <textarea
              name="motivo_alta"
              value={formAlta.motivo_alta}
              onChange={handleChange}
              rows="3"
              placeholder="Ej. Evolucion favorable, tratamiento concluido, alta voluntaria..."
              className={`w-full rounded-lg border px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errores.motivo_alta ? 'border-red-400' : 'border-slate-300'}`}
            />
            {errores.motivo_alta && <p className="mt-1 text-xs text-red-500">{errores.motivo_alta}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Indicaciones de alta *</label>
            <textarea
              name="indicaciones_alta"
              value={formAlta.indicaciones_alta}
              onChange={handleChange}
              rows="4"
              placeholder="Medicacion, controles, cuidados, signos de alarma y seguimiento."
              className={`w-full rounded-lg border px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errores.indicaciones_alta ? 'border-red-400' : 'border-slate-300'}`}
            />
            {errores.indicaciones_alta && <p className="mt-1 text-xs text-red-500">{errores.indicaciones_alta}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalAlta(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <IconoCheck className="w-4 h-4" />
              {enviando ? 'Registrando...' : 'Dar de alta'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalDetalle} alCerrar={() => setModalDetalle(false)} titulo="Detalle de hospitalizacion" ancho="max-w-3xl">
        {seleccionada && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p><span className="font-semibold text-slate-700">ID:</span> #{seleccionada.id_hospitalizacion}</p>
              <p><span className="font-semibold text-slate-700">Estado:</span> <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${estadoClase(seleccionada.estado)}`}>{seleccionada.estado || 'activa'}</span></p>
              <p><span className="font-semibold text-slate-700">Paciente:</span> {seleccionada.paciente_nombre}</p>
              <p><span className="font-semibold text-slate-700">Medico:</span> Dr(a). {seleccionada.medico_nombre}</p>
              <p><span className="font-semibold text-slate-700">Consulta origen:</span> #{seleccionada.id_consulta || '-'}</p>
              <p><span className="font-semibold text-slate-700">Ingreso:</span> {fecha(seleccionada.fecha_ingreso)}</p>
              <p><span className="font-semibold text-slate-700">Dias estimados:</span> {seleccionada.tiempo_internacion_dias || '-'}</p>
              <p><span className="font-semibold text-slate-700">Alta estimada:</span> {seleccionada.fecha_estimada_alta || '-'}</p>
              <p><span className="font-semibold text-slate-700">Sala / unidad:</span> {seleccionada.sala || '-'}</p>
              <p><span className="font-semibold text-slate-700">Cama:</span> {seleccionada.cama || '-'}</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">Detalle clinico de ingreso</h3>
              <pre className="max-h-72 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                {seleccionada.motivo_ingreso || 'Sin detalle registrado.'}
              </pre>
            </div>

            {seleccionada.estado === 'alta' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p><span className="font-semibold">Fecha de alta:</span> {fecha(seleccionada.fecha_alta)}</p>
                <p><span className="font-semibold">Motivo de alta:</span> {seleccionada.motivo_alta || '-'}</p>
                <div className="md:col-span-2">
                  <p className="font-semibold">Indicaciones de alta:</p>
                  <p className="mt-1 whitespace-pre-wrap">{seleccionada.indicaciones_alta || '-'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {seleccionada.estado === 'activa' && (
                <button
                  type="button"
                  onClick={() => {
                    setModalDetalle(false);
                    abrirAlta(seleccionada);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
                >
                  <IconoCheck className="w-4 h-4" />
                  Dar de alta
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalDetalle(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
