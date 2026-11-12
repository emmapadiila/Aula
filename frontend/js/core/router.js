/**
 * Router por hash: #/students, #/students/new, #/scan?scheduleId=3
 * Cada ruta apunta a un módulo de vista con export default { title, render(ctx) }.
 */
const routes = new Map();
let onChange = () => {};

export function register(path, loader) { routes.set(path, loader); }
export function onRouteChange(fn) { onChange = fn; }
export const navigate = (path) => { location.hash = `#${path}`; };

export function currentRoute() {
  const [path, query = ''] = location.hash.slice(1).split('?');
  return { path: path || '/', params: Object.fromEntries(new URLSearchParams(query)) };
}

/** Busca la ruta registrada; soporta un segmento dinámico ":id" */
function match(path) {
  if (routes.has(path)) return { loader: routes.get(path), args: {} };
  for (const [pattern, loader] of routes) {
    const a = pattern.split('/');
    const b = path.split('/');
    if (a.length !== b.length) continue;
    const args = {};
    if (a.every((seg, i) => (seg.startsWith(':') ? ((args[seg.slice(1)] = b[i]), true) : seg === b[i]))) {
      return { loader, args };
    }
  }
  return null;
}

export async function start(fallback) {
  const run = async () => {
    const { path, params } = currentRoute();
    const m = match(path);
    if (!m) return navigate(fallback);
    const view = (await m.loader()).default;
    onChange({ path, params: { ...params, ...m.args }, view });
  };
  window.addEventListener('hashchange', run);
  await run();
}
