import { useEffect, useState } from 'react';
import {
  IconoArchiveBox,
  IconoCheck,
  IconoClipboardDocument,
  IconoRefresh,
  IconoStethoscope,
} from '../../components/Iconos.jsx';

function moneda(valor) {
  return `Bs. ${Number(valor || 0).toFixed(2)}`;
}

export default function DespachoRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [recetaAConfirmar, setRecetaAConfirmar] = useState(null);
  const [facturaForm, setFacturaForm] = useState({ metodo_pago: 'efectivo', razon_social: '', nit_ci: '' });
  const [despachando, setDespachando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [ultimaFactura, setUltimaFactura] = useState(null);

  const total = Number(recetaAConfirmar?.total || 0);
  const subtotal = total / 1.13;
  const iva = total - subtotal;

  async function cargarRecetas() {
    setCargando(true);
    try {
      const res = await fetch('/api/farmacia/recetas-pendientes');
      const data = await res.json();
      if (data.ok) setRecetas(data.recetas || []);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al cargar recetas.' });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarRecetas();
  }, []);

  function abrirConfirmacion(receta) {
    setRecetaAConfirmar(receta);
    setErrorModal(null);
    setUltimaFactura(null);
    setFacturaForm({
      metodo_pago: 'efectivo',
      razon_social: receta.paciente || '',
      nit_ci: receta.ci_paciente || '',
    });
  }

  async function descargarFacturaPdf(url, nombreArchivo = 'factura.pdf') {
    const res = await fetch(url);
    if (!res.ok) {
      let mensaje = 'La factura fue creada, pero no se pudo generar el PDF automaticamente.';
      try {
        const data = await res.json();
        mensaje = data.errores?.general || data.mensaje || mensaje;
      } catch {
        // La respuesta puede venir como HTML/texto si el servidor fallo antes de emitir JSON.
      }
      throw new Error(mensaje);
    }

    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  }

  async function confirmarDespacho() {
    if (!recetaAConfirmar) return;

    setDespachando(true);
    setMensaje(null);
    setErrorModal(null);

    try {
      const res = await fetch('/api/farmacia/despachar-receta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_receta: recetaAConfirmar.id_receta,
          metodo_pago: facturaForm.metodo_pago,
          razon_social: facturaForm.razon_social || recetaAConfirmar.paciente,
          nit_ci: facturaForm.nit_ci || recetaAConfirmar.ci_paciente || '0',
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorModal(data.mensaje || 'No se pudo despachar la receta.');
        return;
      }

      const facturaUrl = data.factura_pdf_url || (data.id_pago ? `/api/pagos/factura?id_pago=${data.id_pago}` : null);
      const nombreFactura = data.factura?.numero_factura
        ? `factura_${data.factura.numero_factura}.pdf`
        : `factura_pago_${data.id_pago}.pdf`;

      let advertenciaPdf = null;
      if (facturaUrl) {
        setUltimaFactura({
          url: facturaUrl,
          nombre: data.factura?.numero_factura || `Pago #${data.id_pago}`,
        });
        try {
          await descargarFacturaPdf(facturaUrl, nombreFactura);
        } catch (error) {
          advertenciaPdf = error.message || 'La factura fue creada, pero no se pudo descargar el PDF automaticamente.';
        }
      }

      setRecetas((prev) => prev.filter((r) => r.id_receta !== recetaAConfirmar.id_receta));
      setMensaje({
        tipo: advertenciaPdf ? 'error' : 'exito',
        texto: advertenciaPdf
          ? `Receta despachada y factura creada por ${moneda(data.monto)}. ${advertenciaPdf}`
          : `Receta de ${recetaAConfirmar.paciente} despachada, facturada y con PDF generado por ${moneda(data.monto)}.`,
        facturaUrl,
        facturaNombre: data.factura?.numero_factura || `Pago #${data.id_pago}`,
      });
      setRecetaAConfirmar(null);
    } catch (error) {
      setErrorModal(error.message || 'Error al conectar con el servidor.');
    } finally {
      setDespachando(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IconoClipboardDocument className="w-5 h-5" />
            </span>
            Despacho de Recetas
          </h1>
          <p className="text-slate-500 mt-2">Entrega medicamentos, cobra y emite factura con IVA.</p>
        </div>
        <button
          onClick={cargarRecetas}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition flex items-center gap-2"
        >
          <IconoRefresh className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg font-medium shadow-sm border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          <div>{mensaje.texto}</div>
          {mensaje.facturaUrl && (
            <a
              href={mensaje.facturaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex rounded-lg bg-white/80 px-3 py-2 text-sm font-bold underline"
            >
              Abrir factura {mensaje.facturaNombre}
            </a>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50/50 min-h-[400px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Buscando recetas...</p>
            </div>
          ) : recetas.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <IconoCheck className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-700 text-2xl">Todo al dia</p>
              <p className="text-slate-500 mt-2 text-lg">No hay recetas pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recetas.map((receta) => (
                <div key={receta.id_receta} className="flex flex-col sm:flex-row items-start justify-between p-5 border border-slate-200 rounded-xl hover:shadow-md hover:border-emerald-300 transition-all bg-white gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3 mb-1">
                      <h3 className="font-bold text-slate-800 text-xl">{receta.paciente}</h3>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                        CI: {receta.ci_paciente}
                      </span>
                    </div>

                    <div className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                      <IconoStethoscope className="w-4 h-4 text-blue-600" />
                      <span>Dr(a). {receta.medico}</span>
                      <span className="text-slate-300">-</span>
                      <span>{receta.especialidad}</span>
                    </div>

                    <div className="space-y-2">
                      {(receta.detalles || []).map((det, idx) => (
                        <div key={idx} className="text-sm font-medium text-emerald-800 bg-emerald-50 inline-block px-3 py-2 rounded-md border border-emerald-200 mr-2 mb-1">
                          <div className="flex items-center gap-2">
                            <IconoArchiveBox className="w-4 h-4 shrink-0" />
                            <span className="font-bold">{det.cantidad}x {det.nombre}</span>
                            <span className="text-xs bg-white border border-emerald-100 px-2 py-0.5 rounded">{moneda(det.subtotal)}</span>
                          </div>
                          <div className="mt-1 ml-6 text-xs text-slate-600">
                            <span className="font-semibold">Dosis:</span> {det.dosis} <span className="text-slate-400">-</span>{' '}
                            <span className="font-semibold">Frecuencia:</span> {det.frecuencia} <span className="text-slate-400">-</span>{' '}
                            <span className="font-semibold">Duracion:</span> {det.duracion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    <p className="text-xs text-slate-400 font-medium text-right">
                      Emitida: {new Date(receta.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <p className="text-xl font-bold text-slate-800">{moneda(receta.total)}</p>
                    <button
                      onClick={() => abrirConfirmacion(receta)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition"
                    >
                      Cobrar y Despachar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {recetaAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-emerald-600 p-4 text-center text-white">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <IconoClipboardDocument className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold">Cobro, despacho y factura</h3>
            </div>

            <div className="p-6 space-y-5">
              {errorModal && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorModal}
                  {ultimaFactura?.url && (
                    <a
                      href={ultimaFactura.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block w-fit rounded-lg bg-white px-3 py-2 text-red-700 underline"
                    >
                      Abrir factura {ultimaFactura.nombre}
                    </a>
                  )}
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Paciente</span>
                  <span className="font-bold text-slate-800 text-right">{recetaAConfirmar.paciente}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Medicamentos</span>
                  <div className="bg-white border border-emerald-100 rounded-lg divide-y divide-slate-100">
                    {(recetaAConfirmar.detalles || []).map((det, idx) => (
                      <div key={idx} className="flex justify-between gap-3 p-2 text-sm">
                        <span className="font-medium text-slate-700">{det.cantidad}x {det.nombre}</span>
                        <span className="font-bold text-emerald-700">{moneda(det.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Metodo de pago</label>
                  <select
                    value={facturaForm.metodo_pago}
                    onChange={(e) => setFacturaForm((p) => ({ ...p, metodo_pago: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razon social</label>
                  <input
                    value={facturaForm.razon_social}
                    onChange={(e) => setFacturaForm((p) => ({ ...p, razon_social: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIT / CI</label>
                  <input
                    value={facturaForm.nit_ci}
                    onChange={(e) => setFacturaForm((p) => ({ ...p, nit_ci: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>{moneda(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>IVA 13%</span>
                  <span>{moneda(iva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-white/15 pt-2">
                  <span>Total</span>
                  <span>{moneda(total)}</span>
                </div>
              </div>

              {total <= 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Esta receta tiene total Bs. 0.00. Revisa que los medicamentos tengan precio registrado antes de facturar.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setRecetaAConfirmar(null)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDespacho}
                  disabled={despachando}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50"
                >
                  {despachando ? 'Procesando...' : 'Entregar y facturar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
