import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { badge, esc, formData, initials, openModal, options, statCard, toast } from '../core/ui.js';

export default {
  title: 'Perfil del estudiante',
  async render(root, ctx) {
    const { params, isAdmin } = ctx;
    const id = params.id;
    const [{ student: s, qr }, history] = await Promise.all([
      api.get(`/students/${id}/qr`),
      api.get('/attendance', { studentId: id, limit: 20 }),
    ]);
    const count = (st) => history.rows.filter((r) => r.status === st).length;
    const rerender = () => this.render(root, ctx);

    root.innerHTML = `
      <a href="#/students" class="muted">${icon('chevron-left')} Volver a estudiantes</a>
      <div class="page-head">
        <div class="person"><span class="avatar" style="width:56px;height:56px;font-size:18px">${esc(initials(s.name))}</span>
          <div><h1>${esc(s.name)}</h1><p class="muted">${esc(s.code)} · Salón ${esc(s.classroom ?? '—')}
            ${s.active ? '' : ' · <span class="badge badge-Inactivo">Inactivo</span>'}</p></div></div>
        <div class="filters">
          ${isAdmin ? `<button class="btn btn-primary" id="edit">${icon('pencil')} Editar</button>` : ''}
          <button class="btn btn-outline" id="dl">${icon('download')} Descargar QR</button>
          ${isAdmin ? `<button class="btn btn-danger" id="del">${icon('trash')} Eliminar</button>` : ''}
        </div>
      </div>
      <div class="grid grid-4">
        ${statCard({ label: 'Temprano', value: count('Temprano'), tone: 'blue', ico: 'trending-up' })}
        ${statCard({ label: 'Puntual', value: count('Puntual'), tone: 'green', ico: 'check' })}
        ${statCard({ label: 'Tarde', value: count('Tarde'), tone: 'orange', ico: 'clock-3' })}
        ${statCard({ label: 'Inasistencias', value: count('Inasistencia'), tone: 'red', ico: 'circle-alert' })}
      </div>
      <div class="grid grid-2-1">
        <section class="card"><div class="card-head"><h2>Información</h2></div>
          <div class="form-grid">
            <div><p class="muted">Código</p><strong>${esc(s.code)}</strong></div>
            <div><p class="muted">Identificación</p><strong>${esc(s.document ?? '—')}</strong></div>
            <div><p class="muted">Correo</p><strong>${esc(s.email ?? '—')}</strong></div>
            <div><p class="muted">Hora de entrada individual</p><strong>${esc(s.entry_time ?? 'La del salón')}</strong></div>
          </div>
          <div class="card-head" style="margin-top:24px"><h2>Historial reciente</h2></div>
          <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Clase</th><th>Programada</th><th>Llegada</th><th>Estado</th></tr></thead>
          <tbody>${history.rows.map((a) => `<tr><td>${esc(a.date)}</td><td>${esc(a.subject)}</td><td>${esc(a.scheduled_time)}</td>
            <td>${esc(a.arrival_time ?? '—')}</td><td>${badge(a.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Sin registros</td></tr>'}
          </tbody></table></div></section>
        <aside class="card qr-card"><h3>Código QR</h3><img src="${qr}" alt="QR" /><strong>${esc(s.code)}</strong>
          <p class="muted" style="font-size:12px">${icon('shield-check')} El QR no contiene información personal visible.</p>
          ${isAdmin ? `<button class="btn btn-outline btn-sm" id="regen">${icon('refresh-cw')} Generar nuevo QR</button>` : ''}</aside>
      </div>`;

    root.querySelector('#dl').addEventListener('click', () => api.download(`/students/${id}/qr`, { format: 'png' }, `QR-${s.code}.png`));

    root.querySelector('#del')?.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar a ${s.name}? Se borrará su historial.`)) return;
      await api.del(`/students/${id}`);
      toast('Estudiante eliminado');
      location.hash = '#/students';
    });

    root.querySelector('#regen')?.addEventListener('click', async () => {
      if (!confirm('Se generará un QR nuevo y el anterior DEJARÁ DE FUNCIONAR (útil si se perdió la manilla). ¿Continuar?')) return;
      await api.post(`/students/${id}/qr/regenerate`);
      toast('Nuevo QR generado. Imprime la nueva manilla.');
      rerender();
    });

    root.querySelector('#edit')?.addEventListener('click', async () => {
      const rooms = await api.get('/classrooms');
      const m = openModal(`<h2>Editar estudiante</h2>
        <form id="f" style="margin-top:16px"><div class="form-grid">
          <div class="field"><label>Código</label><input class="input" name="code" value="${esc(s.code)}" required /></div>
          <div class="field"><label>Nombre completo</label><input class="input" name="name" value="${esc(s.name)}" required /></div>
          <div class="field"><label>Identificación</label><input class="input" name="document" value="${esc(s.document ?? '')}" /></div>
          <div class="field"><label>Correo</label><input class="input" type="email" name="email" value="${esc(s.email ?? '')}" /></div>
          <div class="field"><label>Salón</label><select class="select" name="classroom_id" data-num>${options(rooms, 'id', 'name', s.classroom_id)}</select></div>
          <div class="field"><label>Hora de entrada individual</label><input class="input" type="time" name="entry_time" value="${esc(s.entry_time ?? '')}" />
            <small class="muted">Vacío = usa la hora del salón</small></div>
          <div class="field"><label>Estado</label><select class="select" name="active" data-num>
            <option value="1" ${s.active ? 'selected' : ''}>Activo</option><option value="0" ${s.active ? '' : 'selected'}>Inactivo (retirado)</option></select></div>
        </div>
        <p class="muted" style="font-size:12px;margin-top:10px">Cambiar el código no cambia el QR: la manilla impresa sigue funcionando.</p>
        <div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button>
          <button class="btn btn-primary">Guardar cambios</button></div></form>`);

      m.el.querySelector('#f').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.put(`/students/${id}`, formData(e.target));
          m.close();
          toast('Cambios guardados');
          rerender();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  },
};
