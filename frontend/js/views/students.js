import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, options, pageHead, person } from '../core/ui.js';

const PAGE = 10;

export default {
  title: 'Estudiantes',
  async render(root, { params, isAdmin }) {
    const rooms = await api.get('/classrooms');
    const state = { search: '', classroomId: params.classroomId || '', offset: 0 };

    root.innerHTML = `
      ${pageHead(isAdmin ? 'Estudiantes' : 'Mis estudiantes', '',
        isAdmin ? `<a class="btn btn-primary" href="#/students/new">${icon('plus')} Registrar estudiante</a>` : '')}
      <section class="card">
        <div class="filters" style="margin-bottom:14px">
          <input class="input" id="q" placeholder="Buscar estudiante..." />
          <select class="select" id="room">${options(rooms, 'id', 'name', state.classroomId, 'Todos los salones')}</select>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Estudiante</th><th>Identificación</th><th>Salón</th><th>Estado</th><th></th></tr></thead>
          <tbody id="rows"><tr><td colspan="5" class="loading">Cargando…</td></tr></tbody>
        </table></div>
        <div class="table-foot"><span id="count"></span>
          <div class="filters"><button class="btn btn-outline btn-sm" id="prev">Anterior</button><button class="btn btn-outline btn-sm" id="next">Siguiente</button></div></div>
      </section>`;

    const $ = (s) => root.querySelector(s);
    const load = async () => {
      const { total, rows } = await api.get('/students', { search: state.search, classroomId: state.classroomId, limit: PAGE, offset: state.offset });
      $('#rows').innerHTML = rows.length ? rows.map((s) => `
        <tr><td>${person(s.name, s.email)}</td><td>${esc(s.code)}</td><td>${esc(s.classroom ?? '—')}</td>
          <td><span class="badge badge-${s.active ? 'Activo' : 'Inactivo'}">${s.active ? 'Activo' : 'Inactivo'}</span></td>
          <td><a class="btn btn-outline btn-sm" href="#/students/${s.id}">Ver perfil</a></td></tr>`).join('')
        : '<tr><td colspan="5" class="empty">Sin resultados</td></tr>';
      $('#count').textContent = total ? `Mostrando ${state.offset + 1}–${state.offset + rows.length} de ${total.toLocaleString('es-CO')}` : '';
      $('#prev').disabled = state.offset === 0;
      $('#next').disabled = state.offset + PAGE >= total;
    };

    let t;
    $('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.search = e.target.value; state.offset = 0; load(); }, 250); });
    $('#room').addEventListener('change', (e) => { state.classroomId = e.target.value; state.offset = 0; load(); });
    $('#prev').addEventListener('click', () => { state.offset -= PAGE; load(); });
    $('#next').addEventListener('click', () => { state.offset += PAGE; load(); });
    await load();
  },
};
