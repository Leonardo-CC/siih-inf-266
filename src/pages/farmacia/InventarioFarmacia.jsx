// src/pages/farmacia/InventarioFarmacia.jsx
// src/pages/farmacia/InventarioFarmacia.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconoArchiveBox, IconoRefresh, IconoPlus, IconoCheck, IconoExclamation, IconoClock, IconoEdit } from '../../components/Iconos.jsx';
import Modal from '../../components/Modal.jsx';

export default function InventarioFarmacia() {
  const [cargando, setCargando] = useState(true);
  const [medicamentos, setMedicamentos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  const [filasExpandidas, setFilasExpandidas] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [procesandoFormulario, setProcesandoFormulario] = useState(false);

  const [mostrarModalStock, setMostrarModalStock] = useState(false);
  const [medStock, setMedStock] = useState({ id: null, nombre: '', stock_minimo: '', stock_maximo: '' });
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [errorStock, setErrorStock] = useState('');

  const [formulario, setFormulario] = useState({
    id_medicamento: '',
    id_proveedor: '',
    numero_lote: '',
    cantidad: '',
    fecha_vencimiento: ''
  });

  const cargarInventario = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/farmacia/inventario-datos');
      const data = await res.json();
      if (data.ok) {
        setMedicamentos(data.medicamentos);
        setProveedores(data.proveedores);
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const guardarIngreso = async (e) => {
    e.preventDefault();
    setProcesandoFormulario(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const res = await fetch('/api/farmacia/ingreso-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formulario,
          cantidad: parseInt(formulario.cantidad)
        }),
      });

      const data = await res.json();

      if (data.ok) {
        await cargarInventario(); 
        setMostrarModal(false);
        setFormulario({ id_medicamento: '', id_proveedor: '', numero_lote: '', cantidad: '', fecha_vencimiento: '' });
      } else {
        setMensaje({ texto: data.mensaje || 'Error al guardar el lote', tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setProcesandoFormulario(false);
    }
  };

  const toggleFila = (id_medicamento) => {
    setFilasExpandidas(prev => ({
      ...prev,
      [id_medicamento]: !prev[id_medicamento]
    }));
  };

  const abrirStock = (med) => {
    setMedStock({ id: med.id_medicamento, nombre: med.nombre, stock_minimo: med.stock_minimo ?? '', stock_maximo: med.stock_maximo ?? '' });
    setErrorStock('');
    setMostrarModalStock(true);
  };

  const manejarCambioStock = (e) => {
    setMedStock({ ...medStock, [e.target.name]: e.target.value });
  };

  const guardarStock = async (e) => {
    e.preventDefault();
    setGuardandoStock(true);
    setErrorStock('');
    try {
      const res = await fetch(`/api/farmacia/stock?id=${medStock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_minimo: medStock.stock_minimo, stock_maximo: medStock.stock_maximo }),
      });
      const data = await res.json();
      if (data.ok) {
        await cargarInventario();
        setMostrarModalStock(false);
      } else {
        setErrorStock(data.mensaje || 'No se pudo actualizar el stock.');
      }
    } catch {
      setErrorStock('Error de conexión con el servidor.');
    } finally {
      setGuardandoStock(false);
    }
  };

  const analizarVencimiento = (fechaStr) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaStr + 'T00:00:00'); 
    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return { texto: 'Vencido', color: 'bg-red-100 text-red-800 border-red-200' };
    if (diasRestantes <= 30) return { texto: `Vence en ${diasRestantes} días`, color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { texto: 'Vigente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const obtenerAlertaGlobalVencimiento = (lotes) => {
    if (!lotes || lotes.length === 0) return null;

    let tieneVencidos = false;
    let diasMinimosParaVencer = Infinity;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    lotes.forEach(lote => {
      if (lote.cantidad_actual > 0) {
        const vencimiento = new Date(lote.fecha_vencimiento + 'T00:00:00');
        const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        if (dias < 0) tieneVencidos = true;
        else if (dias <= 30 && dias < diasMinimosParaVencer) diasMinimosParaVencer = dias;
      }
    });

    if (tieneVencidos) return { texto: 'Lote Vencido', color: 'bg-red-100 text-red-800 border-red-200' };
    if (diasMinimosParaVencer !== Infinity) return { texto: `Vence en ${diasMinimosParaVencer}d`, color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return null;
  };

  // ==========================================
  // LÓGICA NUEVA: CÁLCULO DEL RESUMEN DE ALERTAS
  // ==========================================
  const alertas = { bajoStock: [], porVencer: [] };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  medicamentos.forEach(med => {
    // Buscar problemas de Stock
    if (med.stock_actual <= med.stock_minimo) {
      alertas.bajoStock.push(med);
    }
    // Buscar problemas de Vencimiento
    if (med.lote_medicamento) {
      med.lote_medicamento.forEach(lote => {
        if (lote.cantidad_actual > 0) {
          const vencimiento = new Date(lote.fecha_vencimiento + 'T00:00:00');
          const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
          if (dias <= 30) {
            alertas.porVencer.push(lote);
          }
        }
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IconoArchiveBox className="w-5 h-5" />
            </span>
            Gestion de Inventario
          </h1>
          <p className="text-slate-500 text-sm mt-1">Controla el stock y verifica las fechas de caducidad de cada lote.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={cargarInventario}
            disabled={cargando}
            className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <IconoRefresh className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={() => setMostrarModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <IconoPlus className="w-4 h-4" />
            Ingresar Lote
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* NUEVO BANNER DE ALERTAS (Solo aparece si hay problemas) */}
      {/* ========================================== */}
      {(alertas.bajoStock.length > 0 || alertas.porVencer.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Alerta de Stock (Roja) */}
          {alertas.bajoStock.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
              <div className="text-red-500 p-1 bg-red-100 rounded-lg">
                <IconoExclamation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-800">Atención: Bajo Stock</h3>
                <p className="text-sm text-red-700 mt-1">
                  Tienes <span className="font-bold">{alertas.bajoStock.length}</span> medicamento(s) por debajo del mínimo requerido o agotados.
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Vencimiento (Naranja) */}
          {alertas.porVencer.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
              <div className="text-amber-500 p-1 bg-amber-100 rounded-lg">
                <IconoClock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800">Lotes Críticos</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Hay <span className="font-bold">{alertas.porVencer.length}</span> lote(s) que están vencidos o vencerán en los próximos 30 días.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Medicamento</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Mínimo Requerido</th>
                <th className="px-6 py-4 text-center">Máximo</th>
                <th className="px-6 py-4 text-center">Estado y Alertas</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {medicamentos.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No hay medicamentos registrados.</td></tr>
              ) : (
                medicamentos.map(med => {
                  const enAlertaStock = med.stock_actual <= med.stock_minimo;
                  const alertaVencimiento = obtenerAlertaGlobalVencimiento(med.lote_medicamento);
                  const expandido = filasExpandidas[med.id_medicamento];
                  const todoOk = !enAlertaStock && !alertaVencimiento;
                  
                  return (
                    <React.Fragment key={med.id_medicamento}>
                      {/* FILA PRINCIPAL DEL MEDICAMENTO */}
                      <tr 
                        onClick={() => toggleFila(med.id_medicamento)} 
                        className={`cursor-pointer transition-colors ${expandido ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-6 py-4 text-center text-slate-400">
                           <svg className={`inline-block transition-transform duration-200 w-4 h-4 ${expandido ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                           </svg>
                         </td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-base">{med.nombre}</td>
                        <td className="px-6 py-4 text-center font-bold text-lg">{med.stock_actual}</td>
                         <td className="px-6 py-4 text-center text-slate-500">{med.stock_minimo}</td>
                         <td className="px-6 py-4 text-center text-slate-500">{med.stock_maximo ?? '—'}</td>
                         
                          {/* COLUMNA DE ALERTAS APILADAS */}
                         <td className="px-6 py-4">
                           <div className="flex flex-col items-center gap-1.5">
                             {todoOk ? (
                               <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                 <IconoCheck className="w-3.5 h-3.5" />
                                 Todo en orden
                               </span>
                             ) : (
                               <>
                                 {enAlertaStock && (
                                   <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 w-full text-center flex items-center justify-center gap-1">
                                     <IconoExclamation className="w-3.5 h-3.5" />
                                     Bajo Stock
                                   </span>
                                 )}
                                 {alertaVencimiento && (
                                   <span className={`${alertaVencimiento.color} px-3 py-1 rounded-full text-xs font-bold border w-full text-center shadow-sm`}>
                                     {alertaVencimiento.texto}
                                   </span>
                                 )}
                               </>
                             )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); abrirStock(med); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar stock mínimo/máximo"
                            >
                              <IconoEdit className="w-4 h-4" />
                            </button>
                          </td>
                       </tr>

                      {/* SUB-FILA DESPLEGABLE CON LOS LOTES */}
                      {expandido && (
                        <tr>
                           <td colSpan="7" className="p-0 border-b-0">
                            <div className="bg-slate-50 p-6 border-y border-slate-200 shadow-inner">
                               <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                 <IconoArchiveBox className="w-4 h-4 text-slate-500" />
                                 Historial de Lotes: {med.nombre}
                               </h4>
                              
                              {med.lote_medicamento && med.lote_medicamento.length > 0 ? (
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-600 font-medium">
                                      <tr>
                                        <th className="px-4 py-2">Nro. Lote</th>
                                        <th className="px-4 py-2 text-center">Cant. Disponible</th>
                                        <th className="px-4 py-2 text-center">Fecha Ingreso</th>
                                        <th className="px-4 py-2 text-center">Vencimiento</th>
                                        <th className="px-4 py-2 text-center">Alerta Individual</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {[...med.lote_medicamento]
                                        .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
                                        .map(lote => {
                                          const estadoIndividual = analizarVencimiento(lote.fecha_vencimiento);
                                          return (
                                            <tr key={lote.id_lote} className="hover:bg-slate-50">
                                              <td className="px-4 py-3 font-mono text-xs text-slate-500">#{lote.numero_lote}</td>
                                              <td className="px-4 py-3 text-center">
                                                {lote.cantidad_actual === 0 ? (
                                                  <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded text-xs border border-red-100">
                                                    Agotado
                                                  </span>
                                                ) : (
                                                  <span className="font-bold text-slate-800">
                                                    {lote.cantidad_actual} <span className="text-slate-400 font-normal text-xs">/ {lote.cantidad_inicial}</span>
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-center text-slate-500">
                                                {new Date(lote.fecha_ingreso).toLocaleDateString()}
                                              </td>
                                              <td className="px-4 py-3 text-center font-medium text-slate-700">
                                                {new Date(lote.fecha_vencimiento + 'T00:00:00').toLocaleDateString()}
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${estadoIndividual.color}`}>
                                                  {estadoIndividual.texto}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-6 bg-white rounded-lg border border-slate-200 text-slate-500 italic">
                                  No hay registros de lotes para este medicamento.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE INGRESO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-emerald-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">Registrar Ingreso de Lote</h2>
              <button onClick={() => setMostrarModal(false)} className="text-white hover:text-emerald-200 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              {mensaje.texto && (
                <div className="p-3 mb-4 rounded bg-red-50 text-red-800 border border-red-200 text-sm">
                  {mensaje.texto}
                </div>
              )}

              <form onSubmit={guardarIngreso} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medicamento</label>
                    <select name="id_medicamento" value={formulario.id_medicamento} onChange={manejarCambio} required className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                      <option value="">Seleccionar...</option>
                      {medicamentos.map(m => <option key={m.id_medicamento} value={m.id_medicamento}>{m.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                    <select name="id_proveedor" value={formulario.id_proveedor} onChange={manejarCambio} required className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                      <option value="">Seleccionar...</option>
                      {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número de Lote</label>
                    <input type="text" name="numero_lote" value={formulario.numero_lote} onChange={manejarCambio} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Ej. L-10293" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad a Ingresar</label>
                    <input type="number" name="cantidad" value={formulario.cantidad} onChange={manejarCambio} required min="1" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="0" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
                    <input type="date" name="fecha_vencimiento" value={formulario.fecha_vencimiento} onChange={manejarCambio} required className="w-full md:w-1/2 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                </div>

                <div className="pt-6 mt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition">
                    Cancelar
                  </button>
                  <button type="submit" disabled={procesandoFormulario} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50">
                    {procesandoFormulario ? 'Guardando...' : 'Confirmar Ingreso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE STOCK (mínimo/máximo) */}
      <Modal abierto={mostrarModalStock} alCerrar={() => setMostrarModalStock(false)} titulo={`Stock: ${medStock.nombre}`}>
        <form onSubmit={guardarStock} className="space-y-5">
          {errorStock && (
            <div className="p-3 rounded bg-red-50 text-red-800 border border-red-200 text-sm">{errorStock}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
            <input
              type="number" min="0" name="stock_minimo" value={medStock.stock_minimo}
              onChange={manejarCambioStock}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock máximo</label>
            <input
              type="number" min="0" name="stock_maximo" value={medStock.stock_maximo}
              onChange={manejarCambioStock}
              placeholder="Dejar vacío si no aplica"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setMostrarModalStock(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={guardandoStock} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition disabled:opacity-50">
              {guardandoStock ? 'Guardando...' : 'Guardar stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}