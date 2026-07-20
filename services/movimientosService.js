// services/movimientosService.js
// ============================================================
// CAPA DE LOGICA - Movimientos de insumos.
// Entrada / Salida / Transferencia.
// Refleja cambios en inventario sin duplicar.
// ============================================================
import {
  obtenerMedicamento,
  obtenerLote,
  buscarLotesDisponibles,
  ajustarStockMedicamento,
  ajustarCantidadLote,
  insertarLote,
  obtenerProveedor,
  listarProveedores,
  listarMedicamentos,
  listarLotesPorMedicamento,
} from '../repositories/movimientosRepository.js';

function responder(ok, status, datos = {}) {
  return { ok, status, ...datos };
}

// ============================================================
// ENTRADA: ingreso de mercadería desde proveedor
// ============================================================
export async function registrarEntrada({
  id_medicamento,
  id_proveedor,
  numero_lote,
  cantidad,
  fecha_vencimiento,
}) {
  if (!id_medicamento || !id_proveedor || !numero_lote || !cantidad || !fecha_vencimiento) {
    return responder(false, 400, { mensaje: 'Faltan datos obligatorios para el ingreso.' });
  }
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    return responder(false, 400, { mensaje: 'La cantidad debe ser un entero mayor a 0.' });
  }

  const medicamento = await obtenerMedicamento(id_medicamento);
  if (!medicamento) return responder(false, 404, { mensaje: 'Medicamento no encontrado.' });

  const proveedor = await obtenerProveedor(id_proveedor);
  if (!proveedor) return responder(false, 404, { mensaje: 'Proveedor no encontrado.' });

  const fechaVenc = new Date(fecha_vencimiento);
  const hoy = new Date();
  if (fechaVenc <= hoy) {
    return responder(false, 400, { mensaje: 'No se pueden ingresar lotes vencidos.' });
  }

  const lote = await insertarLote({
    id_medicamento,
    id_proveedor,
    numero_lote,
    cantidad: cant,
    fecha_vencimiento,
  });

  const nuevoStock = await ajustarStockMedicamento(id_medicamento, cant);

  return responder(true, 201, {
    mensaje: 'Ingreso registrado y stock actualizado.',
    tipo: 'entrada',
    lote,
    stock_actual: nuevoStock,
  });
}

// ============================================================
// SALIDA: egreso directo de inventario
// ============================================================
export async function registrarSalida({
  id_medicamento,
  id_lote,
  cantidad,
  motivo,
}) {
  if (!id_medicamento || !cantidad) {
    return responder(false, 400, { mensaje: 'Medicamento y cantidad son obligatorios.' });
  }
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    return responder(false, 400, { mensaje: 'La cantidad debe ser un entero mayor a 0.' });
  }

  const medicamento = await obtenerMedicamento(id_medicamento);
  if (!medicamento) return responder(false, 404, { mensaje: 'Medicamento no encontrado.' });

  let lotes = [];
  let loteUsado = null;
  let cantidadDescontada = 0;

  if (id_lote) {
    loteUsado = await obtenerLote(id_lote);
    if (!loteUsado) return responder(false, 404, { mensaje: 'Lote no encontrado.' });
    if (loteUsado.id_medicamento !== id_medicamento) {
      return responder(false, 400, { mensaje: 'El lote no corresponde al medicamento.' });
    }
    if (loteUsado.cantidad_actual < cant) {
      return responder(false, 400, { mensaje: 'Stock insuficiente en el lote seleccionado.' });
    }
    await ajustarCantidadLote(id_lote, -cant);
    cantidadDescontada = cant;
  } else {
    lotes = await buscarLotesDisponibles(id_medicamento);
    let faltante = cant;
    let totalDisponible = lotes.reduce((acc, l) => acc + l.cantidad_actual, 0);
    if (totalDisponible < cant) {
      return responder(false, 400, {
        mensaje: `Stock insuficiente. Disponible: ${totalDisponible}. Solicitado: ${cant}.`,
      });
    }
    for (const lote of lotes) {
      if (faltante <= 0) break;
      const aDescontar = Math.min(lote.cantidad_actual, faltante);
      await ajustarCantidadLote(lote.id_lote, -aDescontar);
      faltante -= aDescontar;
      cantidadDescontada += aDescontar;
      if (!loteUsado && aDescontar > 0) loteUsado = lote;
    }
  }

  const nuevoStock = await ajustarStockMedicamento(id_medicamento, -cantidadDescontada);

  return responder(true, 200, {
    mensaje: 'Salida registrada y stock actualizado.',
    tipo: 'salida',
    lote: loteUsado ? { id_lote: loteUsado.id_lote } : null,
    cantidad_descontada: cantidadDescontada,
    stock_actual: nuevoStock,
    motivo: motivo || null,
  });
}

