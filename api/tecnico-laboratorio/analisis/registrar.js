// api/tecnico-laboratorio/analisis/registrar.js
import { registrarAnalisis } from '../../../services/tecnicoLaboratorioService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  try {
    const resultado = await registrarAnalisis(req.body || {});
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/tecnico-laboratorio/analisis/registrar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
