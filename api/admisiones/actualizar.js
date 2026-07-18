// api/admisiones/actualizar.js
import { editarAdmision } from '../../services/admisionService.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  try {
    const resultado = await editarAdmision(req.body.id_consulta, req.body);
    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Error en /api/admisiones/actualizar:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}
