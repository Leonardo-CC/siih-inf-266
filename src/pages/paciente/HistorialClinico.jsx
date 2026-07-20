/// src/pages/paciente/HistorialClinico.jsx.
import React, { useState, useEffect } from 'react';
import { obtenerUsuario } from '../../lib/authSession';
import { IconoBuildingHospital, IconoArchiveBox, IconoPill } from '../../components/Iconos.jsx';

export default function HistorialClinico() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const usuario = obtenerUsuario();
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        // 1. Vamos a buscar el ID real del paciente usando su correo de sesión
        const resId = await fetch('/api/pacientes/mi-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Le mandamos el objeto 'usuario' entero, asegurando que lleve el persona_id
          body: JSON.stringify({ 
            usuario: { 
              ...usuario,
              persona_id: usuario.persona_id || usuario.id_usuario || usuario.id 
            } 
          }) 
        });
        
        const dataId = await resId.json();
        
        // Si no encuentra al paciente, detenemos todo y mostramos error
        if (!dataId.ok || !dataId.id_paciente) {
          throw new Error("No pudimos encontrar tu perfil de paciente en la base de datos.");
        }
        
        const id_paciente_real = dataId.id_paciente;

        // 2. Buscamos el historial usando SOLO el ID real del usuario conectado
        const res = await fetch(`/api/paciente/historial?id_paciente=${id_paciente_real}`);
        
        if (!res.ok) throw new Error(`El servidor devolvió error ${res.status}`);
        
        const data = await res.json();
        
        if (data.ok) {
          setHistorial(data.datos);
        } else {
          setError(data.mensaje || "Error al cargar el historial desde la BD.");
        }
      } catch (err) {
        console.error(err);
        setError(`Error técnico: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [usuario]);
  
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-slate-800"><IconoBuildingHospital className="w-6 h-6 inline mr-2" />Mi Historial Médico</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registro cronológico de tus consultas, diagnósticos y tratamientos. Confidencial y seguro.
        </p>
      </div>

      {historial.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="text-4xl mb-3"><IconoArchiveBox className="w-10 h-10 text-slate-400" /></div>
          <h3 className="text-lg font-bold text-slate-700">Tu historial está limpio</h3>
          <p className="text-slate-500">Aún no tienes consultas médicas finalizadas en el sistema.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-blue-100 ml-3 md:ml-6 space-y-8 pb-4">
          {historial.map((consulta, index) => {
            const fecha = new Date(consulta.fecha_consulta).toLocaleDateString('es-BO', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            });
            const medico = consulta.medico?.persona;
            const historia = consulta.historial_clinico;
            
            // EL FIX: Nos aseguramos de sacar la receta correctamente, sea arreglo o no
            const recetaObj = Array.isArray(historia?.receta) ? historia.receta[0] : historia?.receta;
            const detallesReceta = recetaObj?.detalle_receta || [];

            return (
              <div key={consulta.id_consulta} className="relative pl-6 md:pl-8">
                <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-[9px] top-1.5 ring-4 ring-white shadow-sm"></div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <span className="text-sm font-bold text-blue-600">{fecha}</span>
                      <h3 className="font-bold text-slate-800 text-lg mt-0.5">Motivo: {consulta.motivo_consulta}</h3>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-slate-700">
                        Dr(a). {medico?.nombre} {medico?.apellido}
                      </p>
                      <p className="text-xs text-slate-500 bg-slate-200 inline-block px-2 py-0.5 rounded-full mt-1">
                        {consulta.medico?.especialidad || 'Medicina General'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico Médico</h4>
                      <p className="text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-50">
                        {historia?.diagnostico || 'No registrado'}
                      </p>
                    </div>

                    {historia?.observaciones && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Observaciones</h4>
                        <p className="text-sm text-slate-600 italic">"{historia.observaciones}"</p>
                      </div>
                    )}

                    {detallesReceta.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <span><IconoPill className="w-4 h-4 inline mr-1" /> Tratamiento Recetado</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {detallesReceta.map((med, i) => (
                            <div key={i} className="flex gap-3 bg-white border border-slate-200 rounded-lg p-3">
                              <div className="flex-1">
                                <p className="font-bold text-slate-800 text-sm">{med.medicamento?.nombre}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {med.dosis} • {med.frecuencia} • {med.duracion}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}