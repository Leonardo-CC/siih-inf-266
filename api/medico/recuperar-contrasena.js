import { recuperarContrasenaMedico } from '../../services/medicoPerfilService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
  }

  const resultado = await recuperarContrasenaMedico(req.body || {});
  return res.status(resultado.status).json(resultado);
}
