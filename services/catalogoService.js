// services/catalogoService.js
// ============================================================
// CAPA DE LOGICA - Catálogo administrable (admin) y stock (admin/farmacia).
// ============================================================
import bcrypt from 'bcryptjs';
import {
  listarEspecialidadesCatalogo,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
  listarMedicosCatalogo,
  crearMedico,
  actualizarMedico,
  eliminarMedico,
  listarEnfermerosCatalogo,
  crearEnfermero,
  actualizarEnfermero,
  eliminarEnfermero,
  listarFarmaceuticosCatalogo,
  crearFarmaceutico,
  actualizarFarmaceutico,
  eliminarFarmaceutico,
  listarTecnicosCatalogo,
  crearTecnico,
  actualizarTecnico,
  eliminarTecnico,
  listarTiposSeguro,
  crearTipoSeguro,
  actualizarTipoSeguro,
  eliminarTipoSeguro,
  listarMedicamentosStock,
  actualizarStockMedicamento,
} from '../repositories/catalogoRepository.js';
import { traducirError } from '../lib/errorMessages.js';

const CI_REGEX = /^[0-9]{5,10}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarPersonaBasica(payload, errores) {
  if (!payload.nombre || payload.nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (!payload.apellido || payload.apellido.trim().length < 2) errores.apellido = 'El apellido es obligatorio.';
  if (!payload.ci || !CI_REGEX.test(payload.ci)) errores.ci = 'El CI debe tener entre 5 y 10 dígitos.';
  if (!payload.correo || !CORREO_REGEX.test(payload.correo)) errores.correo = 'El formato del correo no es válido.';
}

async function conHash(payload, errores) {
  // Si no se indica contraseña, se usa el CI como valor por defecto.
  const contrasena = payload.contrasena || payload.ci || '';
  if (!contrasena) {
    errores.contrasena = 'Se requiere una contraseña o un CI válido.';
    return null;
  }
  if (contrasena.length < 6) {
    errores.contrasena = 'La contraseña (o el CI) debe tener al menos 6 caracteres.';
    return null;
  }
  return await bcrypt.hash(contrasena, 10);
}

// ---------------- ESPECIALIDAD ----------------
export async function obtenerEspecialidades() {
  return { ok: true, especialidades: await listarEspecialidadesCatalogo() };
}
export async function crearEspecialidadCatalogo(p) {
  const errores = {};
  if (!p.nombre || p.nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    const esp = await crearEspecialidad(p);
    return { ok: true, status: 201, mensaje: 'Especialidad creada.', especialidad: esp };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function editarEspecialidad(id, p) {
  try {
    const esp = await actualizarEspecialidad(id, p);
    return { ok: true, status: 200, mensaje: 'Especialidad actualizada.', especialidad: esp };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarEspecialidad(id) {
  try { await eliminarEspecialidad(id); return { ok: true, status: 200, mensaje: 'Especialidad eliminada.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- MEDICO ----------------
export async function obtenerMedicos() {
  return { ok: true, medicos: await listarMedicosCatalogo(), especialidades: await listarEspecialidadesCatalogo() };
}
export async function crearMedicoCatalogo(p) {
  const errores = {};
  validarPersonaBasica(p, errores);
  const hash = await conHash(p, errores);
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    await crearMedico({ ...p, contrasenaHash: hash });
    return { ok: true, status: 201, mensaje: 'Médico registrado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function editarMedico(id, p) {
  try {
    const datos = { ...p };
    if (p.contrasena && p.contrasena.length >= 6) datos.contrasenaHash = await bcrypt.hash(p.contrasena, 10);
    delete datos.contrasena;
    await actualizarMedico(id, datos);
    return { ok: true, status: 200, mensaje: 'Médico actualizado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarMedico(id) {
  try { await eliminarMedico(id); return { ok: true, status: 200, mensaje: 'Médico eliminado correctamente.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- ENFERMERO ----------------
export async function obtenerEnfermeros() {
  return { ok: true, enfermeros: await listarEnfermerosCatalogo() };
}
export async function crearEnfermeroCatalogo(p) {
  const errores = {};
  validarPersonaBasica(p, errores);
  const hash = await conHash(p, errores);
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    await crearEnfermero({ ...p, contrasenaHash: hash });
    return { ok: true, status: 201, mensaje: 'Enfermero registrado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function editarEnfermeroCatalogo(id, p) {
  try {
    const datos = { ...p };
    if (p.contrasena && p.contrasena.length >= 6) datos.contrasenaHash = await bcrypt.hash(p.contrasena, 10);
    delete datos.contrasena;
    await actualizarEnfermero(id, datos);
    return { ok: true, status: 200, mensaje: 'Enfermero actualizado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarEnfermeroCatalogo(id) {
  try { await eliminarEnfermero(id); return { ok: true, status: 200, mensaje: 'Enfermero eliminado correctamente.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- FARMACEUTICO ----------------
export async function obtenerFarmaceuticos() {
  return { ok: true, farmaceuticos: await listarFarmaceuticosCatalogo() };
}
export async function crearFarmaceuticoCatalogo(p) {
  const errores = {};
  validarPersonaBasica(p, errores);
  const hash = await conHash(p, errores);
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    await crearFarmaceutico({ ...p, contrasenaHash: hash });
    return { ok: true, status: 201, mensaje: 'Farmacéutico registrado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function editarFarmaceuticoCatalogo(id, p) {
  try {
    const datos = { ...p };
    if (p.contrasena && p.contrasena.length >= 6) datos.contrasenaHash = await bcrypt.hash(p.contrasena, 10);
    delete datos.contrasena;
    await actualizarFarmaceutico(id, datos);
    return { ok: true, status: 200, mensaje: 'Farmacéutico actualizado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarFarmaceuticoCatalogo(id) {
  try { await eliminarFarmaceutico(id); return { ok: true, status: 200, mensaje: 'Farmacéutico eliminado correctamente.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- TECNICO DE LABORATORIO ----------------
export async function obtenerTecnicos() {
  return { ok: true, tecnicos: await listarTecnicosCatalogo() };
}
export async function crearTecnicoCatalogo(p) {
  const errores = {};
  validarPersonaBasica(p, errores);
  const hash = await conHash(p, errores);
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    await crearTecnico({ ...p, contrasenaHash: hash });
    return { ok: true, status: 201, mensaje: 'Técnico de laboratorio registrado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function editarTecnicoCatalogo(id, p) {
  try {
    const datos = { ...p };
    if (p.contrasena && p.contrasena.length >= 6) datos.contrasenaHash = await bcrypt.hash(p.contrasena, 10);
    delete datos.contrasena;
    await actualizarTecnico(id, datos);
    return { ok: true, status: 200, mensaje: 'Técnico actualizado correctamente.' };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarTecnicoCatalogo(id) {
  try { await eliminarTecnico(id); return { ok: true, status: 200, mensaje: 'Técnico eliminado correctamente.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- TIPO DE SEGURO ----------------
export async function obtenerTiposSeguro() {
  try {
    const tipos_seguro = await listarTiposSeguro();
    return { ok: true, tipos_seguro };
  } catch (e) {
    // La tabla tipo_seguro se crea con la migración sql/008_*.sql
    if (/tipo_seguro/.test(e.message || '')) {
      return { ok: true, tipos_seguro: [], faltaMigracion: true };
    }
    throw e;
  }
}
export async function crearTipoSeguroCatalogo(p) {
  const errores = {};
  if (!p.nombre || p.nombre.trim().length < 2) errores.nombre = 'El nombre es obligatorio.';
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    const ts = await crearTipoSeguro(p);
    return { ok: true, status: 201, mensaje: 'Tipo de seguro creado.', tipo_seguro: ts };
  } catch (e) {
    if (/tipo_seguro/.test(e.message || '')) {
      return { ok: false, status: 400, errores: { general: 'Falta la tabla tipo_seguro. Ejecuta la migración sql/008 en Supabase.' } };
    }
    return { ok: false, status: 400, errores: { general: traducirError(e) } };
  }
}
export async function editarTipoSeguroCatalogo(id, p) {
  try {
    const ts = await actualizarTipoSeguro(id, p);
    return { ok: true, status: 200, mensaje: 'Tipo de seguro actualizado.', tipo_seguro: ts };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
export async function borrarTipoSeguroCatalogo(id) {
  try { await eliminarTipoSeguro(id); return { ok: true, status: 200, mensaje: 'Tipo de seguro eliminado.' }; }
  catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}

// ---------------- STOCK (min/max) ----------------
export async function obtenerMedicamentosStock() {
  return { ok: true, medicamentos: await listarMedicamentosStock() };
}
export async function editarStockMedicamento(id, p) {
  const errores = {};
  if (p.stock_minimo !== undefined && (Number.isNaN(Number(p.stock_minimo)) || Number(p.stock_minimo) < 0)) {
    errores.stock_minimo = 'El stock mínimo debe ser un número mayor o igual a 0.';
  }
  if (p.stock_maximo !== undefined && p.stock_maximo !== '' && (Number.isNaN(Number(p.stock_maximo)) || Number(p.stock_maximo) < 0)) {
    errores.stock_maximo = 'El stock máximo debe ser un número mayor o igual a 0.';
  }
  if (Object.keys(errores).length) return { ok: false, status: 400, errores };
  try {
    const datos = {};
    if (p.stock_minimo !== undefined) datos.stock_minimo = Number(p.stock_minimo);
    if (p.stock_maximo !== undefined) datos.stock_maximo = p.stock_maximo === '' ? null : Number(p.stock_maximo);
    const med = await actualizarStockMedicamento(id, datos);
    return { ok: true, status: 200, mensaje: 'Stock actualizado correctamente.', medicamento: med };
  } catch (e) { return { ok: false, status: 400, errores: { general: traducirError(e) } }; }
}
