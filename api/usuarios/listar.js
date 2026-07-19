// api/usuarios/listar.js
import { obtenerUsuarios } from '../../services/usuarioService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const resultado = await obtenerUsuarios();
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/usuarios/listar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
