import { obtenerResumenFinanciero, registrarMovimientoFinanciero } from '../repositories/finanzasRepository.js';
import { traducirError } from '../lib/errorMessages.js';

const TIPOS = ['ingreso', 'egreso'];

export async function listarFinanzas(filtro = {}) {
  try {
    const data = await obtenerResumenFinanciero({ dias: Number(filtro.dias || 30) });
    return { ok: true, status: 200, ...data };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: traducirError(err) } };
  }
}

export async function crearMovimientoFinanciero(payload = {}) {
  const tipo = String(payload.tipo || '').toLowerCase();
  const monto = Number(payload.monto);
  const concepto = payload.concepto?.trim();

  const errores = {};
  if (!TIPOS.includes(tipo)) errores.tipo = 'Selecciona ingreso o egreso.';
  if (!Number.isFinite(monto) || monto <= 0) errores.monto = 'El monto debe ser mayor a cero.';
  if (!concepto) errores.concepto = 'Debes registrar el concepto.';

  if (Object.keys(errores).length) {
    return { ok: false, status: 400, errores };
  }

  try {
    const movimiento = await registrarMovimientoFinanciero({
      tipo,
      categoria: payload.categoria?.trim() || (tipo === 'ingreso' ? 'Ingreso manual' : 'Egreso manual'),
      concepto,
      monto,
      metodo_pago: payload.metodo_pago || null,
      referencia: payload.referencia?.trim() || null,
      fecha_movimiento: payload.fecha_movimiento || new Date().toISOString(),
      observaciones: payload.observaciones?.trim() || null,
    });

    return { ok: true, status: 201, mensaje: 'Movimiento financiero registrado.', movimiento };
  } catch (err) {
    return { ok: false, status: 500, errores: { general: traducirError(err) } };
  }
}
