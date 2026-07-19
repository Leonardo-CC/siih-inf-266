// api/usuarios/eliminar.js
import { borrarUsuario } from '../../services/usuarioService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_usuario } = req.body;
    if (!id_usuario) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario requerido.' });
    }

    const resultado = await borrarUsuario(id_usuario);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/usuarios/eliminar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
