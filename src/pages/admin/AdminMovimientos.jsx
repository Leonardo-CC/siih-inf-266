// src/pages/admin/AdminMovimientos.jsx
// ============================================================
// HU-19: Logistica de insumos (rol administrativo).
// Entrada / Salida de inventario.
// ============================================================
import { useEffect, useState } from 'react';
import { IconoArrowDown, IconoArrowUp, IconoExclamation } from '../../components/Iconos.jsx';

export default function AdminMovimientos() {
  const [tab, setTab] = useState('entrada');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [lotesOrigen, setLotesOrigen] = useState([]);
  const [cargandoListas, setCargandoListas] = useState(true);

  const [entrada, setEntrada] = useState({
    id_medicamento: '',
    id_proveedor: '',
    numero_lote: '',
    cantidad: '',
    fecha_vencimiento: '',
  });

  const [salida, setSalida] = useState({
    id_medicamento: '',
    id_lote: '',
    cantidad: '',
    motivo: '',
  });

  useEffect(() => {
    cargarListas();
  }, []);

  useEffect(() => {
    if (salida.id_medicamento) {
      cargarLotes(salida.id_medicamento, setLotesOrigen);
    } else {
      setLotesOrigen([]);
    }
  }, [salida.id_medicamento]);

  async function cargarListas() {
    setCargandoListas(true);
    try {
      const [resMed, resProv] = await Promise.all([
        fetch('/api/catalogo?entidad=medicamento'),
        fetch('/api/catalogo?entidad=proveedor'),
      ]);
      const [medData, provData] = await Promise.all([resMed.json(), resProv.json()]);
      if (medData.ok) setMedicamentos(medData.datos || medData.medicamentos || []);
      if (provData.ok) setProveedores(provData.datos || []);
    } catch {
      setMensaje({ texto: 'Error al cargar listas.', tipo: 'error' });
    } finally {
      setCargandoListas(false);
    }
  }

  async function cargarLotes(idMedicamento, setter) {
    try {
      const res = await fetch(`/api/farmacia/inventario-datos`);
      const data = await res.json();
      if (data.ok) {
        const med = data.medicamentos.find(m => m.id_medicamento === Number(idMedicamento));
        setter(med?.lote_medicamento || []);
      }
    } catch {
      setter([]);
    }
  }

  function resetMensaje() {
    setMensaje({ texto: '', tipo: '' });
  }

  async function handleEntrada(e) {
    e.preventDefault();
    setEnviando(true);
    resetMensaje();
    try {
      const res = await fetch('/api/movimientos/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_medicamento: Number(entrada.id_medicamento),
          id_proveedor: Number(entrada.id_proveedor),
          numero_lote: entrada.numero_lote,
          cantidad: Number(entrada.cantidad),
          fecha_vencimiento: entrada.fecha_vencimiento,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMensaje({ texto: data.mensaje || 'Entrada registrada.', tipo: 'exito' });
        setEntrada({ id_medicamento: '', id_proveedor: '', numero_lote: '', cantidad: '', fecha_vencimiento: '' });
        cargarListas();
      } else {
        setMensaje({ texto: data.mensaje || 'Error al registrar entrada.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexion.', tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  }

  async function handleSalida(e) {
    e.preventDefault();
    setEnviando(true);
    resetMensaje();
    try {
      const body = {
        id_medicamento: Number(salida.id_medicamento),
        cantidad: Number(salida.cantidad),
        motivo: salida.motivo || undefined,
      };
      if (salida.id_lote) body.id_lote = Number(salida.id_lote);

      const res = await fetch('/api/movimientos/salida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setMensaje({ texto: data.mensaje || 'Salida registrada.', tipo: 'exito' });
        setSalida({ id_medicamento: '', id_lote: '', cantidad: '', motivo: '' });
        setLotesOrigen([]);
        cargarListas();
      } else {
        setMensaje({ texto: data.mensaje || 'Error al registrar salida.', tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexion.', tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  }

  const tabs = [
    { key: 'entrada', label: 'Entrada', icon: IconoArrowDown },
    { key: 'salida', label: 'Salida', icon: IconoArrowUp },
  ];

  const formSelectClass = 'w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
  const formInputClass = 'w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Movimientos de Insumos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registra entradas y salidas de inventario. El stock se actualiza automaticamente sin duplicar.
        </p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-lg border ${mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); resetMensaje(); }}
              className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {cargandoListas ? (
            <div className="text-center text-slate-500 py-8">Cargando listas...</div>
          ) : (
            <>
              {tab === 'entrada' && (
                <form onSubmit={handleEntrada} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Medicamento</label>
                      <select value={entrada.id_medicamento} onChange={e => setEntrada(p => ({ ...p, id_medicamento: e.target.value }))} required className={formSelectClass}>
                        <option value="">Seleccionar...</option>
                        {medicamentos.map(m => <option key={m.id_medicamento} value={m.id_medicamento}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor</label>
                      <select value={entrada.id_proveedor} onChange={e => setEntrada(p => ({ ...p, id_proveedor: e.target.value }))} required className={formSelectClass}>
                        <option value="">Seleccionar...</option>
                        {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Numero de Lote</label>
                      <input type="text" value={entrada.numero_lote} onChange={e => setEntrada(p => ({ ...p, numero_lote: e.target.value }))} required className={formInputClass} placeholder="Ej. L-10293" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
                      <input type="number" min="1" value={entrada.cantidad} onChange={e => setEntrada(p => ({ ...p, cantidad: e.target.value }))} required className={formInputClass} placeholder="0" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Vencimiento</label>
                      <input type="date" value={entrada.fecha_vencimiento} onChange={e => setEntrada(p => ({ ...p, fecha_vencimiento: e.target.value }))} required className="w-full md:w-1/2 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={enviando} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                    {enviando ? 'Guardando...' : 'Registrar Entrada'}
                  </button>
                </form>
              )}

              {tab === 'salida' && (
                <form onSubmit={handleSalida} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Medicamento</label>
                      <select value={salida.id_medicamento} onChange={e => setSalida(p => ({ ...p, id_medicamento: e.target.value, id_lote: '' }))} required className={formSelectClass}>
                        <option value="">Seleccionar...</option>
                        {medicamentos.map(m => <option key={m.id_medicamento} value={m.id_medicamento}>{m.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Lote (opcional - FEFO automatico si se deja vacio)</label>
                      <select value={salida.id_lote} onChange={e => setSalida(p => ({ ...p, id_lote: e.target.value }))} className={formSelectClass}>
                        <option value="">Automatico (FEFO)</option>
                        {lotesOrigen.map(l => <option key={l.id_lote} value={l.id_lote}>#{l.numero_lote} - Disp: {l.cantidad_actual}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad</label>
                      <input type="number" min="1" value={salida.cantidad} onChange={e => setSalida(p => ({ ...p, cantidad: e.target.value }))} required className={formInputClass} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo (opcional)</label>
                      <input type="text" value={salida.motivo} onChange={e => setSalida(p => ({ ...p, motivo: e.target.value }))} className={formInputClass} placeholder="Ej. Vencimiento, despacho..." />
                    </div>
                  </div>
                  <button type="submit" disabled={enviando} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                    {enviando ? 'Guardando...' : 'Registrar Salida'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <IconoExclamation className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Reglas de negocio</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Las entradas crean un nuevo lote y suman stock global sin duplicar.</li>
            <li>Las salidas aplican FEFO (proximo a vencer primero) si no se elige lote especifico.</li>
            <li>El stock global se actualiza automaticamente en la tabla medicamento.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
