/** Utilidades de fecha/hora en hora local del servidor. */
const pad = (n) => String(n).padStart(2, '0');

export const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nowHHMM = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 1 = lunes ... 7 = domingo */
export const weekdayOf = (d = new Date()) => ((d.getDay() + 6) % 7) + 1;

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
