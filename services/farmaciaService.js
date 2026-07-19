// services/farmaciaService.js
import { obtenerEstadisticasDashboard } from '../repositories/farmaciaRepository.js';

export async function obtenerDashboardFarmacia() {
  try {
    const stats = await obtenerEstadisticasDashboard();
    return { ok: true, stats };
  } catch (error) {
    console.error("Error al cargar stats de farmacia:", error);
    return { ok: false, mensaje: "No se pudieron cargar las estadísticas." };
  }
}