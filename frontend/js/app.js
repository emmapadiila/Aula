/**
 * Punto de entrada del panel (app.html).
 * Monta el shell (sidebar + topbar) y delega cada ruta a su vista en js/views/.
 */
import { NAV, renderSidebar } from './components/sidebar.js';
import { icon } from './core/icons.js';
import { currentRoute, onRouteChange, register, start } from './core/router.js';
import { getUser, logout } from './core/session.js';
import { esc, initials, toast } from './core/ui.js';

const user = getUser();
if (!user) location.replace('index.html');

// ── Rutas → módulos de vista (carga diferida) ─────────
register('/dashboard', () => import(user.role === 'admin' ? './views/dashboard-admin.js' : './views/dashboard-teacher.js'));
register('/students', () => import('./views/students.js'));
register('/students/new', () => import('./views/student-form.js'));
register('/students/:id', () => import('./views/student-detail.js'));
register('/teachers', () => import('./views/teachers.js'));
register('/classrooms', () => import('./views/classrooms.js'));
register('/schedules', () => import('./views/schedules.js'));
register('/qr', () => import('./views/qr-codes.js'));
register('/attendance', () => import('./views/attendance.js'));
register('/scan', () => import('./views/scan.js'));
register('/reports', () => import('./views/reports.js'));
register('/excel', () => import('./views/excel.js'));
register('/settings', () => import('./views/settings.js'));

// ── Shell ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const sidebar = $('sidebar');
const backdrop = $('backdrop');
const viewEl = $('view');

$('menu-btn').innerHTML = icon('menu');
$('notif-btn').innerHTML = icon('bell');
$('user-chip').innerHTML = `
  <span class="avatar">${esc(initials(user.name))}</span>
  <div class="who"><strong>${esc(user.name)}</strong><small>${user.role === 'admin' ? 'Administrador' : 'Profesor'} · Colegio María Montessori</small></div>`;

const toggleMenu = (open) => {
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('show', open);
};
$('menu-btn').addEventListener('click', () => toggleMenu(true));
backdrop.addEventListener('click', () => toggleMenu(false));
$('notif-btn').addEventListener('click', () => toast('No tienes notificaciones nuevas'));

let cleanup = null;

onRouteChange(async ({ path, params, view }) => {
  // Solo se permiten rutas que estén en el menú del rol (o sus subrutas)
  const allowed = NAV[user.role].some((i) => path === i.path || path.startsWith(`${i.path}/`));
  if (!allowed) return void (location.hash = '#/dashboard');

  renderSidebar(sidebar, user.role, path);
  $('logout-btn').addEventListener('click', logout);
  toggleMenu(false);

  if (typeof cleanup === 'function') cleanup();
  document.title = `${view.title} · Asistencia QR`;
  $('topbar-title').innerHTML = `<strong>${esc(view.title)}</strong>`;
  viewEl.innerHTML = '<div class="loading">Cargando…</div>';
  try {
    cleanup = await view.render(viewEl, { params, user, isAdmin: user.role === 'admin' });
  } catch (err) {
    viewEl.innerHTML = `<div class="card empty">${esc(err.message)}</div>`;
  }
});

if (!currentRoute().path || currentRoute().path === '/') location.hash = '#/dashboard';
start('/dashboard');
