// api/tecnico-laboratorio/dashboard.js
import { obtenerDashboardLaboratorio } from '../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const filtro = {};
    if (req.query?.id_tecnico_laboratorio) filtro.id_tecnico_laboratorio = Number(req.query.id_tecnico_laboratorio);
    const resultado = await obtenerDashboardLaboratorio(filtro);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/dashboard:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
