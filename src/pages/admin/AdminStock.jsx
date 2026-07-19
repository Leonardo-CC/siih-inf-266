// src/pages/admin/AdminStock.jsx
// ============================================================
// Gestión de stock mínimo y máximo de medicamentos (rol: admin).
// ============================================================
import { useEffect, useState } from 'react';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import Modal from '../../components/Modal.jsx';
import { IconoPill, IconoEdit } from '../../components/Iconos.jsx';

export default function AdminStock() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', stock_minimo: '', stock_maximo: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/farmacia/stock');
      const json = await res.json();
      if (!json.ok) throw new Error(json.mensaje || 'No se pudo cargar el stock.');
      setMedicamentos(json.medicamentos || []);
    } catch (e) {
      setErrorGeneral(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirEditar(med) {
    setForm({ id: med.id_medicamento, nombre: med.nombre, stock_minimo: med.stock_minimo ?? '', stock_maximo: med.stock_maximo ?? '' });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrores((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch(`/api/farmacia/stock?id=${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_minimo: form.stock_minimo, stock_maximo: form.stock_maximo }),
      });
      const out = await res.json();
      if (!out.ok) {
        setErrorGeneral(out.errores?.general || out.mensaje || 'No se pudo guardar.');
        if (out.errores) setErrores(out.errores);
        return;
      }
      setMensaje(out.mensaje || 'Stock actualizado.');
      await cargar();
      setTimeout(() => { setModalAbierto(false); setMensaje(null); }, 1000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  const inputBase = 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><IconoPill className="w-5 h-5" /></span>
          Stock de Medicamentos
        </h1>
        <p className="text-slate-500 text-sm mt-1">Define el stock mínimo y máximo de cada medicamento.</p>
      </div>

      {errorGeneral && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        <TablaCRUD
          cargando={cargando}
          emptyMessage="No hay medicamentos registrados"
          columnas={[
            { clave: 'nombre', titulo: 'Medicamento' },
            { clave: 'stock_actual', titulo: 'Stock actual' },
            { clave: 'stock_minimo', titulo: 'Mínimo', render: (v) => v ?? '—' },
            { clave: 'stock_maximo', titulo: 'Máximo', render: (v) => v ?? '—' },
          ]}
          datos={medicamentos}
          onEditar={abrirEditar}
          iconoEditar={<IconoEdit className="w-4 h-4" />}
        />
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={`Stock: ${form.nombre}`}>
        {mensaje && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>}
        {errorGeneral && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Stock mínimo</label>
            <input type="number" min="0" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} className={`${inputBase} ${errores.stock_minimo ? 'border-red-400' : 'border-slate-300'}`} />
            {errores.stock_minimo && <p className="text-red-500 text-xs mt-1">{errores.stock_minimo}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Stock máximo</label>
            <input type="number" min="0" name="stock_maximo" value={form.stock_maximo} onChange={handleChange} placeholder="Dejar vacío si no aplica" className={`${inputBase} ${errores.stock_maximo ? 'border-red-400' : 'border-slate-300'}`} />
            {errores.stock_maximo && <p className="text-red-500 text-xs mt-1">{errores.stock_maximo}</p>}
          </div>
          <button type="submit" disabled={enviando} className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Guardar stock'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
