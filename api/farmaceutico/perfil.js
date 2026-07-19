import { obtenerPerfilFarmaceutico, actualizarPerfilFarmaceutico, recuperarContrasenaFarmaceutico } from '../../services/farmaciaPerfilService.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const id_farmaceutico = Number(req.query?.id_farmaceutico);
    if (!id_farmaceutico) return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del farmacéutico.' });
    const resultado = await obtenerPerfilFarmaceutico(id_farmaceutico);
    return res.status(resultado.status).json(resultado);
  }

  if (req.method === 'PUT') {
    const { id_farmaceutico, ...resto } = req.body || {};
    if (!id_farmaceutico) return res.status(400).json({ ok: false, mensaje: 'Falta el identificador del farmacéutico.' });
    const resultado = await actualizarPerfilFarmaceutico(Number(id_farmaceutico), resto);
    return res.status(resultado.status).json(resultado);
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Método no permitido.' });
}
