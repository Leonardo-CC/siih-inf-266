import { useEffect, useState } from 'react';

const initialForm = {
  nombre: '',
  apellido: '',
  fecha_nac: '',
  sexo: 'M',
  telefono: '',
  ci: '',
  correo: '',
  contrasena: '',
  id_tipo_seguro: '',
  numero_seguro: '',
  matricula_numero: '',
  matricula_foto_url: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
};

export default function RegistroPaciente() {
  const [form, setForm] = useState(initialForm);
  const [tiposSeguro, setTiposSeguro] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  useEffect(() => {
    fetch('/api/catalogo?entidad=tipo_seguro')
      .then((r) => r.json())
      .then((json) => setTiposSeguro(json.tipos_seguro || []))
      .catch(() => setTiposSeguro([]));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function cargarArchivoMatricula(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, matricula_foto_url: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensajeExito(null);

    try {
      const res = await fetch('/api/pacientes/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorGeneral(data.mensaje || 'No se pudo registrar.');
        if (data.errores) setErrores(data.errores);
        return;
      }

      setMensajeExito(data.mensaje);
      setForm(initialForm);
    } catch {
      setErrorGeneral('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Registro de Paciente</h1>
          <p className="text-blue-100 mt-1 text-sm">Completa el formulario para crear una nueva cuenta en el sistema.</p>
        </div>

        <div className="p-8">
          {mensajeExito && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {mensajeExito}
            </div>
          )}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorGeneral}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombres *</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.nombre ? 'border-red-400' : 'border-slate-300'}`}
                  required
                />
                {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Apellidos *</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.apellido ? 'border-red-400' : 'border-slate-300'}`}
                  required
                />
                {errores.apellido && <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  name="fecha_nac"
                  value={form.fecha_nac}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sexo</label>
                <select
                  name="sexo"
                  value={form.sexo}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Carnet de Identidad *</label>
                <input
                  name="ci"
                  value={form.ci}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.ci ? 'border-red-400' : 'border-slate-300'}`}
                  required
                />
                {errores.ci && <p className="text-red-500 text-xs mt-1">{errores.ci}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Correo electrónico *</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.correo ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.correo && <p className="text-red-500 text-xs mt-1">{errores.correo}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña *</label>
              <input
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition ${errores.contrasena ? 'border-red-400' : 'border-slate-300'}`}
                required
              />
              {errores.contrasena && <p className="text-red-500 text-xs mt-1">{errores.contrasena}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Numero de matricula</label>
                <input
                  name="matricula_numero"
                  value={form.matricula_numero}
                  onChange={handleChange}
                  placeholder="Ej. INF-2026-001"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
              <ArchivoCampo
                label="Foto / respaldo de matricula"
                value={form.matricula_foto_url}
                onFile={cargarArchivoMatricula}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contacto de emergencia</label>
                <input
                  name="contacto_emergencia_nombre"
                  value={form.contacto_emergencia_nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefono de emergencia</label>
                <input
                  name="contacto_emergencia_telefono"
                  value={form.contacto_emergencia_telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de seguro</label>
                <select
                  name="id_tipo_seguro"
                  value={form.id_tipo_seguro}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                >
                  <option value="">Ninguno</option>
                  {tiposSeguro.map((ts) => (
                    <option key={ts.id_tipo_seguro} value={ts.id_tipo_seguro}>
                      {ts.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Número de seguro</label>
                <input
                  name="numero_seguro"
                  value={form.numero_seguro}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ArchivoCampo({ label, value, onFile }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="rounded-lg border border-slate-300 bg-white p-3">
        <input
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
        />
        {value && <p className="mt-2 text-xs text-green-700">Archivo cargado correctamente.</p>}
      </div>
    </div>
  );
}
