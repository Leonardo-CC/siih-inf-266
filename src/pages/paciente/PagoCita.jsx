// src/pages/paciente/PagoCita.jsx
import { useEffect, useState } from 'react';

/**
 * CAPA DE PRESENTACIÓN
 * Componente para pagar una cita o validar seguro
 * 
 * Flujo:
 * 1. Valida vigencia de seguro
 * 2. Obtiene monto a pagar (según especialidad del médico)
 * 3. Permite elegir método de pago (Físico, QR, Tarjeta)
 * 4. Procesa el pago
 * 5. Genera comprobante
 * 
 * IMPORTANTE: Este componente se muestra DESPUÉS de solicitar una cita.
 */
export default function PagoCita({ idPaciente, idCita, idMedico }) {
  // Estados principales
  const [etapa, setEtapa] = useState('validacion'); // 'validacion', 'pago', 'comprobante', 'error'
  
  // Validación de seguro
  const [seguroValidacion, setSeguroValidacion] = useState(null);
  const [cargandoSeguro, setCargandoSeguro] = useState(true);
  const [errorSeguro, setErrorSeguro] = useState(null);

  // Datos de pago
  const [monto, setMonto] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [cargandoMonto, setCargandoMonto] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);

  // Resultado de pago
  const [resultadoPago, setResultadoPago] = useState(null);
  const [errorPago, setErrorPago] = useState(null);
  
  // Polling para validación de pago en 2 fases
  const [pollingActivo, setPollingActivo] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState(null);

  // Cargar validación de seguro al montar
  useEffect(() => {
    async function validarSeguro() {
      if (!idPaciente) {
        setErrorSeguro('No se identificó al paciente');
        setCargandoSeguro(false);
        setEtapa('error');
        return;
      }

      try {
        const res = await fetch(`/api/pagos/validar-seguro?id_paciente=${idPaciente}`);
        const data = await res.json();
        
        setSeguroValidacion(data);
        
        // Si el seguro no es vigente, mostrar alerta pero permitir continuar
        if (!data.vigente) {
          setErrorSeguro(`⚠️ Seguro no vigente: ${data.razon}`);
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

  // Cargar monto de la cita
  useEffect(() => {
    async function cargarMonto() {
      if (!idMedico) {
        setErrorSeguro('No se identificó al médico');
        setCargandoMonto(false);
        return;
      }

      try {
        const res = await fetch(`/api/pagos/monto-cita?id_medico=${idMedico}`);
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

  // Procesar pago (inicia validación 2-fase)
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
        }),
      });

      const data = await res.json();

      if (data.exitoso) {
        // Pago registrado en estado "pendiente_validacion"
        setResultadoPago(data);
        setEtapa('comprobante');
        setMensajeValidacion('Validando pago... (esto puede tomar 1-3 segundos)');
        setPollingActivo(true);
        
        // NO registrar seguro aquí - lo hace el endpoint completar-pago-y-seguro
        // Este es solo para flujo de pago directo
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

  // Polling para verificar estado del pago (validación 2-fase)
  useEffect(() => {
    if (!pollingActivo || !resultadoPago?.id_pago) return;

    console.log('[PagoCita] Iniciando polling para id_pago:', resultadoPago.id_pago);

    let intentos = 0;
    const maxIntentos = 30; // máximo 30 segundos

    const interval = setInterval(async () => {
      intentos++;
      console.log(`[PagoCita] Polling intento ${intentos}/${maxIntentos}`);

      try {
        const res = await fetch(`/api/pagos/estado-pago?id_pago=${resultadoPago.id_pago}`);
        const data = await res.json();

        if (data.ok && data.estado_pago) {
          console.log('[PagoCita] Estado del pago:', data.estado_pago);

          // Actualizar estado del pago
          setResultadoPago((prev) => ({
            ...prev,
            estado: data.estado_pago,
            razon_rechazo: data.razon_rechazo,
          }));

          // Si está aprobado → mostrar comprobante
          if (data.estado_pago === 'aprobado') {
            console.log('[PagoCita] Pago aprobado!');
            setMensajeValidacion('✓ Pago validado exitosamente');
            clearInterval(interval);
            setPollingActivo(false);

            // Registrar validación de seguro (si existe seguro vigente)
            if (seguroValidacion?.vigente) {
              await fetch('/api/pagos/registrar-validacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_cita: parseInt(idCita),
                  id_paciente: parseInt(idPaciente),
                  tipo_seguro: seguroValidacion.tipo_seguro,
                  numero_seguro: seguroValidacion.numero_seguro,
                  vigencia: seguroValidacion.fecha_vigencia,
                  estado_validacion: 'vigente',
                }),
              });
            }
          }

          // Si está rechazado → mostrar error
          if (data.estado_pago === 'rechazado') {
            console.log('[PagoCita] Pago rechazado:', data.razon_rechazo);
            setMensajeValidacion(null);
            setErrorPago(`Pago rechazado: ${data.razon_rechazo || 'Sin especificar'}`);
            clearInterval(interval);
            setPollingActivo(false);
            setEtapa('error');
          }
        }
      } catch (err) {
        console.error('[PagoCita] Error en polling:', err.message);
      }

      // Si se agotaron los intentos, detener
      if (intentos >= maxIntentos) {
        console.warn('[PagoCita] Polling expirado después de 30 segundos');
        clearInterval(interval);
        setPollingActivo(false);
        setErrorPago('Timeout validando pago. Intenta nuevamente o contacta soporte.');
        setEtapa('error');
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [pollingActivo, resultadoPago?.id_pago, idCita, idPaciente, seguroValidacion]);

  // ===== RENDERIZADO =====

  if (cargandoSeguro || cargandoMonto) {
    return (
      <div className="siih-container">
        <div className="siih-header">
          <h1>Procesando información...</h1>
          <p>Por favor espera mientras validamos tu seguro y calculamos el monto.</p>
        </div>
        <div className="siih-body">
          <div className="siih-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="siih-container">
      {/* ENCABEZADO */}
      <div className="siih-header">
        <h1>Pago y Validación de Seguro</h1>
        <p>Completa el pago de tu consulta o valida tu cobertura de seguro.</p>
      </div>

      <div className="siih-body">
        {/* ===== ETAPA 1: VALIDACIÓN DE SEGURO ===== */}
        {etapa === 'validacion' && (
          <>
            <div className="siih-card">
              <h2>Datos de Seguro</h2>
              
              {errorSeguro && (
                <div className="siih-alert siih-alert-warning">{errorSeguro}</div>
              )}

              {seguroValidacion?.tiene_seguro ? (
                <div className="siih-info-block">
                  <p>
                    <strong>Tipo de Seguro:</strong> {seguroValidacion.tipo_seguro}
                  </p>
                  <p>
                    <strong>Número:</strong> {seguroValidacion.numero_seguro}
                  </p>
                  {seguroValidacion.fecha_vigencia && (
                    <p>
                      <strong>Vigencia:</strong> {new Date(seguroValidacion.fecha_vigencia).toLocaleDateString('es-BO')}
                    </p>
                  )}
                  <p>
                    <strong>Estado:</strong>
                    <span className={seguroValidacion.vigente ? 'siih-badge-success' : 'siih-badge-error'}>
                      {seguroValidacion.vigente ? '✓ VIGENTE' : '✗ VENCIDO'}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="siih-alert siih-alert-info">
                  No tienes seguro registrado o la información está incompleta. Continúa con el pago directo.
                </div>
              )}
            </div>

            <div className="siih-card">
              <h2>Información de Pago</h2>
              
              <div className="siih-info-block">
                <p>
                  <strong>Monto a Pagar:</strong>
                  <span className="siih-monto">Bs. {monto?.toFixed(2)}</span>
                </p>
              </div>

              <div className="siih-field">
                <label>Método de Pago *</label>
                <div className="siih-payment-methods">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('efectivo')}
                    className={`siih-method-btn ${metodoPago === 'efectivo' ? 'siih-method-selected' : ''}`}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('qr')}
                    className={`siih-method-btn ${metodoPago === 'qr' ? 'siih-method-selected' : ''}`}
                  >
                    📱 QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`siih-method-btn ${metodoPago === 'tarjeta' ? 'siih-method-selected' : ''}`}
                  >
                    💳 Tarjeta
                  </button>
                </div>
              </div>

              <div className="siih-alert siih-alert-info">
                <strong>Nota:</strong> El pago es requerido para confirmar tu cita. Si tu seguro está vigente, 
                también podría cubrir parte o la totalidad del costo.
              </div>

              <button
                type="button"
                onClick={handleProcesarPago}
                disabled={procesandoPago}
                className="siih-button siih-button-primary"
              >
                {procesandoPago ? 'Procesando...' : `Pagar Bs. ${monto?.toFixed(2)}`}
              </button>
            </div>
          </>
        )}

        {/* ===== ETAPA 2: COMPROBANTE ===== */}
        {etapa === 'comprobante' && resultadoPago && (
          <>
            {pollingActivo && mensajeValidacion && (
              <div className="siih-alert siih-alert-info">
                ⏳ {mensajeValidacion}
              </div>
            )}

            {!pollingActivo && resultadoPago.estado === 'aprobado' && (
              <div className="siih-alert siih-alert-success">
                ✓ Pago procesado exitosamente
              </div>
            )}

            <div className="siih-card">
              <h2>Comprobante de Pago</h2>
              
              <pre className="siih-comprobante">
                {resultadoPago.comprobante}
              </pre>

              <div className="siih-info-block">
                <p>
                  <strong>Referencia:</strong> {resultadoPago.referencia_txn}
                </p>
                <p>
                  <strong>Método:</strong> {resultadoPago.referencia_txn?.split('-')[0] === 'EFE' ? 'Efectivo' : 
                                          resultadoPago.referencia_txn?.split('-')[0] === 'QR' ? 'QR' : 'Tarjeta'}
                </p>
              </div>

              <div className="siih-alert siih-alert-success">
                Tu cita ha sido confirmada. Recibirás una confirmación por correo electrónico.
              </div>

              <button
                type="button"
                onClick={() => window.location.href = '/paciente/mis-citas'}
                className="siih-button siih-button-primary"
              >
                Ver mis citas
              </button>
            </div>
          </>
        )}

        {/* ===== ETAPA 3: ERROR ===== */}
        {etapa === 'error' && (
          <>
            <div className="siih-alert siih-alert-error">
              {errorPago || errorSeguro || 'Ocurrió un error procesando tu solicitud'}
            </div>

            <div className="siih-card">
              <h2>¿Qué hacer ahora?</h2>
              <ul>
                <li>Verifica que tu información sea correcta</li>
                <li>Intenta con otro método de pago</li>
                <li>Contacta con soporte si el problema persiste</li>
              </ul>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="siih-button siih-button-secondary"
              >
                Reintentar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .siih-card {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .siih-info-block {
          background: white;
          border-left: 4px solid #007bff;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }

        .siih-info-block p {
          margin: 8px 0;
          font-size: 14px;
        }

        .siih-monto {
          display: block;
          font-size: 24px;
          color: #28a745;
          font-weight: bold;
          margin-top: 10px;
        }

        .siih-payment-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
        }

        .siih-method-btn {
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .siih-method-btn:hover {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .siih-method-selected {
          border-color: #007bff;
          background: #007bff;
          color: white;
        }

        .siih-badge-success {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
          font-weight: bold;
        }

        .siih-badge-error {
          display: inline-block;
          background: #dc3545;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
          font-weight: bold;
        }

        .siih-comprobante {
          background: #f9f9f9;
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          overflow-x: auto;
          margin: 15px 0;
        }

        .siih-alert {
          padding: 12px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .siih-alert-success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .siih-alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .siih-alert-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .siih-alert-info {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
        }

        .siih-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-top: 10px;
          width: 100%;
        }

        .siih-button-primary {
          background: #007bff;
          color: white;
        }

        .siih-button-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .siih-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .siih-field label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .siih-loading {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          color: #333;
        }

        ul {
          margin: 15px 0;
          padding-left: 20px;
        }

        ul li {
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .siih-payment-methods {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
