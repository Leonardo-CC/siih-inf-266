// api/citas/solicitar.js
import { solicitarCita } from '../../services/citaService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const resultado = await solicitarCita(req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/citas/solicitar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}