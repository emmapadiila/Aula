import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { badge, esc, person, statCard, todayLong } from '../core/ui.js';

export default {
  title: 'Inicio',
  async render(root, { user }) {
    const [summary, rooms, daily, latest] = await Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/by-classroom'),
      api.get('/reports/daily'),
      api.get('/attendance', { limit: 6 }),
    ]);

    root.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">${esc(todayLong())}</p>
          <h1>Buenos días, ${esc(user.name.split(' ')[0])}</h1>
          <p>Así avanza la asistencia en tu institución hoy.</p>
        </div>
        <div class="filters">
          <a class="btn btn-outline" href="#/excel">${icon('file-spreadsheet')} Exportar</a>
          <a class="btn btn-primary" href="#/students/new">${icon('plus')} Registrar estudiante</a>
        </div>
      </div>

      <div class="grid grid-4">
        ${statCard({ label: 'Estudiantes', value: summary.students.toLocaleString('es-CO'), ico: 'users', tone: 'blue' })}
        ${statCard({ label: 'Asistencias hoy', value: summary.present, sub: `${summary.rate}% de asistencia`, ico: 'user-check', tone: 'green' })}
        ${statCard({ label: 'Llegadas tarde', value: summary.Tarde, ico: 'clock-3', tone: 'orange' })}
        ${statCard({ label: 'Inasistencias', value: summary.Inasistencia, ico: 'circle-alert', tone: 'red' })}
      </div>

      <div class="grid grid-2-1">
        <section class="card">
          <div class="card-head"><h2>Asistencia semanal</h2><span class="muted">Porcentaje de estudiantes presentes</span></div>
          ${daily.length ? `<div class="chart-cols">${daily.map((d) => `
            <div class="col" title="${d.rate}%"><small>${d.rate}%</small><i style="height:${d.rate}%"></i>
            <small>${new Date(`${d.date}T12:00`).toLocaleDateString('es-CO', { weekday: 'short' })}</small></div>`).join('')}</div>`
            : '<p class="empty">Sin datos esta semana</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>Asistencia por salón</h2></div>
          ${rooms.map((r) => `
            <div class="bar-row"><strong>${esc(r.classroom)}</strong>
              <div class="bar"><span style="width:${r.rate}%"></span></div><span>${r.rate}%</span></div>`).join('')}
        </section>
      </div>

      <section class="card">
        <div class="card-head"><h2>Últimos registros</h2><a href="#/attendance">Ver todos</a></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Estudiante</th><th>Salón</th><th>Fecha</th><th>Programada</th><th>Llegada</th><th>Estado</th></tr></thead>
          <tbody>${latest.rows.map((a) => `
            <tr><td>${person(a.student, a.code)}</td><td>${esc(a.classroom)}</td><td>${esc(a.date)}</td>
            <td>${esc(a.scheduled_time)}</td><td>${esc(a.arrival_time ?? '—')}</td><td>${badge(a.status)}</td></tr>`).join('')}
          </tbody></table></div>
      </section>`;
  },
};
