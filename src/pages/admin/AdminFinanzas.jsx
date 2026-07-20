import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import { IconoBanknotes, IconoChart, IconoCreditCard, IconoDocumentText, IconoPlus } from '../../components/Iconos.jsx';

function moneda(valor) {
  return `Bs. ${Number(valor || 0).toFixed(2)}`;
}

function fecha(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

const inicial = {
  tipo: 'egreso',
  categoria: '',
  concepto: '',
  monto: '',
  metodo_pago: 'efectivo',
  referencia: '',
  observaciones: '',
};

export default function AdminFinanzas() {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState({ resumen: {}, porMetodo: [], porCategoria: [], movimientos: [] });
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/finanzas?dias=${dias}`);
      const data = await res.json();
      if (data.ok) setDatos(data);
      else setMensaje({ tipo: 'error', texto: data.errores?.general || 'No se pudo cargar finanzas.' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [dias]);

  function abrirMovimiento(tipo = 'egreso') {
    setForm({ ...inicial, tipo });
    setErrores({});
    setMensaje(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function guardarMovimiento(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monto: Number(form.monto) }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrores(data.errores || {});
        setMensaje({ tipo: 'error', texto: data.errores?.general || 'No se pudo registrar.' });
        return;
      }
      setMensaje({ tipo: 'exito', texto: data.mensaje || 'Movimiento registrado.' });
      setModalAbierto(false);
      await cargar();
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor.' });
    } finally {
      setEnviando(false);
    }
  }

  const cards = [
    { titulo: 'Ingresos', valor: datos.resumen.ingresos, icono: IconoBanknotes, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { titulo: 'Egresos', valor: datos.resumen.egresos, icono: IconoCreditCard, color: 'text-red-700 bg-red-50 border-red-200' },
    { titulo: 'Resultado', valor: datos.resumen.utilidad, icono: IconoChart, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { titulo: 'IVA debito', valor: datos.resumen.iva_debito, icono: IconoDocumentText, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Finanzas</h1>
            <p className="text-slate-200 mt-1 text-sm">Control de ingresos, egresos, facturas, IVA y caja operativa.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-slate-700 font-medium"
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={365}>1 anio</option>
            </select>
            <button
              onClick={() => abrirMovimiento('ingreso')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <IconoPlus className="w-4 h-4" />
              Ingreso
            </button>
            <button
              onClick={() => abrirMovimiento('egreso')}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <IconoPlus className="w-4 h-4" />
              Egreso
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {mensaje && (
            <div className={`p-4 rounded-lg border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {mensaje.texto}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icono;
              return (
                <div key={card.titulo} className={`border rounded-lg p-5 ${card.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{card.titulo}</span>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold mt-3">{moneda(card.valor)}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-800 mb-3">Ingresos por metodo</h2>
              <div className="space-y-2">
                {(datos.porMetodo || []).map((item) => (
                  <div key={item.nombre} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{item.nombre}</span>
                    <span className="font-bold text-slate-800">{moneda(item.total)}</span>
                  </div>
                ))}
                {!datos.porMetodo?.length && <p className="text-sm text-slate-500">Sin ingresos en el periodo.</p>}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h2 className="font-semibold text-slate-800 mb-3">Categorias</h2>
              <div className="space-y-2">
                {(datos.porCategoria || []).map((item) => (
                  <div key={item.nombre} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.nombre}</span>
                    <span className={`font-bold ${Number(item.total) < 0 ? 'text-red-700' : 'text-slate-800'}`}>{moneda(item.total)}</span>
                  </div>
                ))}
                {!datos.porCategoria?.length && <p className="text-sm text-slate-500">Sin categorias en el periodo.</p>}
              </div>
            </div>
          </div>

          <TablaCRUD
            columnas={[
              { clave: 'fecha', titulo: 'Fecha', render: (v) => fecha(v) },
              { clave: 'tipo', titulo: 'Tipo', render: (v) => v === 'ingreso' ? 'Ingreso' : v === 'egreso' ? 'Egreso' : 'Egreso estimado' },
              { clave: 'categoria', titulo: 'Categoria' },
              { clave: 'concepto', titulo: 'Concepto' },
              { clave: 'metodo_pago', titulo: 'Metodo' },
              { clave: 'monto', titulo: 'Monto', render: (v, f) => <span className={f.tipo === 'ingreso' ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>{moneda(v)}</span> },
              { clave: 'numero_factura', titulo: 'Factura', render: (v, f) => f.id_pago ? <a className="text-primary font-semibold hover:underline" href={`/api/pagos/factura?id_pago=${f.id_pago}`} target="_blank" rel="noreferrer">{v || 'PDF'}</a> : '-' },
            ]}
            datos={datos.movimientos || []}
            cargando={cargando}
            emptyMessage="No hay movimientos financieros en el periodo"
          />
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo="Movimiento financiero" ancho="max-w-xl">
        <form onSubmit={guardarMovimiento} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
              {errores.tipo && <p className="text-xs text-red-500 mt-1">{errores.tipo}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Monto *</label>
              <input type="number" min="0" step="0.01" name="monto" value={form.monto} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
              {errores.monto && <p className="text-xs text-red-500 mt-1">{errores.monto}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria</label>
            <input name="categoria" value={form.categoria} onChange={handleChange} placeholder="Ej. Servicios, proveedor, donacion" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto *</label>
            <input name="concepto" value={form.concepto} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
            {errores.concepto && <p className="text-xs text-red-500 mt-1">{errores.concepto}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Metodo</label>
              <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Referencia</label>
              <input name="referencia" value={form.referencia} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg" />
          </div>
          <button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Registrar movimiento'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
