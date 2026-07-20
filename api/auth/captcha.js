import { crearCaptcha } from '../../services/captchaService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, mensaje: 'Metodo no permitido.' });
  }

  return res.status(200).json({ ok: true, captcha: crearCaptcha() });
}
