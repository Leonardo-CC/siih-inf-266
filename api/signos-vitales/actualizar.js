// api/signos-vitales/actualizar.js
import { editarSignos } from '../../services/signosVitalesService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const usuarioHeader = req.headers['x-user'];
    const usuarioLogueado = usuarioHeader ? JSON.parse(usuarioHeader) : null;
    const resultado = await editarSignos(req.body.id_signos, req.body, usuarioLogueado);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/signos-vitales/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
