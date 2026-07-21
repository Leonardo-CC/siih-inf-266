import {
  darAltaHospitalizacion,
  listarHospitalizacionesAutorizadas,
} from '../../services/hospitalizacionService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const resultado = await listarHospitalizacionesAutorizadas();
    return res.status(resultado.status).json(resultado);
  }

  if (req.method === 'PUT') {
    const resultado = await darAltaHospitalizacion(req.body || {});
    return res.status(resultado.status).json(resultado);
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
}
