// api/paciente/perfil.js
import { obtenerPerfil, actualizarPerfilPaciente } from '../../services/pacientePerfilService.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const id_paciente = Number(req.query?.id_paciente);
      if (!id_paciente) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del paciente.' });
      }
      const resultado = await obtenerPerfil(id_paciente);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en GET /api/paciente/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id_paciente, ...resto } = req.body || {};
      if (!id_paciente) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del paciente.' });
      }
      const resultado = await actualizarPerfilPaciente(Number(id_paciente), resto);
      return res.status(resultado.status).json(resultado);
    } catch (err) {
      console.error('Error en PUT /api/paciente/perfil:', err);
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
}
