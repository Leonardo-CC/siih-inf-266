// src/pages/farmacia/DespachoRecetas.jsx
import { useEffect, useState } from 'react';
import {
  IconoClipboardDocument,
  IconoRefresh,
  IconoStethoscope,
  IconoArchiveBox,
  IconoCheck,
} from '../../components/Iconos.jsx';

export default function DespachoRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [recetaAConfirmar, setRecetaAConfirmar] = useState(null);

  const cargarRecetas = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/farmacia/recetas-pendientes');
      const data = await res.json();
      if (data.ok) setRecetas(data.recetas);
    } catch (error) {
      console.error('Error cargando recetas:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, []);

  const confirmarDespacho = async () => {
    if (!recetaAConfirmar) return;
    
    const id_receta = recetaAConfirmar.id_receta;
    setRecetaAConfirmar(null); 
    setMensaje(null);
    
    try {
      const res = await fetch('/api/farmacia/despachar-receta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_receta })
      });
      const data = await res.json();

      if (data.ok) {
        setRecetas(recetas.filter(r => r.id_receta !== id_receta));
        setMensaje({ tipo: 'exito', texto: `¡Receta de ${recetaAConfirmar.paciente} despachada con éxito!` });
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor.' });
    }
    
    setTimeout(() => setMensaje(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IconoClipboardDocument className="w-5 h-5" />
            </span>
            Despacho de Recetas
          </h1>
          <p className="text-slate-500 mt-2">Verifica la identidad del paciente y las indicaciones médicas antes de entregar.</p>
        </div>
        <button 
          onClick={cargarRecetas}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition flex items-center gap-2"
        >
          <IconoRefresh className="w-4 h-4" />
          Actualizar Lista
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg font-medium animate-fade-in shadow-sm border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 flex-1 bg-slate-50/50 min-h-[400px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Buscando recetas...</p>
            </div>
          ) : recetas.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <IconoCheck className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-700 text-2xl">Todo al día</p>
              <p className="text-slate-500 mt-2 text-lg">No hay pacientes esperando medicamentos en este momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recetas.map(receta => (
                <div key={receta.id_receta} className="flex flex-col sm:flex-row items-center justify-between p-5 border border-slate-200 rounded-xl hover:shadow-md hover:border-emerald-300 transition-all bg-white group gap-4">
                  
                  {/* Detalles del Paciente y Médico */}
                  <div className="w-full sm:w-auto text-left flex-1">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h3 className="font-bold text-slate-800 text-xl">{receta.paciente}</h3>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                        CI: {receta.ci_paciente}
                      </span>
                    </div>
                    
                     <div className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                       <span title="Medico Prescriptor" className="text-blue-600"><IconoStethoscope className="w-4 h-4 inline" /></span>
                       <span>Dr. {receta.medico}</span>
                       <span className="text-slate-300">•</span>
                       <span>{receta.especialidad}</span>
                     </div>

                       <div className="space-y-2">
                         {receta.detalles && receta.detalles.length > 0 ? (
                            receta.detalles.map((det, idx) => (
                              <div key={idx} className="text-sm font-medium text-emerald-800 bg-emerald-50 inline-block px-3 py-2 rounded-md border border-emerald-200 shadow-sm mr-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <IconoArchiveBox className="w-4 h-4 shrink-0" />
                                  <span className="font-bold">{det.cantidad}x {det.nombre}</span>
                                </div>
                                <div className="mt-1 ml-6 text-xs text-slate-600">
                                  <span className="font-semibold">Cantidad:</span> {det.cantidad} &nbsp;•&nbsp;
                                  <span className="font-semibold">Dosis:</span> {det.dosis} &nbsp;•&nbsp;
                                  <span className="font-semibold">Frecuencia:</span> {det.frecuencia} &nbsp;•&nbsp;
                                  <span className="font-semibold">Duración:</span> {det.duracion}
                                </div>
                              </div>
                            ))
                         ) : (
                           <p className="text-sm font-medium text-emerald-800 bg-emerald-50 inline-block px-3 py-1.5 rounded-md border border-emerald-200 shadow-sm">
                             <IconoArchiveBox className="w-4 h-4 inline mr-1" />
                             {receta.medicamentos}
                           </p>
                         )}
                       </div>
                  </div>

                  <div className="flex flex-col items-end w-full sm:w-auto mt-4 sm:mt-0 gap-3">
                    <p className="text-xs text-slate-400 font-medium text-right">
                      Emitida: {new Date(receta.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <button 
                      onClick={() => setRecetaAConfirmar(receta)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-all transform group-hover:scale-105"
                    >
                      Verificar y Despachar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DETALLADO */}
      {recetaAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            
             {/* Cabecera del Modal */}
             <div className="bg-emerald-600 p-4 text-center text-white">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                 <IconoClipboardDocument className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-lg font-bold">Autorización de Despacho</h3>
             </div>

            <div className="p-6">
              {/* Ticket Resumen */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Paciente</span>
                  <span className="font-bold text-slate-800 text-right">{recetaAConfirmar.paciente} <br/><span className="text-xs font-normal text-slate-500">CI: {recetaAConfirmar.ci_paciente}</span></span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Prescribe</span>
                  <span className="font-medium text-slate-700 text-right">Dr(a). {recetaAConfirmar.medico}</span>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Fecha de Emisión:</span>
                  <span className="text-sm font-bold text-blue-700">
                    {new Date(recetaAConfirmar.fecha).toLocaleDateString('es-BO', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Medicamentos a entregar</span>
                   <div className="bg-white border border-emerald-100 rounded p-2 text-sm text-emerald-800 font-medium space-y-1">
                     {recetaAConfirmar.detalles && recetaAConfirmar.detalles.length > 0 ? (
                       recetaAConfirmar.detalles.map((det, idx) => (
                         <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                           <span className="font-bold">{det.cantidad}x {det.nombre}</span>
                           <span className="text-slate-500">—</span>
                           <span className="font-semibold">Cantidad:</span> {det.cantidad}
                           <span className="text-slate-500">•</span>
                           <span className="font-semibold">Dosis:</span> {det.dosis}
                           <span className="text-slate-500">•</span>
                           <span className="font-semibold">Frecuencia:</span> {det.frecuencia}
                           <span className="text-slate-500">•</span>
                           <span className="font-semibold">Duración:</span> {det.duracion}
                         </div>
                       ))
                     ) : (
                       <span>{recetaAConfirmar.medicamentos || 'Sin detalles'}</span>
                     )}
                   </div>
                </div>
                
                {recetaAConfirmar.observaciones && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Observaciones Médicas</span>
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 italic">
                      "{recetaAConfirmar.observaciones}"
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setRecetaAConfirmar(null)} 
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarDespacho} 
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors"
                >
                  Entregar Fármacos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}