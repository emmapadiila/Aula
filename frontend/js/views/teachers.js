import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, formData, openModal, pageHead, person, toast } from '../core/ui.js';

export default {
  title: 'Profesores',
  async render(root) {
    const draw = async () => {
      const list = await api.get('/teachers');
      root.innerHTML = `
        ${pageHead('Profesores', 'Gestiona docentes y sus salones asignados.', `<button class="btn btn-primary" id="add">${icon('plus')} Nuevo profesor</button>`)}
        <section class="card"><div class="table-wrap"><table>
          <thead><tr><th>Profesor</th><th>Materia</th><th>Salones</th><th>Estado</th><th></th></tr></thead>
          <tbody>${list.map((t) => `<tr><td>${person(t.name, t.email)}</td><td>${esc(t.subject ?? '—')}</td>
            <td>${esc(t.classrooms ?? '—')}</td><td><span class="badge badge-${t.active ? 'Activo' : 'Inactivo'}">${t.active ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="icon-btn" data-del="${t.id}" title="Eliminar">${icon('trash')}</button></td></tr>`).join('')}</tbody>
        </table></div></section>`;

      root.querySelector('#add').addEventListener('click', () => {
        const m = openModal(`<h2>Nuevo profesor</h2><form id="f" style="margin-top:16px"><div class="form-grid">
          <div class="field"><label>Nombre</label><input class="input" name="name" required /></div>
          <div class="field"><label>Materia</label><input class="input" name="subject" /></div>
          <div class="field"><label>Correo</label><input class="input" type="email" name="email" required /></div>
          <div class="field"><label>Contraseña inicial</label><input class="input" type="password" name="password" minlength="6" required /></div>
          </div><div class="form-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
        m.el.querySelector('#f').addEventListener('submit', async (e) => {
          e.preventDefault();
          try { await api.post('/teachers', formData(e.target)); m.close(); toast('Profesor creado'); draw(); }
          catch (err) { toast(err.message, 'error'); }
        });
      });
      root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este profesor y sus horarios?')) return;
        await api.del(`/teachers/${b.dataset.del}`); toast('Profesor eliminado'); draw();
      }));
    };
    await draw();
  },
};
