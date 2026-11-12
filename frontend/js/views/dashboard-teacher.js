import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, statCard, todayLong } from '../core/ui.js';

export default {
  title: 'Mis salones',
  async render(root, { user }) {
    const [today, rooms, summary] = await Promise.all([
      api.get('/schedules/today'),
      api.get('/classrooms'),
      api.get('/reports/summary'),
    ]);
    const now = new Date().toTimeString().slice(0, 5);
    const next = today.find((c) => c.end_time >= now);

    root.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">${esc(todayLong())}</p>
          <h1>Buenos días, ${esc(user.name.split(' ')[0])}</h1>
          <p>Tienes ${today.length} clases programadas para hoy.</p>
        </div>
        <a class="btn btn-primary" href="#/scan${next ? `?scheduleId=${next.id}` : ''}">${icon('scan-line')} Escanear asistencia</a>
      </div>

      <div class="grid grid-4">
        ${statCard({ label: 'Clases hoy', value: today.length, ico: 'calendar-days', tone: 'blue' })}
        ${statCard({ label: 'Presentes', value: summary.present, ico: 'user-check', tone: 'green' })}
        ${statCard({ label: 'Tarde', value: summary.Tarde, ico: 'clock-3', tone: 'orange' })}
        ${statCard({ label: 'Inasistencias', value: summary.Inasistencia, ico: 'circle-alert', tone: 'red' })}
      </div>

      <div class="grid grid-2-1">
        <section class="card">
          <div class="card-head"><h2>Clases de hoy</h2></div>
          ${today.length ? `<div class="list">${today.map((c) => `
            <div class="list-item">
              <div class="stat tone-blue"><div class="ico">${icon('book-open')}</div></div>
              <div class="grow"><strong>${esc(c.subject)} · Salón ${esc(c.classroom)}</strong>
                <div class="muted">${esc(c.start_time)} – ${esc(c.end_time)} · ${c.student_count} estudiantes</div></div>
              ${next?.id === c.id ? '<span class="badge badge-Puntual">Próxima clase</span>' : ''}
              <a class="btn btn-outline btn-sm" href="#/scan?scheduleId=${c.id}">Escanear</a>
            </div>`).join('')}</div>` : '<p class="empty">No tienes clases hoy. Todo bajo control.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>Mis salones</h2></div>
          <p class="muted" style="margin-bottom:8px">Accesos rápidos a tus grupos asignados.</p>
          <div class="list">${rooms.map((r) => `
            <a class="list-item" href="#/students?classroomId=${r.id}">
              <span class="avatar">${esc(r.name)}</span>
              <div class="grow"><strong>Salón ${esc(r.name)}</strong><div class="muted">${r.student_count} estudiantes</div></div>
            </a>`).join('')}</div>
        </section>
      </div>`;
  },
};
