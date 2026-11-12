/** Helpers de interfaz compartidos por todas las vistas. */
import { icon } from './icons.js';

/** Escapa texto para insertarlo con innerHTML */
export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const initials = (name = '') => name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const badge = (status) => `<span class="badge badge-${esc(status)}">${esc(status)}</span>`;

export const person = (name, sub) => `
  <div class="person"><span class="avatar">${esc(initials(name))}</span>
    <div><strong>${esc(name)}</strong>${sub ? `<div class="muted" style="font-size:12px">${esc(sub)}</div>` : ''}</div></div>`;

export const statCard = ({ label, value, sub, tone = 'blue', ico = 'users' }) => `
  <div class="card stat tone-${tone}">
    <div class="ico">${icon(ico)}</div>
    <span class="muted">${esc(label)}</span>
    <span class="value">${esc(value)}</span>
    ${sub ? `<span class="trend muted">${esc(sub)}</span>` : ''}
  </div>`;

export const pageHead = (title, subtitle, actions = '') => `
  <div class="page-head"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
  <div class="filters">${actions}</div></div>`;

export const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export const todayLong = () =>
  new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

export const WEEKDAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function toast(message, type = 'info') {
  const el = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: message });
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), 3500);
}

/** Modal simple; devuelve el elemento .modal y una función close() */
export function openModal(html) {
  const host = document.createElement('div');
  host.className = 'modal-host';
  host.innerHTML = `<div class="card modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => host.remove();
  host.addEventListener('click', (e) => { if (e.target === host || e.target.closest('[data-close]')) close(); });
  document.body.append(host);
  return { el: host.querySelector('.modal'), close };
}

/** Lee un <form> a objeto, convirtiendo campos numéricos marcados con data-num */
export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    out[el.name] = el.dataset.num !== undefined && el.value !== '' ? Number(el.value) : el.value;
  }
  return out;
}

export const options = (items, value, label, selected, placeholder) =>
  (placeholder !== undefined ? `<option value="">${esc(placeholder)}</option>` : '') +
  items.map((i) => `<option value="${esc(i[value])}" ${String(i[value]) === String(selected) ? 'selected' : ''}>${esc(i[label])}</option>`).join('');
