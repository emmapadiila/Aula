import { icon } from '../core/icons.js';
import { esc } from '../core/ui.js';

/** Menú por rol (mismo orden y textos que el diseño de Figma) */
export const NAV = {
  admin: [
    { path: '/dashboard', label: 'Inicio', ico: 'layout-dashboard' },
    { path: '/students', label: 'Estudiantes', ico: 'users' },
    { path: '/teachers', label: 'Profesores', ico: 'graduation-cap' },
    { path: '/classrooms', label: 'Salones', ico: 'book-open' },
    { path: '/schedules', label: 'Horarios', ico: 'calendar-days' },
    { path: '/qr', label: 'Generar códigos QR', ico: 'qr-code' },
    { path: '/scan', label: 'Escanear asistencia', ico: 'scan-line' },
    { path: '/attendance', label: 'Registro de asistencia', ico: 'user-check' },
    { path: '/reports', label: 'Reportes', ico: 'trending-up' },
    { path: '/excel', label: 'Exportar a Excel', ico: 'file-spreadsheet' },
    { path: '/settings', label: 'Configuración', ico: 'settings' },
  ],
  teacher: [
    { path: '/dashboard', label: 'Mis salones', ico: 'book-open' },
    { path: '/schedules', label: 'Mis horarios', ico: 'calendar-days' },
    { path: '/scan', label: 'Escanear asistencia', ico: 'scan-line' },
    { path: '/students', label: 'Mis estudiantes', ico: 'users' },
    { path: '/attendance', label: 'Historial', ico: 'rotate-ccw-clock' },
    { path: '/reports', label: 'Reportes de clase', ico: 'trending-up' },
  ],
};

export function renderSidebar(el, role, activePath) {
  const base = '/' + (activePath.split('/')[1] || '');
  el.innerHTML = `
    <div class="sidebar-head"><img class="logo-img" src="assets/logo.png" alt="Escudo del Colegio María Montessori" /><div>Colegio María Montessori<small>El Copey · Cesar</small></div></div>
    <nav class="nav">
      <span class="nav-label">Principal</span>
      ${NAV[role].map((i) => `
        <a href="#${i.path}" class="${i.path === base ? 'active' : ''}">${icon(i.ico)}<span>${esc(i.label)}</span></a>`).join('')}
    </nav>
    <div class="sidebar-foot"><button id="logout-btn">${icon('log-out')}<span>Cerrar sesión</span></button></div>`;
}
