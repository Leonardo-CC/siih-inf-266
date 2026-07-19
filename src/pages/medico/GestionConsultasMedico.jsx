import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';
import '../../styles/reporteConsulta.css';
import { IconoEdit, IconoPlus, IconoTrash, IconoDocumentText } from '../../components/Iconos.jsx';

const ESTADOS = {
  pendiente: 'Pendiente',
  en_atencion: 'En atención',
  atendida: 'Atendida',
  derivada: 'Derivada',
};

const ESTADO_CLASES = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  en_atencion: 'bg-blue-100 text-blue-800 border-blue-200',
  atendida: 'bg-green-100 text-green-800 border-green-200',
  derivada: 'bg-purple-100 text-purple-800 border-purple-200',
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}

function obtenerFechaHoy() {
  const hoy = new Date();
  return hoy.getFullYear() + '-' + 
         String(hoy.getMonth() + 1).padStart(2, '0') + '-' + 
         String(hoy.getDate()).padStart(2, '0');
}

const estadoInicial = {
  id_consulta: null,
  paciente: '',
  motivo_consulta: '',
  estado_atencion: 'pendiente',
  diagnostico: '',
  tratamiento: '',
  observaciones: '',
  items_prescripcion: [],
};

const itemPrescripcionVacio = {
  id_medicamento: '',
  cantidad: 1,
  dosis: '',
  frecuencia: '',
  duracion: '',
};

