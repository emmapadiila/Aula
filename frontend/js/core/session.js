/** Sesión del usuario guardada en localStorage. */
const KEY = 'asistencia.session';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}

export const getSession = () => read();
export const getToken = () => read()?.token ?? null;
export const getUser = () => read()?.user ?? null;
export const isAdmin = () => getUser()?.role === 'admin';

export function saveSession(session) {
  try { localStorage.setItem(KEY, JSON.stringify(session)); } catch { /* modo privado */ }
}

export function logout() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  location.href = 'index.html';
}
