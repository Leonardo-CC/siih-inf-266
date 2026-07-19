// api/usuarios/actualizar.js
import { editarUsuario } from '../../services/usuarioService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const { id_usuario, ...rest } = req.body;
    const resultado = await editarUsuario(id_usuario, rest);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/usuarios/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
