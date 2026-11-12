import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, formData, openModal, options, pageHead, toast } from '../core/ui.js';

export default {
  title: 'Salones',
  async render(root) {
    const draw = async () => {
      const [rooms, teachers, stats] = await Promise.all([api.get('/classrooms'), api.get('/teachers'), api.get('/reports/by-classroom')]);
      const rate = Object.fromEntries(stats.map((s) => [s.classroom, s.rate]));
      root.innerHTML = `
        ${pageHead('Salones', 'Administra grupos, profesores y estadísticas de asistencia.', `<button class="btn btn-primary" id="add">${icon('plus')} Nuevo salón</button>`)}
        <div class="grid grid-3">${rooms.map((r) => `
          <section class="card">
            <div class="card-head"><div><p class="eyebrow">Grado ${esc(r.grade)}</p><h2>Salón ${esc(r.name)}</h2></div>
              <button class="icon-btn" data-del="${r.id}" title="Eliminar">${icon('trash')}</button></div>
            <p class="muted">Profesor asignado</p><strong>${esc(r.teacher_name ?? 'Sin asignar')}</strong>
            <p class="muted" style="margin-top:10px">${r.student_count} estudiantes</p>
            <div class="bar-row"><span class="muted">Asist.</span><div class="bar"><span style="width:${rate[r.name] ?? 0}%"></span></div><span>${rate[r.name] ?? 0}%</span></div>
            <a class="btn btn-outline btn-sm btn-block" href="#/students?classroomId=${r.id}">Ver estudiantes</a>
          </section>`).join('')}</div>`;

      root.querySelector('#add').addEventListener('click', () => {
        const m = openModal(`<h2>Nuevo salón</h2><form id="f" style="margin-top:16px"><div class="form-grid">
          <div class="field"><label>Nombre</label><input class="input" name="name" placeholder="7C" required /></div>
          <div class="field"><label>Grado</label><input class="input" name="grade" placeholder="7°" required /></div>
          <div class="field"><label>Director de grupo</label><select class="select" name="teacher_id" data-num>${options(teachers, 'id', 'name', '', 'Sin asignar')}</select></div>
          </div><div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
        m.el.querySelector('#f').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = formData(e.target);
          if (data.teacher_id === '') delete data.teacher_id;
          try { await api.post('/classrooms', data); m.close(); toast('Salón creado'); draw(); }
          catch (err) { toast(err.message, 'error'); }
        });
      });
      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este salón? Sus horarios también se eliminarán.')) return;
        await api.del(`/classrooms/${b.dataset.del}`); toast('Salón eliminado'); draw();
      }));
    };
    await draw();
  },
};
