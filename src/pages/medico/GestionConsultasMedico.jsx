import { useEffect, useState } from 'react';
import { obtenerUsuario } from '../../lib/authSession.js';
import Modal from '../../components/Modal.jsx';
import TablaCRUD from '../../components/TablaCRUD.jsx';

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

const estadoInicial = {
  id_consulta: null,
  paciente: '',
  motivo_consulta: '',
  estado_atencion: 'pendiente',
  diagnostico: '',
  tratamiento: '',
  receta: '',
  observaciones: '',
};

export default function GestionConsultasMedico() {
  const usuario = obtenerUsuario();
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  async function cargar() {
    setCargando(true);
    setErrorGeneral(null);
    try {
      if (!usuario?.id_medico) {
        setErrorGeneral('Tu sesión no tiene un médico asociado. Vuelve a iniciar sesión.');
        setCargando(false);
        return;
      }
      const res = await fetch(`/api/medico/consultas?id_medico=${usuario.id_medico}`);
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
  }, []);

  function abrirModalAtender(consulta) {
    setForm({
      id_consulta: consulta.id_consulta,
      paciente: `${consulta.paciente_nombre || ''} ${consulta.paciente_apellido || ''}`.trim(),
      motivo_consulta: consulta.motivo_consulta || '',
      estado_atencion: consulta.estado_atencion || 'pendiente',
      diagnostico: consulta.diagnostico || '',
      tratamiento: consulta.tratamiento || '',
      receta: consulta.receta || '',
      observaciones: consulta.observaciones || '',
    });
    setErrores({});
    setMensaje(null);
    setErrorGeneral(null);
    setModalAbierto(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensaje(null);
    try {
      const res = await fetch('/api/medico/actualizar-atencion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id_medico: usuario.id_medico }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorGeneral(data.mensaje || data.errores?.general || 'No se pudo guardar.');
        if (data.errores) setErrores(data.errores);
        return;
      }
      setMensaje(data.mensaje || 'Atención guardada correctamente.');
      await cargar();
      setTimeout(() => {
        setModalAbierto(false);
        setMensaje(null);
      }, 1000);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
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
          <p className="text-blue-100 mt-1 text-sm">Registra diagnóstico, tratamiento y estado de atención de tus pacientes.</p>
        </div>

        <div className="p-6">
          {errorGeneral && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por paciente, motivo o diagnóstico..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
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
              emptyMessage="No tienes consultas que coincidan con el filtro"
              onEditar={abrirModalAtender}
            />
          )}
        </div>
      </div>

      <Modal abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} titulo={`Atender consulta #${form.id_consulta}`} ancho="max-w-2xl">
        {mensaje && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{mensaje}</div>
        )}
        {errorGeneral && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{errorGeneral}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Receta / Medicación</label>
            <textarea
              name="receta"
              value={form.receta}
              onChange={handleChange}
              rows="2"
              placeholder="Ej. Paracetamol 500mg c/8h por 5 días"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-y"
            />
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
            {enviando ? 'Guardando...' : 'Guardar atención'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
