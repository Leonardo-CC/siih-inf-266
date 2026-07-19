// api/farmacia/dashboard.js
import { obtenerDashboardFarmacia } from '../../services/farmaciaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const resultado = await obtenerDashboardFarmacia();
  
  if (resultado.ok) {
    return res.status(200).json(resultado);
  } else {
    return res.status(500).json(resultado);
  }
}