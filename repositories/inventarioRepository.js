// repositories/inventarioRepository.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// 1. Insertar un nuevo proveedor
export async function crearProveedor(datosProveedor) {
  const { data, error } = await supabaseAdmin
    .from('proveedor')
    .insert([datosProveedor])
    .select()
    .single();

  if (error) throw new Error(`Error al crear proveedor: ${error.message}`);
  return data;
}

// 2. Insertar un nuevo medicamento (Empieza con stock 0)
export async function crearMedicamento(datosMedicamento) {
  const { data, error } = await supabaseAdmin
    .from('medicamento')
    .insert([{ 
      nombre: datosMedicamento.nombre, 
      descripcion: datosMedicamento.descripcion, 
      stock_minimo: datosMedicamento.stock_minimo,
      stock_actual: 0 // Siempre nace en 0 hasta que le ingrese un lote
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear medicamento: ${error.message}`);
  return data;
}

// 3. EL INGRESO MAGISTRAL: Registra el lote y actualiza el stock principal
export async function registrarIngresoLote(datosLote) {
  // A. Insertamos el nuevo lote
  const { data: nuevoLote, error: errorLote } = await supabaseAdmin
    .from('lote_medicamento')
    .insert([{
      id_medicamento: datosLote.id_medicamento,
      id_proveedor: datosLote.id_proveedor,
      numero_lote: datosLote.numero_lote,
      cantidad_inicial: datosLote.cantidad,
      cantidad_actual: datosLote.cantidad, // Al ingresar, inicial y actual son la misma
      fecha_vencimiento: datosLote.fecha_vencimiento
    }])
    .select()
    .single();

  if (errorLote) throw new Error(`Error al insertar lote: ${errorLote.message}`);

  // B. Obtenemos el stock actual del medicamento
  const { data: medActual, error: errorMed } = await supabaseAdmin
    .from('medicamento')
    .select('stock_actual')
    .eq('id_medicamento', datosLote.id_medicamento)
    .single();

  if (errorMed) throw new Error(`Error al leer medicamento: ${errorMed.message}`);

  // C. Sumamos el stock y actualizamos la tabla principal
  const nuevoStock = medActual.stock_actual + datosLote.cantidad;

  const { error: errorUpdate } = await supabaseAdmin
    .from('medicamento')
    .update({ stock_actual: nuevoStock })
    .eq('id_medicamento', datosLote.id_medicamento);

  if (errorUpdate) throw new Error(`Error al actualizar stock global: ${errorUpdate.message}`);

  return nuevoLote;
}