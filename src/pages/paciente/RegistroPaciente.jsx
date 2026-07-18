import { useState } from 'react';

const initialForm = {
  nombre: '',
  apellido: '',
  fecha_nac: '',
  sexo: 'M',
  telefono: '',
  ci: '',
  correo: '',
  contrasena: '',
  tipo_seguro: '',
  numero_seguro: '',
};

export default function RegistroPaciente() {
  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de seguro</label>
                <select
                  name="tipo_seguro"
                  value={form.tipo_seguro}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                >
                  <option value="">Ninguno</option>
                  <option value="Universitario">Universitario</option>
                  <option value="SUS">SUS</option>
                  <option value="Privado">Privado</option>
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
