// api/administrativo/perfil.js
import { actualizarMiPerfil, obtenerMiPerfil } from '../../services/adminService.js';

export default async function handler(req, res) {
  const usuario = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  if (!usuario) {
    return res.status(401).json({ ok: false, mensaje: 'No autenticado.' });
  }

  if (req.method === 'GET') {
    try {
      const resultado = await obtenerMiPerfil(usuario.id_usuario);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en GET /api/administrativo/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const resultado = await actualizarMiPerfil(usuario.id_usuario, req.body);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en PUT /api/administrativo/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
}