// ============================================================
// TRANSFERENCIA: mover stock entre medicamentos o lotes
// ============================================================
export async function registrarTransferencia({
  id_medicamento_origen,
  id_lote_origen,
  id_medicamento_destino,
  id_lote_destino,
  cantidad,
  motivo,
}) {
  if (!id_medicamento_origen || !id_medicamento_destino || !cantidad) {
    return responder(false, 400, { mensaje: 'Origen, destino y cantidad son obligatorios.' });
  }
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant <= 0) {
    return responder(false, 400, { mensaje: 'La cantidad debe ser un entero mayor a 0.' });
  }
  if (id_medicamento_origen === id_medicamento_destino && id_lote_origen === id_lote_destino) {
    return responder(false, 400, { mensaje: 'El origen y destino no pueden ser iguales.' });
  }

  const medOrigen = await obtenerMedicamento(id_medicamento_origen);
  if (!medOrigen) return responder(false, 404, { mensaje: 'Medicamento origen no encontrado.' });

  const medDestino = await obtenerMedicamento(id_medicamento_destino);
  if (!medDestino) return responder(false, 404, { mensaje: 'Medicamento destino no encontrado.' });

  let loteOrigen = null;
  let cantidadTransferida = 0;

  if (id_lote_origen) {
    loteOrigen = await obtenerLote(id_lote_origen);
    if (!loteOrigen) return responder(false, 404, { mensaje: 'Lote origen no encontrado.' });
    if (loteOrigen.id_medicamento !== id_medicamento_origen) {
      return responder(false, 400, { mensaje: 'El lote origen no corresponde al medicamento origen.' });
    }
    if (loteOrigen.cantidad_actual < cant) {
      return responder(false, 400, { mensaje: 'Stock insuficiente en el lote origen.' });
    }
    await ajustarCantidadLote(id_lote_origen, -cant);
    cantidadTransferida = cant;
  } else {
    const lotes = await buscarLotesDisponibles(id_medicamento_origen);
    const total = lotes.reduce((acc, l) => acc + l.cantidad_actual, 0);
    if (total < cant) {
      return responder(false, 400, {
        mensaje: `Stock insuficiente en origen. Disponible: ${total}. Solicitado: ${cant}.`,
      });
    }
    let faltante = cant;
    for (const lote of lotes) {
      if (faltante <= 0) break;
      const aTransferir = Math.min(lote.cantidad_actual, faltante);
      await ajustarCantidadLote(lote.id_lote, -aTransferir);
      faltante -= aTransferir;
      cantidadTransferida += aTransferir;
      if (!loteOrigen) loteOrigen = lote;
    }
  }

  await ajustarStockMedicamento(id_medicamento_origen, -cantidadTransferida);

  let loteDestino = null;
  if (id_lote_destino) {
    loteDestino = await obtenerLote(id_lote_destino);
    if (!loteDestino) return responder(false, 404, { mensaje: 'Lote destino no encontrado.' });
    if (loteDestino.id_medicamento !== id_medicamento_destino) {
      return responder(false, 400, { mensaje: 'El lote destino no corresponde al medicamento destino.' });
    }
    await ajustarCantidadLote(id_lote_destino, cantidadTransferida);
  } else {
    const proveedorDestino = loteOrigen?.id_proveedor || null;
    loteDestino = await insertarLote({
      id_medicamento: id_medicamento_destino,
      id_proveedor: proveedorDestino,
      numero_lote: `TRANSF-${Date.now()}`,
      cantidad: cantidadTransferida,
      fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  }

  await ajustarStockMedicamento(id_medicamento_destino, cantidadTransferida);

  return responder(true, 200, {
    mensaje: 'Transferencia registrada y stock actualizado.',
    tipo: 'transferencia',
    origen: { id_medicamento: id_medicamento_origen, id_lote: loteOrigen?.id_lote },
    destino: { id_medicamento: id_medicamento_destino, id_lote: loteDestino.id_lote },
    cantidad_transferida: cantidadTransferida,
    motivo: motivo || null,
  });
}
