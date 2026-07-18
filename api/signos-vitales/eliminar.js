// api/signos-vitales/eliminar.js
import { eliminarSignos } from '../../services/signosVitalesService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const usuarioHeader = req.headers['x-user'];
    const usuarioLogueado = usuarioHeader ? JSON.parse(usuarioHeader) : null;
    const resultado = await eliminarSignos(req.body.id_signos, usuarioLogueado);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/signos-vitales/eliminar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
