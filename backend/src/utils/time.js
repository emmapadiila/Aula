/**
 * Fechas y horas SIEMPRE en la zona horaria del colegio (por defecto America/Bogota),
 * sin importar la zona del servidor (Vercel corre en UTC).
 */
const TIME_ZONE = process.env.APP_TIMEZONE || 'America/Bogota';

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
});

const DAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Partes de la fecha en la zona del colegio */
function parts(d = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return p;
}

/** "2026-11-12" */
export const todayISO = (d = new Date()) => {
  const p = parts(d);
  return `${p.year}-${p.month}-${p.day}`;
};

/** "12:34" */
export const nowHHMM = (d = new Date()) => {
  const p = parts(d);
  return `${p.hour}:${p.minute}`;
};

/** 1 = lunes ... 7 = domingo */
export const weekdayOf = (d = new Date()) => DAYS[parts(d).weekday];

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const TZ = TIME_ZONE;
