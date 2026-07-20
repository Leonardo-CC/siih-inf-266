// src/pages/farmacia/MedicamentosFarmacia.jsx
// ============================================================
// CRUD de medicamentos (rol: farmaceutico).
// ============================================================
import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { IconoPill, IconoPlus, IconoEdit, IconoTrash, IconoExclamation, IconoCheck } from '../../components/Iconos.jsx';

export default function MedicamentosFarmacia() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock_minimo: 0,
    stock_maximo: '',
  });

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch('/api/farmacia/medicamentos');
      const json = await res.json();
      if (!json.ok) throw new Error(json.mensaje || 'No se pudo cargar.');
      setMedicamentos(json.medicamentos || []);
    } catch (e) {
      setErrorGeneral(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirCrear() {
    setModoEditar(false);
    setIdEditar(null);
    setForm({ nombre: '', descripcion: '', precio: 0, stock_minimo: 0, stock_maximo: '' });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function abrirEditar(med) {
    setModoEditar(true);
    setIdEditar(med.id_medicamento);
    setForm({
      nombre: med.nombre,
      descripcion: med.descripcion || '',
      precio: med.precio ?? 0,
      stock_minimo: med.stock_minimo ?? 0,
      stock_maximo: med.stock_maximo ?? '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrores((p) => ({ ...p, [name]: '' }));
    setMensaje(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);

    try {
      const url = modoEditar ? `/api/farmacia/medicamentos?id=${idEditar}` : '/api/farmacia/medicamentos';
      const method = modoEditar ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const out = await res.json();
      console.log('Respuesta guardado medicamento (farmacia):', out);

      if (!out.ok) {
        const msg = out.mensaje || 'No se pudo guardar.';
        const detalle = out.detalle ? ` Detalle: ${out.detalle}` : '';
        setErrorGeneral(msg + detalle);
        if (out.errores) setErrores(out.errores);
        return;
      }

      setMensaje(out.mensaje || 'Guardado correctamente.');
      await cargar();
      setTimeout(() => { setModalAbierto(false); setMensaje(null); }, 1200);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(med) {
    if (!confirm(`¿Eliminar "${med.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/farmacia/medicamentos?id=${med.id_medicamento}`, { method: 'DELETE' });
      const out = await res.json();
      if (!out.ok) {
        setErrorGeneral(out.mensaje || 'No se pudo eliminar.');
        return;
      }
      setMensaje(out.mensaje || 'Eliminado correctamente.');
      await cargar();
      setTimeout(() => setMensaje(null), 3000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    }
  }

  const inputBase = 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IconoPill className="w-5 h-5" />
            </span>
            Medicamentos
          </h1>
          <p className="text-slate-500 text-sm mt-1">Crea y administra el catálogo de medicamentos del sistema.</p>
        </div>
        <button
          onClick={abrirCrear}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <IconoPlus className="w-4 h-4" />
          Nuevo medicamento
        </button>
      </div>

      {errorGeneral && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}
      {mensaje && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"><IconoCheck className="w-4 h-4" />{mensaje}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-center">Precio</th>
                  <th className="px-6 py-4 text-center">Stock actual</th>
                  <th className="px-6 py-4 text-center">Mínimo</th>
                  <th className="px-6 py-4 text-center">Máximo</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicamentos.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay medicamentos registrados.</td></tr>
                ) : (
                  medicamentos.map((med) => (
                    <tr key={med.id_medicamento} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{med.nombre}</td>
                      <td className="px-6 py-4 text-slate-500">{med.descripcion || '—'}</td>
                      <td className="px-6 py-4 text-center font-bold">Bs. {Number(med.precio || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center font-bold">{med.stock_actual}</td>
                      <td className="px-6 py-4 text-center">{med.stock_minimo}</td>
                      <td className="px-6 py-4 text-center">{med.stock_maximo ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => abrirEditar(med)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <IconoEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(med)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <IconoTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={modoEditar ? 'Editar medicamento' : 'Nuevo medicamento'}>
        {mensaje && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"><IconoCheck className="w-4 h-4" />{mensaje}</div>}
        {errorGeneral && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required className={`${inputBase} ${errores.nombre ? 'border-red-400' : 'border-slate-300'}`} placeholder="Ej. Paracetamol 500mg" />
            {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3" className={`${inputBase} ${errores.descripcion ? 'border-red-400' : 'border-slate-300'}`} placeholder="Descripción opcional..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Precio (Bs.)</label>
              <input type="number" min="0" step="0.01" name="precio" value={form.precio} onChange={handleChange} className={`${inputBase} ${errores.precio ? 'border-red-400' : 'border-slate-300'}`} />
              {errores.precio && <p className="text-red-500 text-xs mt-1">{errores.precio}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Stock mínimo</label>
              <input type="number" min="0" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} className={`${inputBase} ${errores.stock_minimo ? 'border-red-400' : 'border-slate-300'}`} />
              {errores.stock_minimo && <p className="text-red-500 text-xs mt-1">{errores.stock_minimo}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Stock máximo</label>
              <input type="number" min="0" name="stock_maximo" value={form.stock_maximo} onChange={handleChange} className={`${inputBase} ${errores.stock_maximo ? 'border-red-400' : 'border-slate-300'}`} placeholder="Opcional" />
              {errores.stock_maximo && <p className="text-red-500 text-xs mt-1">{errores.stock_maximo}</p>}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <IconoExclamation className="w-4 h-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">
              El stock inicial es <strong>0</strong>. Para agregar existencias, usa el ingreso de lotes desde la sección de Inventario.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50">
              {enviando ? 'Guardando...' : modoEditar ? 'Actualizar' : 'Crear medicamento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
