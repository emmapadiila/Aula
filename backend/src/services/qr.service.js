import crypto from 'node:crypto';
import QRCode from 'qrcode';

/**
 * El QR solo contiene un token aleatorio con prefijo de la app.
 * No expone nombre, documento ni ningún dato personal.
 */
const PREFIX = 'ASQR:';

export const newToken = () => crypto.randomBytes(16).toString('hex');
export const payloadFor = (token) => `${PREFIX}${token}`;

/** Extrae el token de lo leído por la cámara; null si no es un QR del sistema */
export function parsePayload(raw) {
  const text = String(raw ?? '').trim();
  if (!text.startsWith(PREFIX)) return null;
  const token = text.slice(PREFIX.length);
  return /^[a-f0-9]{32}$/.test(token) ? token : null;
}

export const toDataURL = (token) => QRCode.toDataURL(payloadFor(token), { margin: 1, width: 320 });
export const toPNG = (token) => QRCode.toBuffer(payloadFor(token), { margin: 1, width: 600 });
