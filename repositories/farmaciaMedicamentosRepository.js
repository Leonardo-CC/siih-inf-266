// repositories/farmaciaMedicamentosRepository.js
// ============================================================
// CAPA DE DATOS - CRUD de medicamentos (rol: farmaceutico).
// ============================================================
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export async function listarMedicamentos() {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .select('id_medicamento, nombre, descripcion, precio, stock_actual, stock_minimo, stock_maximo')
    .order('nombre');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function obtenerMedicamento(id_medicamento) {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .select('id_medicamento, nombre, descripcion, precio, stock_actual, stock_minimo, stock_maximo')
    .eq('id_medicamento', id_medicamento)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function crearMedicamento({ nombre, descripcion, precio, stock_minimo, stock_maximo }) {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .insert([{
      nombre,
      descripcion: descripcion || null,
      precio: Number(precio ?? 0),
      stock_actual: 0,
      stock_minimo: stock_minimo ?? 0,
      stock_maximo: stock_maximo ?? null,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function actualizarMedicamento(id_medicamento, { nombre, descripcion, precio, stock_minimo, stock_maximo }) {
  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (descripcion !== undefined) updates.descripcion = descripcion || null;
  if (precio !== undefined) updates.precio = Number(precio ?? 0);
  if (stock_minimo !== undefined) updates.stock_minimo = stock_minimo;
  if (stock_maximo !== undefined) updates.stock_maximo = stock_maximo;

  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .update(updates)
    .eq('id_medicamento', id_medicamento)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function eliminarMedicamento(id_medicamento) {
  const { error } = await supabaseAdmin
    .from('medicamento')
    .delete()
    .eq('id_medicamento', id_medicamento);

  if (error) throw new Error(error.message);
  return { ok: true };
}
