// repositories/pacienteRepository.js
// ============================================================
// CAPA DE DATOS
// Acceso directo a las tablas persona / usuario / paciente
// (según el Diccionario de Datos, Sección 4.3.1 del documento).
// Este archivo NO contiene reglas de negocio, solo queries.
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// Busca si ya existe un usuario con ese CI o ese correo (para validar duplicados).
export async function buscarUsuarioPorCiOCorreo(ci, correo) {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .select('id_usuario, ci, correo')
    .or(`ci.eq.${ci},correo.eq.${correo}`);

  if (error) throw new Error(`Error al verificar duplicados: ${error.message}`);
  return data;
}

// Inserta en la tabla base "persona" y devuelve su persona_id.
export async function crearPersona({ nombre, apellido, fecha_nac, sexo, telefono }) {
  const { data, error } = await supabaseAdmin
    .from('persona')
    .insert([{ nombre, apellido, fecha_nac: fecha_nac || null, sexo, telefono }])
    .select('persona_id')
    .single();

  if (error) throw new Error(`Error al crear persona: ${error.message}`);
  return data.persona_id;
}

// Inserta en "usuario" con rol fijo 'paciente' y estado 'activo'.
export async function crearUsuario({ persona_id, ci, correo, contrasenaHash }) {
  const { data, error } = await supabaseAdmin
    .from('usuario')
    .insert([
      {
        persona_id,
        ci,
        correo,
        'contrasena': contrasenaHash,
        rol: 'paciente',
        estado: 'activo',
      },
    ])
    .select('id_usuario')
    .single();

  if (error) throw new Error(`Error al crear usuario: ${error.message}`);
  return data.id_usuario;
}

// Inserta la especialización "paciente" ligada a la misma persona_id.
export async function crearPaciente({ persona_id, id_tipo_seguro, numero_seguro }) {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .insert([{ persona_id, id_tipo_seguro: id_tipo_seguro || null, numero_seguro: numero_seguro || null }])
    .select('id_paciente')
    .single();

  if (error) throw new Error(`Error al crear paciente: ${error.message}`);
  return data.id_paciente;
}


// Rollback manual: Supabase (vía API REST/JS) no soporta transacciones
// multi-tabla nativas, así que si falla un paso posterior a "persona",
// eliminamos la persona creada para no dejar registros huérfanos.
export async function eliminarPersona(persona_id) {
  await supabaseAdmin.from('persona').delete().eq('persona_id', persona_id);
}

// Detalle de un solo paciente (nombre, CI, fecha_nac, seguro), usado
// por el reporte PDF de consulta (HU-09) para armar el encabezado.
export async function obtenerDetallePaciente(id_paciente) {
  const { data: p, error } = await supabaseAdmin
    .from('paciente')
    .select(`
      id_paciente,
      persona_id,
      tipo_seguro,
      numero_seguro,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        sexo,
        fecha_nac
      )
    `)
    .eq('id_paciente', id_paciente)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener el paciente: ${error.message}`);
  if (!p) return null;

  const { data: usuario, error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .select('ci, correo')
    .eq('persona_id', p.persona_id)
    .maybeSingle();

  if (errorUsuario) throw new Error(`Error al obtener el usuario del paciente: ${errorUsuario.message}`);

  return {
    id_paciente: p.id_paciente,
    nombre: p.persona?.nombre || '',
    apellido: p.persona?.apellido || '',
    nombre_completo: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`,
    ci: usuario?.ci || '',
    fecha_nac: p.persona?.fecha_nac || '',
    telefono: p.persona?.telefono || '',
    sexo: p.persona?.sexo || '',
    tipo_seguro: p.tipo_seguro || '',
    numero_seguro: p.numero_seguro || '',
  };
}

// Busca un paciente ya registrado (vía HU-01) a partir de su CI.
// Usado por HU-17 (inscripción) para reutilizar los datos existentes
// en vez de volver a registrarlos en "otro sistema".
export async function buscarPacientePorCi(ci) {
  const { data: usuario, error: errUsuario } = await supabaseAdmin
    .from('usuario')
    .select('id_usuario, persona_id, ci, correo')
    .eq('ci', ci)
    .maybeSingle();

  if (errUsuario) throw new Error(`Error al buscar usuario: ${errUsuario.message}`);
  if (!usuario) return null;

  const { data: paciente, error: errPaciente } = await supabaseAdmin
    .from('paciente')
    .select(`
      id_paciente,
      persona_id,
      persona:persona_id ( nombre, apellido )
    `)
    .eq('persona_id', usuario.persona_id)
    .maybeSingle();

  if (errPaciente) throw new Error(`Error al buscar paciente: ${errPaciente.message}`);
  if (!paciente) return null;

  return {
    id_paciente: paciente.id_paciente,
    persona_id: paciente.persona_id,
    ci: usuario.ci,
    correo: usuario.correo,
    nombre_completo: paciente.persona
      ? `${paciente.persona.nombre} ${paciente.persona.apellido}`
      : `Paciente #${paciente.id_paciente}`,
  };
}

