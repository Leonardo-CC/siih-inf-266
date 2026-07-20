import crypto from 'crypto';

const TTL_MS = 5 * 60 * 1000;

function secret() {
  return process.env.CAPTCHA_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'siih-captcha-dev';
}

function firmar(payloadBase64) {
  return crypto.createHmac('sha256', secret()).update(payloadBase64).digest('base64url');
}

function hashRespuesta(respuesta, nonce) {
  return crypto.createHmac('sha256', secret()).update(`${nonce}:${String(respuesta).trim().toUpperCase()}`).digest('hex');
}

function codigoAleatorio() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 5; i++) {
    codigo += chars[crypto.randomInt(0, chars.length)];
  }
  return codigo;
}

function generarSvgCaptcha(codigo) {
  const ancho = 148;
  const alto = 46;
  const fondos = ['#65c7dc', '#6fcfe3', '#56bdd6', '#7ed6e8'];
  const lineas = Array.from({ length: 9 }, () => {
    const x1 = crypto.randomInt(0, ancho);
    const y1 = crypto.randomInt(0, alto);
    const x2 = crypto.randomInt(0, ancho);
    const y2 = crypto.randomInt(0, alto);
    const color = ['#ffffff', '#287f96', '#b9f3fb'][crypto.randomInt(0, 3)];
    const opacity = (crypto.randomInt(22, 62) / 100).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.2" opacity="${opacity}" />`;
  }).join('');

  const puntos = Array.from({ length: 80 }, () => {
    const cx = crypto.randomInt(0, ancho);
    const cy = crypto.randomInt(0, alto);
    const r = crypto.randomInt(1, 3);
    const color = ['#ffffff', '#2f95aa', '#9ee8f2'][crypto.randomInt(0, 3)];
    const opacity = (crypto.randomInt(20, 70) / 100).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" />`;
  }).join('');

  const letras = codigo.split('').map((letra, index) => {
    const x = 24 + index * 22;
    const y = crypto.randomInt(29, 36);
    const rotacion = crypto.randomInt(-13, 14);
    return `<text x="${x}" y="${y}" transform="rotate(${rotacion} ${x} ${y})" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700" fill="#ffffff" stroke="#257f94" stroke-width="0.45">${letra}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fondos[crypto.randomInt(0, fondos.length)]}" />
        <stop offset="100%" stop-color="${fondos[crypto.randomInt(0, fondos.length)]}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="4" fill="url(#bg)" />
    ${puntos}
    ${lineas}
    ${letras}
    <path d="M0 33 C36 25, 72 42, 148 24" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.45" />
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function crearCaptcha() {
  const codigo = codigoAleatorio();
  const nonce = crypto.randomBytes(12).toString('base64url');
  const exp = Date.now() + TTL_MS;
  const payload = {
    nonce,
    exp,
    answerHash: hashRespuesta(codigo, nonce),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return {
    imagen: generarSvgCaptcha(codigo),
    token: `${payloadBase64}.${firmar(payloadBase64)}`,
    expira_en_segundos: Math.floor(TTL_MS / 1000),
  };
}

export function validarCaptcha(token, respuesta) {
  if (!token || respuesta === undefined || respuesta === null || respuesta === '') {
    return { ok: false, mensaje: 'Completa el captcha.' };
  }

  const [payloadBase64, firma] = String(token).split('.');
  if (!payloadBase64 || !firma || firmar(payloadBase64) !== firma) {
    return { ok: false, mensaje: 'Captcha invalido. Actualiza e intenta nuevamente.' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, mensaje: 'Captcha invalido. Actualiza e intenta nuevamente.' };
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return { ok: false, mensaje: 'El captcha expiro. Actualiza e intenta nuevamente.' };
  }

  const esperado = payload.answerHash;
  const recibido = hashRespuesta(String(respuesta).trim(), payload.nonce);
  if (esperado !== recibido) {
    return { ok: false, mensaje: 'Captcha incorrecto.' };
  }

  return { ok: true };
}
