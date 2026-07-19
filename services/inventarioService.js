// services/inventarioService.js
import * as inventarioRepo from '../repositories/inventarioRepository.js';

export async function registrarIngreso(payload) {
  const { id_medicamento, id_proveedor, numero_lote, cantidad, fecha_vencimiento } = payload;

  // Validaciones de negocio
  if (!id_medicamento || !id_proveedor || !numero_lote || !cantidad || !fecha_vencimiento) {
    return { ok: false, status: 400, mensaje: "Faltan datos obligatorios para el ingreso." };
  }

  if (cantidad <= 0) {
    return { ok: false, status: 400, mensaje: "La cantidad debe ser mayor a 0." };
  }

  // Validar que no estemos ingresando medicamento ya vencido
  const fechaVenc = new Date(fecha_vencimiento);
  const hoy = new Date();
  if (fechaVenc <= hoy) {
    return { ok: false, status: 400, mensaje: "No se pueden ingresar lotes vencidos." };
  }

  try {
    const lote = await inventarioRepo.registrarIngresoLote({
      id_medicamento,
      id_proveedor,
      numero_lote,
      cantidad,
      fecha_vencimiento
    });

    return { 
      ok: true, 
      status: 201, 
      mensaje: "Lote ingresado y stock actualizado correctamente.", 
      lote 
    };
  } catch (error) {
    console.error("Error en servicio de inventario:", error);
    return { ok: false, status: 500, mensaje: "Error interno al procesar el ingreso." };
  }
}