import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase directamente en el componente
// (Lo ideal a futuro es tener esto en un archivo separado, pero así funcionará perfecto ahora)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);
    setMensajeExito(null);

    try {
      // 1. CREAR LA PERSONA
      const { data: persona, error: errPersona } = await supabase
        .from('persona')
        .insert([{
          nombre: form.nombre,
          apellido: form.apellido,
          fecha_nac: form.fecha_nac || null,
          sexo: form.sexo,
          telefono: form.telefono || null
        }])
        .select()
        .single(); // single() hace que nos devuelva el objeto, no un array

      if (errPersona) throw new Error('Error al crear persona: ' + errPersona.message);

      const nuevaPersonaId = persona.persona_id;

      // 2. CREAR EL USUARIO (vinculado a la persona)
      const { error: errUsuario } = await supabase
        .from('usuario')
        .insert([{
          persona_id: nuevaPersonaId,
          ci: form.ci,
          correo: form.correo,
          contrasena: form.contrasena, // Nota: En producción esto debería ir encriptado
          rol: 'paciente' // Asegúrate de que 'paciente' sea un valor válido en tu USER-DEFINED rol
        }]);

      if (errUsuario) throw new Error('Error al crear usuario: ' + errUsuario.message);

      // 3. CREAR EL PERFIL DE PACIENTE (vinculado a la persona)
      const { error: errPaciente } = await supabase
        .from('paciente')
        .insert([{
          persona_id: nuevaPersonaId,
          tipo_seguro: form.tipo_seguro || null,
          numero_seguro: form.numero_seguro || null
        }]);

      if (errPaciente) throw new Error('Error al crear paciente: ' + errPaciente.message);

      // SI TODO SALIÓ BIEN:
      setMensajeExito('¡Paciente registrado con éxito en la base de datos!');
      setForm(initialForm);

    } catch (err) {
      console.error(err);
      setErrorGeneral(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="siih-container">
      <div className="siih-header">
        <h1>Registro de Paciente / Estudiante</h1>
        <p>HU-01 · Regístrate una sola vez para no repetir tus datos en cada visita.</p>
      </div>

      <div className="siih-body">
        {mensajeExito && <div className="siih-alert siih-alert-success">{mensajeExito}</div>}
        {errorGeneral && <div className="siih-alert siih-alert-error">{errorGeneral}</div>}

        <form onSubmit={handleSubmit}>
          <div className="siih-row">
            <div className="siih-field">
              <label>Nombres *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required />
              {errores.nombre && <div className="siih-error">{errores.nombre}</div>}
            </div>
            <div className="siih-field">
              <label>Apellidos *</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} required />
              {errores.apellido && <div className="siih-error">{errores.apellido}</div>}
            </div>
          </div>

          <div className="siih-row">
            <div className="siih-field">
              <label>Fecha de nacimiento</label>
              <input type="date" name="fecha_nac" value={form.fecha_nac} onChange={handleChange} />
            </div>
            <div className="siih-field">
              <label>Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="siih-row">
            <div className="siih-field">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} />
            </div>
            <div className="siih-field">
              <label>Carnet de Identidad (CI) *</label>
              <input name="ci" value={form.ci} onChange={handleChange} required />
              {errores.ci && <div className="siih-error">{errores.ci}</div>}
            </div>
          </div>

          <div className="siih-field">
            <label>Correo electrónico *</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange} required />
            {errores.correo && <div className="siih-error">{errores.correo}</div>}
          </div>

          <div className="siih-field">
            <label>Contraseña *</label>
            <input
              type="password"
              name="contrasena"
              value={form.contrasena}
              onChange={handleChange}
              required
            />
            {errores.contrasena && <div className="siih-error">{errores.contrasena}</div>}
          </div>

          <div className="siih-row">
            <div className="siih-field">
              <label>Tipo de seguro</label>
              <select name="tipo_seguro" value={form.tipo_seguro} onChange={handleChange}>
                <option value="">Ninguno</option>
                <option value="Universitario">Universitario</option>
                <option value="SUS">SUS</option>
                <option value="Privado">Privado</option>
              </select>
            </div>
            <div className="siih-field">
              <label>Número de seguro</label>
              <input name="numero_seguro" value={form.numero_seguro} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="siih-button" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
      </div>
    </div>
  );
}