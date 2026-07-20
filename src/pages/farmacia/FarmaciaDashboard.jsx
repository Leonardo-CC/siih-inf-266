// src/pages/farmacia/FarmaciaDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard.jsx';
import Modal from '../../components/Modal.jsx'; // <-- AÑADIDO
import { obtenerUsuario } from '../../lib/authSession.js';
import {
  IconoExclamation,
  IconoClock,
  IconoDocumentText,
  IconoClipboardDocument,
  IconoArchiveBox,
  IconoPill,
  IconoRefresh,
} from '../../components/Iconos.jsx';

// --- SUB-COMPONENTE: DONA DE ESTADO DE STOCK REAL ---
function DonaStock({ normal, critico, agotado }) {
  const total = normal + critico + agotado || 1;
  const radio = 40;
  const circ = 2 * Math.PI * radio;
  
  const datos = [
    { etiqueta: 'Stock Óptimo', valor: normal, color: '#10b981', clave: 'normal' },
    { etiqueta: 'Bajo Stock', valor: critico, color: '#f59e0b', clave: 'critico' },
    { etiqueta: 'Agotados', valor: agotado, color: '#ef4444', clave: 'agotado' }
  ];

  let acumulado = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        {datos.map((d) => {
          if (d.valor === 0) return null;
          const dash = (d.valor / total) * circ;
          const elemento = (
            <circle key={d.clave} cx="55" cy="55" r={radio} fill="none" stroke={d.color} strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-acumulado} className="transition-all duration-500" />
          );
          acumulado += dash;
          return elemento;
        })}
        <circle cx="55" cy="55" r="26" fill="white" />
      </svg>
      <div className="space-y-2">
        {datos.map((d) => (
          <div key={d.clave} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-slate-500 font-medium">{d.etiqueta}:</span>
            <span className="font-bold text-slate-800">{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: BARRAS DE INGRESOS REALES ---
function BarrasIngresos({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.cantidad));
  
  return (
    <div className="flex items-end justify-between gap-2 h-32 pt-2 px-1">
      {serie.map((d, index) => {
        const porcentajeAltura = (d.cantidad / max) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center h-24">
              <div
                className="w-2/3 max-w-[24px] bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-500 relative group cursor-pointer"
                style={{ height: `${porcentajeAltura}%` }}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none shadow">
                  {d.cantidad}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{d.etiqueta}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- DASHBOARD PRINCIPAL ---
export default function FarmaciaDashboard() {
  const usuario = obtenerUsuario();
  const [stats, setStats] = useState({ 
    enCatalogo: 0, stockCritico: 0, sinStock: 0, lotesHoy: 0, porVencer: 0, licencia: 'Cargando...', recetasPendientes: 0 
  });
  const [porEstado, setPorEstado] = useState({ stockNormal: 0, stockCritico: 0, sinStock: 0 });
  const [serieIngresos, setSerieIngresos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados nuevos para las Alertas
  const [alertasDetalle, setAlertasDetalle] = useState({ bajoStock: [], porVencer: [] });
  const [mostrarModalAlertas, setMostrarModalAlertas] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Agregamos la petición a inventario-datos para tener el detalle de los problemas
      const [resRecetas, resStats, resInventario] = await Promise.all([
        fetch('/api/farmacia/recetas-pendientes'),
        fetch(`/api/farmacia/dashboard-stats?correo=${usuario?.correo || ''}`),
        fetch('/api/farmacia/inventario-datos')
      ]);
      
      const dataRecetas = await resRecetas.json();
      const dataStats = await resStats.json();
      const dataInventario = await resInventario.json();

      if (dataStats.ok) {
        setStats({
          ...dataStats.stats,
          recetasPendientes: dataRecetas.ok ? dataRecetas.recetas.length : 0
        });
        setPorEstado(dataStats.porEstado);
        setSerieIngresos(dataStats.serieIngresos);
      }

      // Procesar el detalle de alertas si el inventario cargó bien
      if (dataInventario.ok) {
        const nuevasAlertas = { bajoStock: [], porVencer: [] };
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        dataInventario.medicamentos.forEach(med => {
          if (med.stock_actual <= med.stock_minimo) {
            nuevasAlertas.bajoStock.push(med);
          }
          if (med.lote_medicamento) {
            med.lote_medicamento.forEach(lote => {
              if (lote.cantidad_actual > 0) {
                const vencimiento = new Date(lote.fecha_vencimiento + 'T00:00:00');
                const dias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
                if (dias <= 30) {
                  // Guardamos el lote junto con el nombre del medicamento para mostrarlo
                  nuevasAlertas.porVencer.push({ ...lote, medicamento_nombre: med.nombre, diasRestantes: dias });
                }
              }
            });
          }
        });

        setAlertasDetalle(nuevasAlertas);
        
        // Disparar el modal automáticamente si hay problemas
        if (nuevasAlertas.bajoStock.length > 0 || nuevasAlertas.porVencer.length > 0) {
          setMostrarModalAlertas(true);
        }
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreMostrar = usuario?.nombre_completo || usuario?.nombre || usuario?.correo || 'Farmacéutico';
  const hayAlertas = alertasDetalle.bajoStock.length > 0 || alertasDetalle.porVencer.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* CABECERA PREMIUM */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full opacity-5 -mr-10 -mt-10 blur-xl"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-emerald-400 rounded-full opacity-20 blur-2xl"></div>
        
        <div className="z-10">
          <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Panel de Farmacia</span>
          <h1 className="text-2xl font-bold mt-1 capitalize">Dr(a). {nombreMostrar}</h1>
          <p className="text-emerald-100 mt-1">
            Gestión de Inventario · Licencia {stats.licencia}
          </p>
        </div>
        
        <button 
          onClick={cargarDatos}
          disabled={cargando}
          className="z-10 bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2 rounded-lg transition backdrop-blur flex items-center gap-2 disabled:opacity-50"
        >
          <IconoRefresh className="w-4 h-4" /> {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* BANNER DE ALERTAS EN DASHBOARD */}
      {!cargando && hayAlertas && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <IconoExclamation className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Atención Crítica de Inventario</h3>
              <p className="text-sm text-red-700">
                El sistema detectó medicamentos agotados o próximos a vencer.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMostrarModalAlertas(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
          >
            Ver Detalles
          </button>
        </div>
      )}

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))
        ) : (
          [
            { titulo: 'En Catálogo', valor: stats.enCatalogo, icono: <IconoPill className="w-6 h-6" />, color: 'bg-emerald-500' },
            { titulo: 'Bajo Stock', valor: stats.stockCritico + stats.sinStock, icono: <IconoExclamation className="w-6 h-6" />, color: 'bg-amber-500' },
            { titulo: 'Lotes x Vencer', valor: stats.porVencer, icono: <IconoClock className="w-6 h-6" />, color: 'bg-orange-500' },
            { titulo: 'Recetas en Espera', valor: stats.recetasPendientes, icono: <IconoDocumentText className="w-6 h-6" />, color: 'bg-blue-600' },
          ].map((stat, idx) => (
            <StatCard key={stat.titulo} titulo={stat.titulo} valor={stat.valor} icono={stat.icono} color={stat.color} retraso={idx * 80} />
          ))
        )}
      </div>

      {/* SECCIÓN DE GRÁFICOS REALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Gráfico 1: Estado General del Catálogo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-700 text-sm tracking-wide uppercase">Balance del Catálogo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribución sanitaria según niveles de stock.</p>
          </div>
          {cargando ? (
            <div className="h-32 flex items-center justify-center text-xs text-slate-400">Calculando balance...</div>
          ) : (
            <DonaStock normal={porEstado.stockNormal} critico={porEstado.stockCritico} agotado={porEstado.sinStock} />
          )}
        </div>

        {/* Gráfico 2: Flujo de Lotes de Proveedores */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-700 text-sm tracking-wide uppercase">Ingresos Recientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Lotes de proveedores recibidos en los últimos 5 días.</p>
          </div>
          {cargando ? (
            <div className="h-32 flex items-center justify-center text-xs text-slate-400">Procesando historial...</div>
          ) : (
            <BarrasIngresos serie={serieIngresos} />
          )}
        </div>

        {/* Accesos Rápidos Integrados en la Grilla */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Navegación Operativa</h2>
          
          <Link to="/farmacia/despachos" className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors text-emerald-600">
              <IconoClipboardDocument className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">Despachar Medicinas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Atender fila virtual de recetas.</p>
            </div>
          </Link>

          <Link to="/farmacia/inventario" className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors text-emerald-600">
              <IconoArchiveBox className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">Almacén e Inventario</h3>
              <p className="text-xs text-slate-400 mt-0.5">Controlar fechas de lotes físicos.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* MODAL EMERGENTE DE ALERTAS DETALLADAS */}
      <Modal abierto={mostrarModalAlertas} alCerrar={() => setMostrarModalAlertas(false)} titulo="⚠️ Alertas Críticas de Inventario">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
          
          {/* Sección Baja/Sin Stock */}
          {alertasDetalle.bajoStock.length > 0 && (
            <div>
              <h3 className="font-bold text-red-800 border-b border-red-200 pb-2 mb-3 flex items-center gap-2">
                <IconoExclamation className="w-5 h-5 text-red-600" />
                Medicamentos por debajo del mínimo ({alertasDetalle.bajoStock.length})
              </h3>
              <div className="space-y-2">
                {alertasDetalle.bajoStock.map((med) => (
                  <div key={med.id_medicamento} className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center">
                    <span className="font-medium text-red-900">{med.nombre}</span>
                    <span className="text-sm px-2 py-1 bg-white rounded font-bold text-red-600">
                      Stock: {med.stock_actual} <span className="text-slate-400 font-normal">/ Mín: {med.stock_minimo}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección Por Vencer */}
          {alertasDetalle.porVencer.length > 0 && (
            <div>
              <h3 className="font-bold text-amber-800 border-b border-amber-200 pb-2 mb-3 flex items-center gap-2">
                <IconoClock className="w-5 h-5 text-amber-600" />
                Lotes próximos a vencer ({alertasDetalle.porVencer.length})
              </h3>
              <div className="space-y-2">
                {alertasDetalle.porVencer.map((lote) => (
                  <div key={lote.id_lote} className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-amber-900 block">{lote.medicamento_nombre}</span>
                      <span className="text-xs text-amber-700 font-mono">Lote #{lote.numero_lote}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-amber-700">
                        {lote.diasRestantes < 0 ? '¡Vencido!' : `Vence en ${lote.diasRestantes} días`}
                      </span>
                      <span className="text-xs text-amber-600">Disp: {lote.cantidad_actual}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        <div className="mt-6 flex justify-end">
          <Link 
            to="/farmacia/inventario"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm transition"
          >
            Ir al Inventario a Resolver
          </Link>
        </div>
      </Modal>

    </div>
  );
}