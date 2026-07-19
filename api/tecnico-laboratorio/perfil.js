// api/tecnico-laboratorio/perfil.js
import { obtenerPerfilTecnico, actualizarPerfilTecnico } from '../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const id_tecnico_laboratorio = Number(req.query?.id_tecnico_laboratorio);
      if (!id_tecnico_laboratorio) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del técnico.' });
      }
      const resultado = await obtenerPerfilTecnico(id_tecnico_laboratorio);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en GET /api/tecnico-laboratorio/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id_tecnico_laboratorio, ...resto } = req.body || {};
      if (!id_tecnico_laboratorio) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del técnico.' });
      }
      const resultado = await actualizarPerfilTecnico(Number(id_tecnico_laboratorio), resto);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en PUT /api/tecnico-laboratorio/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
}
