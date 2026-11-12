import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, formData, openModal, options, pageHead, toast, WEEKDAYS } from '../core/ui.js';

const DAYS = [1, 2, 3, 4, 5];

/** Valida que la salida sea después de la entrada */
function checkTimes(data) {
  if (data.start_time && data.end_time && data.end_time <= data.start_time) {
    toast('La hora de salida debe ser después de la de entrada', 'error');
    return false;
  }
  return true;
}

const timeFields = (s = {}) => `
  <div class="field"><label>Hora de entrada</label><input class="input" type="time" name="start_time" value="${esc(s.start_time ?? '')}" required /></div>
  <div class="field"><label>Hora de salida</label><input class="input" type="time" name="end_time" value="${esc(s.end_time ?? '')}" required /></div>
  <div class="field"><label>Margen puntual (min)</label><input class="input" type="number" min="0" max="120" name="on_time_margin" data-num value="${esc(s.on_time_margin ?? 10)}" required />
    <small class="muted">Minutos después de la entrada que aún cuentan como Puntual</small></div>`;

export default {
  title: 'Horarios',
  async render(root, { isAdmin, user }) {
    const draw = async () => {
      const list = await api.get('/schedules');
      const byDay = DAYS.map((d) => ({ d, items: list.filter((s) => s.weekday === d) }));
      root.innerHTML = `
        ${pageHead(isAdmin ? 'Horarios' : 'Mis horarios', 'Configura la hora de entrada, salida y el margen de cada día. Los cambios aplican desde el siguiente escaneo.',
          isAdmin ? `<button class="btn btn-primary" id="add">${icon('plus')} Nueva clase</button>` : '')}
        <section class="card"><h3>¿Cómo se clasifica la llegada?</h3>
          <p class="muted" style="margin:6px 0 10px">El sistema compara la hora del escaneo con la hora de entrada de ese día
            (o con la hora individual del estudiante, si tiene una).</p>
          <div class="filters"><span class="badge badge-Temprano">Antes de la hora · Temprano</span>
            <span class="badge badge-Puntual">Hasta la hora + margen · Puntual</span><span class="badge badge-Tarde">Después · Tarde</span>
            <span class="badge badge-Inasistencia">Sin registro al cierre · Inasistencia</span></div></section>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">${byDay.map(({ d, items }) => `
          <section class="card">
            <div class="card-head" style="margin-bottom:10px"><h3>${WEEKDAYS[d]}</h3>
              ${isAdmin && items.length ? `<button class="btn btn-outline btn-sm" data-day="${d}" title="Cambiar el horario de todos los salones este día">${icon('clock-3')} Cambiar día</button>` : ''}</div>
            <div class="list">${items.map((s) => `
              <div class="list-item"><div class="grow"><strong>${esc(s.start_time)}–${esc(s.end_time)}</strong>
                <div class="muted">Salón ${esc(s.classroom)} · ${esc(s.subject)} · margen ${s.on_time_margin ?? 10} min</div></div>
                ${isAdmin ? `<button class="icon-btn" data-edit="${s.id}" title="Editar">${icon('pencil')}</button>
                <button class="icon-btn" data-del="${s.id}" title="Eliminar">${icon('trash')}</button>` : ''}</div>`).join('') || '<p class="muted">Sin clases</p>'}
            </div></section>`).join('')}</div>`;

      // ── Editar una jornada ─────────────────────────────
      root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
        const s = list.find((x) => x.id === Number(b.dataset.edit));
        const m = openModal(`<h2>Editar horario</h2>
          <p class="muted" style="margin-top:4px">${WEEKDAYS[s.weekday]} · Salón ${esc(s.classroom)}</p>
          <form id="f" style="margin-top:16px"><div class="form-grid">
            <div class="field"><label>Materia / jornada</label><input class="input" name="subject" value="${esc(s.subject)}" required /></div>
            ${timeFields(s)}
          </div><div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary">Guardar cambios</button></div></form>`);
        m.el.querySelector('#f').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = formData(e.target);
          if (!checkTimes(data)) return;
          try { await api.put(`/schedules/${s.id}`, data); m.close(); toast('Horario actualizado'); draw(); }
          catch (err) { toast(err.message, 'error'); }
        });
      }));

      // ── Cambiar todo un día (todos los salones) ────────
      root.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => {
        const d = Number(b.dataset.day);
        const items = list.filter((s) => s.weekday === d);
        const m = openModal(`<h2>Cambiar horario del ${WEEKDAYS[d].toLowerCase()}</h2>
          <p class="muted" style="margin-top:4px">Se aplica a los salones que marques. Afecta todos los ${WEEKDAYS[d].toLowerCase()}s hasta que lo vuelvas a cambiar.</p>
          <form id="f" style="margin-top:16px">
            <div class="filters" style="margin-bottom:14px">${items.map((s) => `
              <label class="badge badge-Activo" style="cursor:pointer"><input type="checkbox" name="room" value="${s.id}" checked /> Salón ${esc(s.classroom)}</label>`).join('')}</div>
            <div class="form-grid">${timeFields(items[0])}</div>
            <div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary">Aplicar</button></div></form>`);
        m.el.querySelector('#f').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target;
          const ids = [...f.querySelectorAll('[name=room]:checked')].map((c) => c.value);
          if (!ids.length) return toast('Marca al menos un salón', 'error');
          const data = { start_time: f.start_time.value, end_time: f.end_time.value, on_time_margin: Number(f.on_time_margin.value) };
          if (!checkTimes(data)) return;
          try {
            await Promise.all(ids.map((id) => api.put(`/schedules/${id}`, data)));
            m.close();
            toast(`${WEEKDAYS[d]}: ${data.start_time}–${data.end_time} en ${ids.length} salón(es)`);
            draw();
          } catch (err) { toast(err.message, 'error'); }
        });
      }));

      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta clase del horario?')) return;
        await api.del(`/schedules/${b.dataset.del}`); toast('Clase eliminada'); draw();
      }));

      // ── Nueva clase ────────────────────────────────────
      root.querySelector('#add')?.addEventListener('click', async () => {
        const [rooms, teachers] = await Promise.all([api.get('/classrooms'), api.get('/teachers')]);
        const people = [{ id: user.id, name: `${user.name} (yo)` }, ...teachers];
        const m = openModal(`<h2>Nueva clase</h2><form id="f" style="margin-top:16px"><div class="form-grid">
          <div class="field"><label>Materia / jornada</label><input class="input" name="subject" value="Jornada tarde" required /></div>
          <div class="field"><label>Día</label><select class="select" name="weekday" data-num>${DAYS.map((d) => `<option value="${d}">${WEEKDAYS[d]}</option>`).join('')}</select></div>
          <div class="field"><label>Salón</label><select class="select" name="classroom_id" data-num required>${options(rooms, 'id', 'name')}</select></div>
          <div class="field"><label>Encargado de escanear</label><select class="select" name="teacher_id" data-num required>${options(people, 'id', 'name')}</select></div>
          ${timeFields()}
          </div><div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
        m.el.querySelector('#f').addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = formData(e.target);
          if (!checkTimes(data)) return;
          try { await api.post('/schedules', data); m.close(); toast('Clase creada'); draw(); }
          catch (err) { toast(err.message, 'error'); }
        });
      });
    };
    await draw();
  },
};
