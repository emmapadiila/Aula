import { api } from '../core/api.js';
import { badge, esc, options, pageHead, person } from '../core/ui.js';

const PAGE = 15;

export default {
  title: 'Registro de asistencia',
  async render(root, { isAdmin }) {
    const rooms = await api.get('/classrooms');
    const f = { search: '', date: '', classroomId: '', status: '', offset: 0 };

    root.innerHTML = `
      ${pageHead(isAdmin ? 'Registro de asistencia' : 'Historial', 'Consulta registros por fecha, clase, estudiante o estado.')}
      <section class="card">
        <form class="filters" id="f" style="margin-bottom:14px">
          <input class="input" name="search" placeholder="Buscar en la lista..." />
          <input class="input" type="date" name="date" />
          <select class="select" name="classroomId">${options(rooms, 'id', 'name', '', 'Todos los salones')}</select>
          <select class="select" name="status"><option value="">Todos los estados</option>
            ${['Temprano', 'Puntual', 'Tarde', 'Inasistencia'].map((s) => `<option>${s}</option>`).join('')}</select>
          <button class="btn btn-primary">Aplicar filtros</button>
        </form>
        <div class="table-wrap"><table>
          <thead><tr><th>Estudiante</th><th>Salón</th><th>Clase</th><th>Fecha</th><th>Programada</th><th>Llegada</th><th>Estado</th></tr></thead>
          <tbody id="rows"></tbody></table></div>
        <div class="table-foot"><span id="count"></span>
          <div class="filters"><button class="btn btn-outline btn-sm" id="prev">Anterior</button><button class="btn btn-outline btn-sm" id="next">Siguiente</button></div></div>
      </section>`;

    const $ = (s) => root.querySelector(s);
    const load = async () => {
      const { total, rows } = await api.get('/attendance', { ...f, limit: PAGE });
      $('#rows').innerHTML = rows.map((a) => `
        <tr><td>${person(a.student, a.code)}</td><td>${esc(a.classroom)}</td><td>${esc(a.subject)}</td><td>${esc(a.date)}</td>
        <td>${esc(a.scheduled_time)}</td><td>${esc(a.arrival_time ?? '—')}</td><td>${badge(a.status)}</td></tr>`).join('')
        || '<tr><td colspan="7" class="empty">Sin registros para estos filtros</td></tr>';
      $('#count').textContent = total ? `Mostrando ${f.offset + 1}–${f.offset + rows.length} de ${total.toLocaleString('es-CO')}` : '';
      $('#prev').disabled = f.offset === 0;
      $('#next').disabled = f.offset + PAGE >= total;
    };

    $('#f').addEventListener('submit', (e) => {
      e.preventDefault();
      Object.assign(f, Object.fromEntries(new FormData(e.target)), { offset: 0 });
      load();
    });
    $('#prev').addEventListener('click', () => { f.offset -= PAGE; load(); });
    $('#next').addEventListener('click', () => { f.offset += PAGE; load(); });
    await load();
  },
};
