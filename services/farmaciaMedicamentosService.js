// services/farmaciaMedicamentosService.js
// ============================================================
// CAPA DE LOGICA - CRUD de medicamentos (rol: farmaceutico).
// ============================================================
import {
  listarMedicamentos,
  obtenerMedicamento,
  crearMedicamento,
  actualizarMedicamento,
  eliminarMedicamento,
} from '../repositories/farmaciaMedicamentosRepository.js';

function responder(ok, status, datos = {}) {
  return { ok, status, ...datos };
}

export async function obtenerListaMedicamentos() {
  try {
    const datos = await listarMedicamentos();
    return responder(true, 200, { medicamentos: datos });
  } catch (e) {
    return responder(false, 400, { mensaje: e.message });
  }
}

export async function obtenerMedicamentoPorId(id_medicamento) {
  try {
    const datos = await obtenerMedicamento(id_medicamento);
    if (!datos) return responder(false, 404, { mensaje: 'Medicamento no encontrado.' });
    return responder(true, 200, { medicamento: datos });
  } catch (e) {
    return responder(false, 400, { mensaje: e.message });
  }
}

export async function registrarMedicamento(payload) {
  const errores = {};
  if (!payload.nombre || payload.nombre.trim().length < 2) {
    errores.nombre = 'El nombre es obligatorio (mínimo 2 caracteres).';
  }
  if (payload.precio !== undefined && (Number.isNaN(Number(payload.precio)) || Number(payload.precio) < 0)) {
    errores.precio = 'El precio debe ser un número mayor o igual a 0.';
  }
  if (payload.stock_minimo !== undefined && (Number.isNaN(Number(payload.stock_minimo)) || Number(payload.stock_minimo) < 0)) {
    errores.stock_minimo = 'El stock mínimo debe ser un número mayor o igual a 0.';
  }
  if (payload.stock_maximo !== undefined && payload.stock_maximo !== '' && (Number.isNaN(Number(payload.stock_maximo)) || Number(payload.stock_maximo) < 0)) {
    errores.stock_maximo = 'El stock máximo debe ser un número mayor o igual a 0.';
  }
  if (Object.keys(errores).length) return responder(false, 400, { errores });

  try {
    const datos = await crearMedicamento({
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion || '',
      precio: Number(payload.precio ?? 0),
      stock_minimo: payload.stock_minimo ?? 0,
      stock_maximo: payload.stock_maximo === '' ? null : Number(payload.stock_maximo),
    });
    return responder(true, 201, { mensaje: 'Medicamento creado correctamente.', medicamento: datos });
  } catch (e) {
    const mensaje = /precio|column .* does not exist/.test((e.message || '').toLowerCase())
      ? 'Error: la columna "precio" no existe en la tabla medicamento. Ejecuta el script sql/012_hu19_precio_medicamento.sql en Supabase.'
      : e.message;
    return responder(false, 400, { mensaje });
  }
}

export async function editarMedicamento(id_medicamento, payload) {
  const errores = {};
  if (!payload.nombre || payload.nombre.trim().length < 2) {
    errores.nombre = 'El nombre es obligatorio (mínimo 2 caracteres).';
  }
  if (payload.precio !== undefined && (Number.isNaN(Number(payload.precio)) || Number(payload.precio) < 0)) {
    errores.precio = 'El precio debe ser un número mayor o igual a 0.';
  }
  if (payload.stock_minimo !== undefined && (Number.isNaN(Number(payload.stock_minimo)) || Number(payload.stock_minimo) < 0)) {
    errores.stock_minimo = 'El stock mínimo debe ser un número mayor o igual a 0.';
  }
  if (payload.stock_maximo !== undefined && payload.stock_maximo !== '' && (Number.isNaN(Number(payload.stock_maximo)) || Number(payload.stock_maximo) < 0)) {
    errores.stock_maximo = 'El stock máximo debe ser un número mayor o igual a 0.';
  }
  if (Object.keys(errores).length) return responder(false, 400, { errores });

  try {
    const datos = await actualizarMedicamento(id_medicamento, {
      nombre: payload.nombre.trim(),
      descripcion: payload.descripcion ?? null,
      precio: Number(payload.precio),
      stock_minimo: Number(payload.stock_minimo),
      stock_maximo: payload.stock_maximo === '' ? null : Number(payload.stock_maximo),
    });
    return responder(true, 200, { mensaje: 'Medicamento actualizado correctamente.', medicamento: datos });
  } catch (e) {
    const mensaje = /precio|column .* does not exist/.test((e.message || '').toLowerCase())
      ? 'Error: la columna "precio" no existe en la tabla medicamento. Ejecuta el script sql/012_hu19_precio_medicamento.sql en Supabase.'
      : e.message;
    return responder(false, 400, { mensaje });
  }
}

export async function borrarMedicamento(id_medicamento) {
  try {
    const existe = await obtenerMedicamento(id_medicamento);
    if (!existe) return responder(false, 404, { mensaje: 'Medicamento no encontrado.' });

    if (existe.stock_actual > 0) {
      return responder(false, 400, {
        mensaje: 'No se puede eliminar un medicamento con stock disponible. Primero realiza el ajuste de inventario.',
      });
    }

    await eliminarMedicamento(id_medicamento);
    return responder(true, 200, { mensaje: 'Medicamento eliminado correctamente.' });
  } catch (e) {
    return responder(false, 400, { mensaje: e.message });
  }
}
