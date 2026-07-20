import { useEffect, useState } from 'react';
import { IconoExclamation, IconoCheck, IconoX, IconoBanknotes, IconoBuildingBank, IconoCreditCard, IconoClock } from '../../components/Iconos.jsx';

export default function PagoCita({ idPaciente, idCita, idMedico }) {
  const [etapa, setEtapa] = useState('validacion');
  const [seguroValidacion, setSeguroValidacion] = useState(null);
  const [cargandoSeguro, setCargandoSeguro] = useState(true);
  const [errorSeguro, setErrorSeguro] = useState(null);
  const [monto, setMonto] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [datosFactura, setDatosFactura] = useState({ razon_social: '', nit_ci: '' });
  const [cargandoMonto, setCargandoMonto] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [resultadoPago, setResultadoPago] = useState(null);
  const [errorPago, setErrorPago] = useState(null);
  const [pollingActivo, setPollingActivo] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState(null);

  const subtotal = monto ? monto / 1.13 : 0;
  const iva = monto ? monto - subtotal : 0;

  function handleFacturaChange(e) {
    const { name, value } = e.target;
    setDatosFactura((prev) => ({ ...prev, [name]: value }));
  }

  function descargarFactura(idPago) {
    if (!idPago) return;
    window.location.href = `/api/pagos/factura?id_pago=${idPago}`;
  }

  useEffect(() => {
    async function validarSeguro() {
      if (!idPaciente) {
        setErrorSeguro('No se identifico al paciente');
        setCargandoSeguro(false);
        setEtapa('error');
        return;
      }

      try {
        const res = await fetch(`/api/pagos/validar-seguro?id_paciente=${idPaciente}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        setSeguroValidacion(data);
        if (!data.vigente) {
          setErrorSeguro(<><IconoExclamation className="w-4 h-4 inline mr-1" /> Seguro no vigente: {data.razon}</>);
        }
        setEtapa('validacion');
      } catch (error) {
        setErrorSeguro(`Error validando seguro: ${error.message}`);
        setEtapa('error');
      } finally {
        setCargandoSeguro(false);
      }
    }
    validarSeguro();
  }, [idPaciente]);

  useEffect(() => {
    async function cargarMonto() {
      if (!idMedico) {
        setErrorSeguro('No se identifico al medico');
        setCargandoMonto(false);
        return;
      }
      try {
        const res = await fetch(`/api/pagos/monto-cita?id_medico=${idMedico}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        if (data.monto) {
          setMonto(data.monto);
        } else {
          throw new Error('No se pudo obtener el monto');
        }
      } catch (error) {
        setErrorSeguro(`Error obteniendo monto: ${error.message}`);
      } finally {
        setCargandoMonto(false);
      }
    }
    cargarMonto();
  }, [idMedico]);

  async function handleProcesarPago() {
    if (!idCita || !idPaciente || !monto) {
      setErrorPago('Faltan datos para procesar el pago');
      return;
    }
    setProcesandoPago(true);
    setErrorPago(null);
    setMensajeValidacion('Procesando pago...');
    try {
      const res = await fetch('/api/pagos/procesar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cita: parseInt(idCita),
          id_paciente: parseInt(idPaciente),
          id_medico: parseInt(idMedico),
          monto,
          metodo_pago: metodoPago,
          razon_social: datosFactura.razon_social,
          nit_ci: datosFactura.nit_ci,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      if (data.exitoso) {
        setResultadoPago(data);
        setEtapa('comprobante');
        setMensajeValidacion('Validando pago... (esto puede tomar 1-3 segundos)');
        setPollingActivo(true);
      } else {
        setErrorPago(data.razon || 'Error procesando pago');
        setEtapa('error');
      }
    } catch (error) {
      setErrorPago(`Error: ${error.message}`);
      setEtapa('error');
    } finally {
      setProcesandoPago(false);
    }
  }

  useEffect(() => {
    if (!pollingActivo || !resultadoPago?.id_pago) return;
    let intentos = 0;
    const maxIntentos = 30;
    const interval = setInterval(async () => {
      intentos++;
      try {
        const res = await fetch(`/api/pagos/estado-pago?id_pago=${resultadoPago.id_pago}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        data.estado_pago = data.estado_pago || data.estado;
        if (data.ok && data.estado_pago) {
          setResultadoPago((prev) => ({
            ...prev,
            estado: data.estado_pago,
            metodo_pago: metodoPago,
          }));
          if (['efectivo', 'transferencia'].includes(metodoPago) && data.estado_pago === 'pendiente_validacion') {
            setMensajeValidacion(<><IconoCheck className="w-4 h-4 inline mr-1" /> Pago registrado. Un administrador validara la transaccion</>);
            clearInterval(interval);
            setPollingActivo(false);
            setEtapa('comprobante');
            return;
          }
          if (data.estado_pago === 'aprobado' || data.estado_pago === 'pagado') {
            setMensajeValidacion(<><IconoCheck className="w-4 h-4 inline mr-1" /> Pago validado exitosamente</>);
            clearInterval(interval);
            setPollingActivo(false);
            if (seguroValidacion?.vigente) {
              try {
                const resSeguro = await fetch('/api/pagos/registrar-validacion', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id_cita: parseInt(idCita),
                    id_paciente: parseInt(idPaciente),
                    id_tipo_seguro: seguroValidacion.id_tipo_seguro || null,
                    numero_seguro: seguroValidacion.numero_seguro,
                    vigencia: seguroValidacion.fecha_vigencia,
                    estado_validacion: 'vigente',
                  }),
                });
                if (!resSeguro.ok) {
                  console.error('[PagoCita] Error registrando validacion de seguro:', resSeguro.status);
                }
              } catch (errSeguro) {
                console.error('[PagoCita] Error en registrar-validacion:', errSeguro.message);
              }
            }
            setTimeout(() => {
              setEtapa('comprobante');
            }, 1500);
            return;
          }
          if (data.estado_pago === 'rechazado' || data.estado_pago === 'sin_pagar') {
            setMensajeValidacion(null);
            setErrorPago('Pago rechazado. Por favor intenta con otro metodo de pago.');
            clearInterval(interval);
            setPollingActivo(false);
            setEtapa('error');
          }
        }
      } catch (err) {
        console.error('[PagoCita] Error en polling:', err.message);
      }
      if (intentos >= maxIntentos) {
        clearInterval(interval);
        setPollingActivo(false);
        setErrorPago('Timeout validando pago. Intenta nuevamente o contacta soporte.');
        setEtapa('error');
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [pollingActivo, resultadoPago?.id_pago, idCita, idPaciente, seguroValidacion, metodoPago]);

  if (cargandoSeguro || cargandoMonto) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-center gap-3 py-10">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-600">Procesando informacion...</span>
          </div>
          <p className="text-center text-sm text-slate-500 mt-2">Por favor espera mientras validamos tu seguro y calculamos el monto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Pago y Validacion de Seguro</h1>
          <p className="text-blue-100 mt-1 text-sm">Completa el pago de tu consulta o valida tu cobertura de seguro.</p>
        </div>

        <div className="p-8 space-y-6">
          {etapa === 'validacion' && (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Datos de Seguro</h2>
                {errorSeguro && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                    {errorSeguro}
                  </div>
                )}
                {seguroValidacion?.tiene_seguro ? (
                  <div className="bg-white border-l-4 border-primary p-4 rounded-r-lg space-y-2">
                    <p className="text-sm"><strong>Tipo de Seguro:</strong> {seguroValidacion.tipo_seguro}</p>
                    <p className="text-sm"><strong>Numero:</strong> {seguroValidacion.numero_seguro}</p>
                    {seguroValidacion.fecha_vigencia && (
                      <p className="text-sm"><strong>Vigencia:</strong> {new Date(seguroValidacion.fecha_vigencia).toLocaleDateString('es-BO')}</p>
                    )}
                    <p className="text-sm">
                      <strong>Estado:</strong>
                      <span className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-bold ${seguroValidacion.vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {seguroValidacion.vigente ? <><IconoCheck className="w-3.5 h-3.5 inline mr-1" /> VIGENTE</> : <><IconoX className="w-3.5 h-3.5 inline mr-1" /> VENCIDO</>}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                    No tienes seguro registrado o la informacion esta incompleta. Continua con el pago directo.
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Informacion de Pago</h2>
                <div className="bg-white border-l-4 border-primary p-4 rounded-r-lg mb-4">
                  <p className="text-sm"><strong>Monto a Pagar:</strong></p>
                  <p className="text-3xl font-bold text-green-600 mt-1">Bs. {monto?.toFixed(2)}</p>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <p>Subtotal: Bs. {subtotal.toFixed(2)}</p>
                    <p>IVA 13%: Bs. {iva.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Metodo de Pago *</label>
                  <div className="grid grid-cols-3 gap-3">
                       {[
                         { value: 'efectivo', label: <><IconoBanknotes className="w-4 h-4 inline mr-1" /> Efectivo</> },
                         { value: 'transferencia', label: <><IconoBuildingBank className="w-4 h-4 inline mr-1" /> Transferencia</> },
                         { value: 'tarjeta', label: <><IconoCreditCard className="w-4 h-4 inline mr-1" /> Tarjeta</> },
                       ].map((metodo) => (
                      <button
                        key={metodo.value}
                        type="button"
                        onClick={() => setMetodoPago(metodo.value)}
                        className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition ${
                          metodoPago === metodo.value
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:bg-primary-light'
                        }`}
                      >
                        {metodo.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Razon social</label>
                    <input
                      name="razon_social"
                      value={datosFactura.razon_social}
                      onChange={handleFacturaChange}
                      placeholder="Consumidor Final"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">NIT / CI</label>
                    <input
                      name="nit_ci"
                      value={datosFactura.nit_ci}
                      onChange={handleFacturaChange}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm mt-4">
                  <strong>Nota:</strong> El pago es requerido para confirmar tu cita. Si tu seguro esta vigente, tambien podria cubrir parte o la totalidad del costo.
                </div>

                <button
                  type="button"
                  onClick={handleProcesarPago}
                  disabled={procesandoPago}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {procesandoPago ? 'Procesando...' : `Pagar Bs. ${monto?.toFixed(2)}`}
                </button>
              </div>
            </>
          )}

          {etapa === 'comprobante' && resultadoPago && (
            <>
                {pollingActivo && mensajeValidacion && (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                    <IconoClock className="w-4 h-4 inline mr-1" /> {mensajeValidacion}
                  </div>
                )}
              {!pollingActivo && (resultadoPago.estado === 'pagado' || resultadoPago.estado === 'aprobado' || ['efectivo', 'transferencia'].includes(resultadoPago.metodo_pago)) && (
                <div className={`p-4 rounded-lg text-sm ${['efectivo', 'transferencia'].includes(resultadoPago.metodo_pago) ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {['efectivo', 'transferencia'].includes(resultadoPago.metodo_pago)
                    ? <><IconoCheck className="w-4 h-4 inline mr-1" /> Pago registrado - esperando validacion manual</>
                    : <><IconoCheck className="w-4 h-4 inline mr-1" /> Pago validado exitosamente</>}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Comprobante de Pago</h2>
                <div className="bg-white border-l-4 border-primary p-4 rounded-r-lg space-y-2">
                  <p className="text-sm"><strong>Referencia:</strong> {resultadoPago.comprobante}</p>
                  <p className="text-sm"><strong>Monto:</strong> Bs. {resultadoPago.monto?.toFixed(2)}</p>
                  {resultadoPago.desglose_iva && (
                    <>
                      <p className="text-sm"><strong>Subtotal:</strong> Bs. {resultadoPago.desglose_iva.subtotal?.toFixed(2)}</p>
                      <p className="text-sm"><strong>IVA 13%:</strong> Bs. {resultadoPago.desglose_iva.iva?.toFixed(2)}</p>
                    </>
                  )}
                  {resultadoPago.factura?.numero_factura && (
                    <p className="text-sm"><strong>Factura:</strong> {resultadoPago.factura.numero_factura}</p>
                  )}
                  <p className="text-sm"><strong>Metodo:</strong> {resultadoPago.metodo_pago === 'efectivo' ? 'Efectivo' : resultadoPago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}</p>
                  <p className="text-sm"><strong>Estado:</strong> {resultadoPago.estado}</p>
                </div>
                {resultadoPago.advertencia_factura && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm mt-4">
                    Facturacion pendiente: {resultadoPago.advertencia_factura}
                  </div>
                )}

                {resultadoPago.metodo_pago === 'efectivo' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm mt-4">
                    <strong>Pago en Efectivo:</strong> Tu pago ha sido registrado. Un administrador verificara la entrega del efectivo y completara la transaccion.
                  </div>
                )}
                {resultadoPago.metodo_pago !== 'efectivo' && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mt-4">
                    Tu cita ha sido confirmada. Recibiras una confirmacion por correo electronico.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition mt-4"
                >
                  Volver al dashboard
                </button>
                {resultadoPago.factura && (
                  <button
                    type="button"
                    onClick={() => descargarFactura(resultadoPago.id_pago)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition mt-3"
                  >
                    Descargar factura PDF
                  </button>
                )}
              </div>
            </>
          )}

          {etapa === 'error' && (
            <>
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errorPago || errorSeguro || 'Ocurrio un error procesando tu solicitud'}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Que hacer ahora?</h2>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                  <li>Verifica que tu informacion sea correcta</li>
                  <li>Intenta con otro metodo de pago</li>
                  <li>Contacta con soporte si el problema persiste</li>
                </ul>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition mt-4"
                >
                  Reintentar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