export async function listarPacientes() {
  const { data, error } = await supabaseAdmin
    .from('paciente')
    .select(`
      id_paciente,
      persona_id,
      id_tipo_seguro,
      numero_seguro,
      persona:persona_id (
        nombre,
        apellido,
        telefono,
        sexo,
        fecha_nac
      ),
      tipo_seguro:id_tipo_seguro ( nombre )
    `)
    .order('id_paciente', { ascending: false })
    .limit(100);

  if (error) throw new Error(`Error al listar pacientes: ${error.message}`);

  const pacientes = (data || []).map((p) => ({
    id_paciente: p.id_paciente,
    persona_id: p.persona_id,
    nombre: p.persona?.nombre || '',
    apellido: p.persona?.apellido || '',
    nombre_completo: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`,
    telefono: p.persona?.telefono || '',
    sexo: p.persona?.sexo || '',
    fecha_nac: p.persona?.fecha_nac || '',
    id_tipo_seguro: p.id_tipo_seguro || null,
    tipo_seguro_nombre: p.tipo_seguro?.nombre || '',
    numero_seguro: p.numero_seguro || '',
  }));

  if (pacientes.length === 0) {
    return pacientes;
  }

  const personaIds = pacientes.map((p) => p.persona_id);
  const { data: usuarios, error: errorUsuarios } = await supabaseAdmin
    .from('usuario')
    .select('persona_id, ci, correo')
    .in('persona_id', personaIds);

  if (errorUsuarios) throw new Error(`Error al listar usuarios: ${errorUsuarios.message}`);

  const usuarioMap = new Map((usuarios || []).map((u) => [u.persona_id, u]));

  return pacientes.map((p) => {
    const usuario = usuarioMap.get(p.persona_id);
    return {
      ...p,
      correo: usuario?.correo || '',
      ci: usuario?.ci || '',
    };
  });
}

export async function eliminarPaciente(id_paciente) {
  const { data: paciente } = await supabaseAdmin
    .from('paciente')
    .select('persona_id')
    .eq('id_paciente', id_paciente)
    .single();

  if (!paciente) {
    throw new Error('Paciente no encontrado');
  }

  const { error: errorPaciente } = await supabaseAdmin
    .from('paciente')
    .delete()
    .eq('id_paciente', id_paciente);

  if (errorPaciente) throw new Error(`Error al eliminar paciente: ${errorPaciente.message}`);

  const { error: errorUsuario } = await supabaseAdmin
    .from('usuario')
    .delete()
    .eq('persona_id', paciente.persona_id);

  if (errorUsuario) throw new Error(`Error al eliminar usuario: ${errorUsuario.message}`);

  const { error: errorPersona } = await supabaseAdmin
    .from('persona')
    .delete()
    .eq('persona_id', paciente.persona_id);

  if (errorPersona) throw new Error(`Error al eliminar persona: ${errorPersona.message}`);

  return { ok: true };
}

export async function actualizarPaciente(id_paciente, datos) {
  const { data: paciente } = await supabaseAdmin
    .from('paciente')
    .select('persona_id')
    .eq('id_paciente', id_paciente)
    .single();

  if (!paciente) {
    throw new Error('Paciente no encontrado');
  }

  // Datos que viven en la tabla persona
  const updatesPersona = {};
  if (datos.nombre !== undefined) updatesPersona.nombre = datos.nombre;
  if (datos.apellido !== undefined) updatesPersona.apellido = datos.apellido;
  if (datos.telefono !== undefined) updatesPersona.telefono = datos.telefono || null;

  if (Object.keys(updatesPersona).length > 0) {
    const { error } = await supabaseAdmin
      .from('persona')
      .update(updatesPersona)
      .eq('persona_id', paciente.persona_id);

    if (error) throw new Error(`Error actualizando persona: ${error.message}`);
  }

  // ci y correo viven en la tabla usuario (no en persona)
  const { data: usuarioExistente, error: errorBusqueda } = await supabaseAdmin
    .from('usuario')
    .select('id_usuario')
    .eq('persona_id', paciente.persona_id)
    .maybeSingle();

  if (errorBusqueda) throw new Error(`Error buscando usuario: ${errorBusqueda.message}`);

  if (!usuarioExistente && (datos.ci || datos.correo)) {
    // El paciente no tiene usuario: lo creamos para no perder ci/correo.
    // La contrasena por defecto es el CI (igual que en el registro).
    const contrasenaHash = await import('bcryptjs').then((m) => m.default.hash(datos.ci || 'paciente123', 10));
    const { error: errorCrear } = await supabaseAdmin
      .from('usuario')
      .insert([{
        persona_id: paciente.persona_id,
        ci: datos.ci || '',
        correo: datos.correo || '',
        contrasena: contrasenaHash,
        rol: 'paciente',
        estado: 'activo',
      }]);
    if (errorCrear) throw new Error(`Error creando usuario: ${errorCrear.message}`);
  } else {
    const updatesUsuario = {};
    if (datos.ci !== undefined && datos.ci !== '') updatesUsuario.ci = datos.ci;
    if (datos.correo !== undefined && datos.correo !== '') updatesUsuario.correo = datos.correo;

    if (Object.keys(updatesUsuario).length > 0) {
      const { error } = await supabaseAdmin
        .from('usuario')
        .update(updatesUsuario)
        .eq('persona_id', paciente.persona_id);

      if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  const updatesPaciente = {};
  if (datos.tipo_seguro !== undefined) updatesPaciente.tipo_seguro = datos.tipo_seguro || null;
  if (datos.numero_seguro !== undefined) updatesPaciente.numero_seguro = datos.numero_seguro || null;

  if (Object.keys(updatesPaciente).length > 0) {
    const { error } = await supabaseAdmin
      .from('paciente')
      .update(updatesPaciente)
      .eq('id_paciente', id_paciente);

    if (error) throw new Error(`Error actualizando paciente: ${error.message}`);
  }

  return { ok: true };
}