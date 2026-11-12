import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, options, pageHead } from '../core/ui.js';

export default {
  title: 'Generar códigos QR',
  async render(root) {
    const rooms = await api.get('/classrooms');
    root.innerHTML = `
      ${pageHead('Generar códigos QR', 'Crea, descarga e imprime identificadores únicos para tus estudiantes.',
        `<select class="select" id="room">${options(rooms, 'id', 'name', rooms[0]?.id)}</select>
         <button class="btn btn-primary" id="print">${icon('printer')} Imprimir</button>`)}
      <section class="card"><div class="filters" style="margin-bottom:14px">
        <span class="badge badge-Puntual">${icon('shield-check')} Identificador seguro</span>
        <span class="muted">Los códigos QR no exponen datos personales · Diseño listo para impresión</span></div>
        <div class="qr-grid" id="grid"><p class="loading">Cargando…</p></div></section>`;

    const grid = root.querySelector('#grid');
    const load = async (classroomId) => {
      grid.innerHTML = '<p class="loading">Generando…</p>';
      const { rows } = await api.get('/students', { classroomId, limit: 200 });
      const qrs = await Promise.all(rows.map((s) => api.get(`/students/${s.id}/qr`)));
      grid.innerHTML = qrs.map(({ student: s, qr }) => `
        <div class="card qr-card"><img src="${qr}" alt="QR ${esc(s.code)}" /><strong>${esc(s.name)}</strong>
          <span class="muted">${esc(s.code)} · ${esc(s.classroom)}</span></div>`).join('') || '<p class="empty">Este salón no tiene estudiantes</p>';
    };

    root.querySelector('#room').addEventListener('change', (e) => load(e.target.value));
    root.querySelector('#print').addEventListener('click', () => window.print());
    if (rooms[0]) await load(rooms[0].id);
  },
};
