import { obtenerPerfilMedico, actualizarPerfilMedico, recuperarContrasenaMedico } from '../../services/medicoPerfilService.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const id_medico = Number(req.query?.id_medico);
    if (!id_medico) return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del médico.' });
    const resultado = await obtenerPerfilMedico(id_medico);
    return res.status(resultado.status).json(resultado);
  }

  if (req.method === 'PUT') {
    const { id_medico, ...resto } = req.body || {};
    if (!id_medico) return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del médico.' });
    const resultado = await actualizarPerfilMedico(Number(id_medico), resto);
    return res.status(resultado.status).json(resultado);
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
}