export default function GestionConsultasMedico() {
  const usuario = obtenerUsuario();
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [items, setItems] = useState([itemPrescripcionVacio]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [cargandoMedicamentos, setCargandoMedicamentos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(obtenerFechaHoy());

  const [modalVerReceta, setModalVerReceta] = useState(false);
  const [modalEditarReceta, setModalEditarReceta] = useState(false);
  const [recetaActual, setRecetaActual] = useState(null);
  const [itemsEdicion, setItemsEdicion] = useState([itemPrescripcionVacio]);
  const [editandoReceta, setEditandoReceta] = useState(false);

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      if (!usuario?.id_medico) {
        setErrorGeneral('Tu sesión no tiene un médico asociado. Vuelve a iniciar sesión.');
        setCargando(false);
        return;
      }
      const res = await fetch(`/api/medico/consultas?id_medico=${usuario.id_medico}&fecha=${filtroFecha}`);
      const data = await res.json();
      if (data.ok) setConsultas(data.consultas || []);
      else setErrorGeneral(data.mensaje || 'No se pudieron cargar las consultas.');
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [filtroFecha]);

  async function cargarMedicamentos() {
    setCargandoMedicamentos(true);
    try {
      const res = await fetch('/api/medico/medicamentos');
      const data = await res.json();
      if (data.ok) setMedicamentos(data.medicamentos || []);
    } catch {
      setMedicamentos([]);
    } finally {
      setCargandoMedicamentos(false);
    }
  }

  function abrirModalAtender(consulta) {
    setForm({
      id_consulta: consulta.id_consulta,
      paciente: `${consulta.paciente_nombre || ''} ${consulta.paciente_apellido || ''}`.trim(),
      motivo_consulta: consulta.motivo_consulta || '',
      estado_atencion: consulta.estado_atencion || 'pendiente',
      diagnostico: consulta.diagnostico || '',
      tratamiento: consulta.tratamiento || '',
      observaciones: consulta.observaciones || '',
    });
    setItems([itemPrescripcionVacio]);
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
    cargarMedicamentos();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrores((prev) => {
      const next = { ...prev };
      delete next[`item_${index}_${field}`];
      delete next.items;
      return next;
    });
  }

  function agregarItem() {
    setItems((prev) => [...prev, itemPrescripcionVacio]);
  }

  function quitarItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const nuevosErrores = {};
      const itemsValidos = items.filter((it) => it.id_medicamento && Number(it.cantidad) > 0 && it.dosis.trim() && it.frecuencia.trim() && it.duracion.trim());

      if (!itemsValidos.length) {
        nuevosErrores.items = 'Agrega al menos un medicamento con dosis, frecuencia y duración.';
      }

      items.forEach((it, index) => {
        if (!it.id_medicamento) nuevosErrores[`item_${index}_id_medicamento`] = 'Selecciona un medicamento.';
        if (!it.cantidad || Number(it.cantidad) <= 0) nuevosErrores[`item_${index}_cantidad`] = 'Cantidad inválida.';
        if (!it.dosis.trim()) nuevosErrores[`item_${index}_dosis`] = 'Ingresa la dosis.';
        if (!it.frecuencia.trim()) nuevosErrores[`item_${index}_frecuencia`] = 'Ingresa la frecuencia.';
        if (!it.duracion.trim()) nuevosErrores[`item_${index}_duracion`] = 'Ingresa la duración.';
      });

      if (Object.keys(nuevosErrores).length) {
        setErrores(nuevosErrores);
        setEnviando(false);
        return;
      }

      const payload = {
        id_consulta: form.id_consulta,
        id_medico: usuario.id_medico,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        estado_atencion: form.estado_atencion,
        observaciones: form.observaciones,
        items_prescripcion: itemsValidos.map((it) => ({
          id_medicamento: Number(it.id_medicamento),
          cantidad: Number(it.cantidad),
          dosis: it.dosis.trim(),
          frecuencia: it.frecuencia.trim(),
          duracion: it.duracion.trim(),
        })),
      };

      const res = await fetch('/api/medico/prescripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar la prescripción.');
        if (data.errores) setErrores(data.errores);
        setEnviando(false);
        return;
      }

      setMensaje(data.mensaje || 'Prescripción registrada correctamente.');
      await cargar();
      setTimeout(() => {
        setModalAbierto(false);
        setMensaje(null);
        setItems([itemPrescripcionVacio]);
      }, 1000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function abrirVerReceta(consulta) {
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch(`/api/medico/receta-ver?id_consulta=${consulta.id_consulta}`);
      const data = await res.json();
      if (data.ok) {
        setRecetaActual(data.receta);
        setModalVerReceta(true);
      } else {
        setErrorGeneral(data.mensaje || 'No se pudo cargar la receta.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    }
  }

  async function abrirEditarReceta(consulta) {
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch(`/api/medico/receta-ver?id_consulta=${consulta.id_consulta}`);
      const data = await res.json();
      if (data.ok && data.receta) {
        setRecetaActual(data.receta);
        const itemsIniciales = data.receta.detalles && data.receta.detalles.length > 0
          ? data.receta.detalles.map((d) => ({
              id_detalle: d.id_detalle,
              id_medicamento: d.id_medicamento,
              cantidad: d.cantidad,
              dosis: d.dosis,
              frecuencia: d.frecuencia,
              duracion: d.duracion,
            }))
          : [itemPrescripcionVacio];
        setItemsEdicion(itemsIniciales);
        setForm({
          id_consulta: consulta.id_consulta,
          paciente: `${consulta.paciente_nombre || ''} ${consulta.paciente_apellido || ''}`.trim(),
          motivo_consulta: consulta.motivo_consulta || '',
          estado_atencion: consulta.estado_atencion || 'pendiente',
          diagnostico: data.receta.diagnostico || consulta.diagnostico || '',
          tratamiento: consulta.tratamiento || '',
          observaciones: data.receta.observaciones || consulta.observaciones || '',
        });
        setModalEditarReceta(true);
        await cargarMedicamentos();
      } else {
        setErrorGeneral(data.mensaje || 'No se pudo cargar la receta para editar.');
      }
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    }
  }

  async function guardarEdicionReceta(e) {
    e.preventDefault();
    setEditandoReceta(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const itemsValidos = itemsEdicion.filter((it) => it.id_medicamento && Number(it.cantidad) > 0 && it.dosis.trim() && it.frecuencia.trim() && it.duracion.trim());
      if (!itemsValidos.length) {
        setErrores({ items: 'Agrega al menos un medicamento.' });
        setEditandoReceta(false);
        return;
      }

      const payload = {
        id_consulta: form.id_consulta,
        diagnostico: form.diagnostico,
        tratamiento: form.tratamiento,
        estado_atencion: form.estado_atencion,
        observaciones: form.observaciones,
        items_prescripcion: itemsValidos.map((it) => ({
          id_detalle: it.id_detalle || null,
          id_medicamento: Number(it.id_medicamento),
          cantidad: Number(it.cantidad),
          dosis: it.dosis.trim(),
          frecuencia: it.frecuencia.trim(),
          duracion: it.duracion.trim(),
        })),
      };

      const res = await fetch('/api/medico/receta-editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        setEditandoReceta(false);
        return;
      }
      setMensaje(data.mensaje || 'Receta actualizada correctamente.');
      await cargar();
      setTimeout(() => {
        setModalEditarReceta(false);
        setMensaje(null);
        setItemsEdicion([itemPrescripcionVacio]);
      }, 1000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEditandoReceta(false);
    }
  }

  function handleItemEdicionChange(index, field, value) {
    setItemsEdicion((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function agregarItemEdicion() {
    setItemsEdicion((prev) => [...prev, itemPrescripcionVacio]);
  }

  function quitarItemEdicion(index) {
    setItemsEdicion((prev) => prev.filter((_, i) => i !== index));
  }

  // HU-09 / RF09: descarga el resumen formal de la consulta en PDF.
  // Depende de HU-06: el servidor rechaza (409) si aún no hay diagnóstico.
  async function handleDescargarPdf() {
    setDescargando(true);
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch(
        `/api/medico/reporte-consulta?id_consulta=${form.id_consulta}&id_medico=${usuario.id_medico}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.errores?.general || data?.mensaje || 'No se pudo generar el reporte.'
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_consulta_${form.id_consulta}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setDescargando(false);
    }
  }
  const consultasFiltradas = consultas.filter((c) => {
    const texto = filtroTexto.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.toLowerCase().includes(texto) ||
      `${c.motivo_consulta || ''}`.toLowerCase().includes(texto) ||
      `${c.diagnostico || ''}`.toLowerCase().includes(texto);
    const coincideEstado = !filtroEstado || c.estado_atencion === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Mis Consultas</h1>
          <p className="text-blue-100 mt-1 text-sm">Registra diagnóstico, tratamiento, estado de atención y prescripción electrónica de medicamentos.</p>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <label htmlFor="filtroFecha" className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Fecha:
              </label>
              <input
                type="date"
                id="filtroFecha"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white"
              />
            </div>
            
            <div className="hidden sm:block w-px bg-slate-300 mx-2"></div>

            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente, motivo o diagnóstico..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition bg-white"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TablaCRUD
              columnas={[
                { clave: 'id_consulta', titulo: 'ID' },
                { clave: 'paciente_nombre', titulo: 'Paciente', render: (v, f) => `${v} ${f.paciente_apellido || ''}`.trim() },
                { clave: 'motivo_consulta', titulo: 'Motivo', render: (v) => v || '-' },
                {
                  clave: 'estado_atencion',
                  titulo: 'Estado',
                  render: (v) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CLASES[v] || ESTADO_CLASES.pendiente}`}>
                      {ESTADOS[v] || v}
                    </span>
                  ),
                },
                { clave: 'diagnostico', titulo: 'Diagnóstico', render: (v) => v ? (v.length > 30 ? v.slice(0, 30) + '…' : v) : '-' },
                { clave: 'fecha_consulta', titulo: 'Fecha', render: (v) => formatearFecha(v) },
              ]}
              datos={consultasFiltradas}
              cargando={cargando}
              emptyMessage={
                filtroFecha === obtenerFechaHoy() 
                  ? "No tienes consultas agendadas para el día de hoy."
                  : `No hay consultas registradas para la fecha seleccionada.`
              }
              onEditar={abrirModalAtender}
              iconoEditar={<IconoEdit className="w-4 h-4" />}
              renderAcciones={(consulta) => (
                <div className="flex items-center gap-1 justify-end">
                  {consulta.tiene_receta ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirVerReceta(consulta); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Ver receta"
                      >
                        <IconoDocumentText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirEditarReceta(consulta); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Editar receta"
                      >
                        <IconoEdit className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={`Atender consulta #${form.id_consulta}`} ancho="max-w-3xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente</label>
              <input value={form.paciente} readOnly className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado de atención *</label>
              <select
                name="estado_atencion"
                value={form.estado_atencion}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                {Object.entries(ESTADOS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de consulta</label>
            <input
              name="motivo_consulta"
              value={form.motivo_consulta}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico</label>
            <textarea
              name="diagnostico"
              value={form.diagnostico}
              onChange={handleChange}
              rows="2"
              placeholder="Diagnóstico clínico"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tratamiento</label>
            <textarea
              name="tratamiento"
              value={form.tratamiento}
              onChange={handleChange}
              rows="2"
              placeholder="Indicaciones de tratamiento"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Prescripción electrónica *</label>
              <button
                type="button"
                onClick={agregarItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition"
              >
                <IconoPlus className="w-4 h-4" />
                Agregar medicamento
              </button>
            </div>
            {errores.items && (
              <p className="mb-2 text-sm text-red-600">{errores.items}</p>
            )}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Medicamento</label>
                    <select
                      value={item.id_medicamento}
                      onChange={(e) => handleItemChange(index, 'id_medicamento', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition bg-white ${errores[`item_${index}_id_medicamento`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    >
                      <option value="">Seleccionar</option>
                      {medicamentos.map((m) => (
                        <option key={m.id_medicamento} value={m.id_medicamento}>
                          {m.nombre} {m.descripcion ? `- ${m.descripcion}` : ''}
                        </option>
                      ))}
                    </select>
                    {errores[`item_${index}_id_medicamento`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_id_medicamento`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_cantidad`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_cantidad`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_cantidad`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dosis</label>
                    <input
                      value={item.dosis}
                      onChange={(e) => handleItemChange(index, 'dosis', e.target.value)}
                      placeholder="Ej. 500mg"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_dosis`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_dosis`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_dosis`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Frecuencia</label>
                    <input
                      value={item.frecuencia}
                      onChange={(e) => handleItemChange(index, 'frecuencia', e.target.value)}
                      placeholder="Ej. c/8h"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_frecuencia`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_frecuencia`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_frecuencia`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duración</label>
                    <input
                      value={item.duracion}
                      onChange={(e) => handleItemChange(index, 'duracion', e.target.value)}
                      placeholder="Ej. 5 días"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_duracion`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_duracion`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_duracion`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarItem(index)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                      >
                        <IconoTrash className="w-4 h-4" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows="2"
              placeholder="Opcional"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Guardando...' : 'Guardar atención y prescripción'}
          </button>
        </form>
      </Modal>

      {/* MODAL VER RECETA */}
      <Modal abierto={modalVerReceta} alCerrar={() => setModalVerReceta(false)} titulo={`Receta #${recetaActual?.id_receta}`} ancho="max-w-2xl">
        {recetaActual && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Diagnóstico</label>
                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{recetaActual.diagnostico || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Observaciones</label>
                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{recetaActual.observaciones || '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Medicamentos prescritos</label>
              <div className="space-y-2">
                {(recetaActual.detalles || []).map((det, idx) => (
                  <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 text-sm">{det.cantidad}x {det.medicamento?.nombre || det.nombre || 'Medicamento'}</span>
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">{det.estado || 'pendiente'}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      <span className="font-semibold">Cantidad:</span> {det.cantidad} &nbsp;•&nbsp;
                      <span className="font-semibold">Dosis:</span> {det.dosis} &nbsp;•&nbsp;
                      <span className="font-semibold">Frecuencia:</span> {det.frecuencia} &nbsp;•&nbsp;
                      <span className="font-semibold">Duración:</span> {det.duracion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModalVerReceta(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL EDITAR RECETA */}
      <Modal abierto={modalEditarReceta} alCerrar={() => setModalEditarReceta(false)} titulo={`Editar receta #${recetaActual?.id_receta}`} ancho="max-w-3xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
        )}
        <form onSubmit={guardarEdicionReceta} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Paciente</label>
              <input value={form.paciente} readOnly className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estado de atención *</label>
              <select
                name="estado_atencion"
                value={form.estado_atencion}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              >
                {Object.entries(ESTADOS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico</label>
            <textarea
              name="diagnostico"
              value={form.diagnostico}
              onChange={handleChange}
              rows="2"
              placeholder="Diagnóstico clínico"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tratamiento</label>
            <textarea
              name="tratamiento"
              value={form.tratamiento}
              onChange={handleChange}
              rows="2"
              placeholder="Indicaciones de tratamiento"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Prescripción electrónica *</label>
              <button
                type="button"
                onClick={agregarItemEdicion}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition"
              >
                <IconoPlus className="w-4 h-4" />
                Agregar medicamento
              </button>
            </div>
            {errores.items && (
              <p className="mb-2 text-sm text-red-600">{errores.items}</p>
            )}
            <div className="space-y-2">
              {itemsEdicion.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Medicamento</label>
                    <select
                      value={item.id_medicamento}
                      onChange={(e) => handleItemEdicionChange(index, 'id_medicamento', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition bg-white ${errores[`item_${index}_id_medicamento`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    >
                      <option value="">Seleccionar</option>
                      {medicamentos.map((m) => (
                        <option key={m.id_medicamento} value={m.id_medicamento}>
                          {m.nombre} {m.descripcion ? `- ${m.descripcion}` : ''}
                        </option>
                      ))}
                    </select>
                    {errores[`item_${index}_id_medicamento`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_id_medicamento`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleItemEdicionChange(index, 'cantidad', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_cantidad`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_cantidad`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_cantidad`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dosis</label>
                    <input
                      value={item.dosis}
                      onChange={(e) => handleItemEdicionChange(index, 'dosis', e.target.value)}
                      placeholder="Ej. 500mg"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_dosis`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_dosis`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_dosis`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Frecuencia</label>
                    <input
                      value={item.frecuencia}
                      onChange={(e) => handleItemEdicionChange(index, 'frecuencia', e.target.value)}
                      placeholder="Ej. c/8h"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_frecuencia`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_frecuencia`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_frecuencia`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duración</label>
                    <input
                      value={item.duracion}
                      onChange={(e) => handleItemEdicionChange(index, 'duracion', e.target.value)}
                      placeholder="Ej. 5 días"
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition ${errores[`item_${index}_duracion`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
                    />
                    {errores[`item_${index}_duracion`] && (
                      <p className="mt-1 text-xs text-red-600">{errores[`item_${index}_duracion`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    {itemsEdicion.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarItemEdicion(index)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                      >
                        <IconoTrash className="w-4 h-4" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows="2"
              placeholder="Opcional"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={editandoReceta}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editandoReceta ? 'Guardando...' : 'Guardar cambios de receta'}
          </button>
        </form>

        {/* HU-09: exportar el resumen formal en PDF (requiere diagnóstico ya guardado) */}
        <button
          type="button"
          onClick={handleDescargarPdf}
          disabled={descargando || !form.diagnostico}
          title={!form.diagnostico ? 'Registra y guarda un diagnóstico antes de exportar el PDF' : ''}
          className="w-full mt-3 border border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
        >
          {descargando ? (
            <>
              <span className="btn-pdf-spinner" />
              Generando PDF...
            </>
          ) : (
            '📄 Descargar reporte PDF'
          )}
        </button>
      </Modal>
    </div>
  );
}
