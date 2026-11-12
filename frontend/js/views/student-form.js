import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, formData, options, toast } from '../core/ui.js';

export default {
  title: 'Registrar estudiante',
  async render(root) {
    const rooms = await api.get('/classrooms');

    root.innerHTML = `
      <a href="#/students" class="muted">${icon('chevron-left')} Volver a estudiantes</a>
      <div class="page-head"><div><h1>Registrar estudiante</h1><p>Completa la información para crear un nuevo perfil.</p></div></div>
      <div class="grid grid-2-1">
        <form class="card" id="f">
          <h2 style="margin-bottom:16px">Información personal</h2>
          <div class="form-grid">
            <div class="field"><label>Nombre completo</label><input class="input" name="name" placeholder="Ej. Daniela Sánchez" required /></div>
            <div class="field"><label>Identificación (opcional)</label><input class="input" name="document" placeholder="1.023.456.789" /></div>
            <div class="field"><label>Correo</label><input class="input" type="email" name="email" placeholder="estudiante@correo.com" /></div>
            <div class="field"><label>Salón</label><select class="select" name="classroom_id" data-num required>${options(rooms, 'id', 'name', '', 'Selecciona')}</select></div>
            <div class="field"><label>Hora de entrada individual (opcional)</label><input class="input" type="time" name="entry_time" /></div>
          </div>
          <div class="form-actions">
            <a class="btn btn-outline" href="#/students">Cancelar</a>
            <button class="btn btn-primary" type="submit">${icon('qr-code')} Guardar y generar QR</button>
          </div>
        </form>
        <aside class="card" id="preview">
          <h3>Vista previa de manilla</h3>
          <p class="muted" style="margin:8px 0 16px">El QR se genera al guardar. No contiene información personal visible.</p>
          <div class="wristband"><div style="width:84px;height:84px;background:var(--bg);border-radius:8px"></div><div><p class="eyebrow">Código QR</p><strong>—</strong></div></div>
        </aside>
      </div>`;

    root.querySelector('#f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formData(e.target);
      if (!data.entry_time) delete data.entry_time;
      try {
        const { student, qr } = await api.post('/students', data);
        toast('¡Estudiante registrado!');
        root.querySelector('#preview').innerHTML = `
          <h3>¡Estudiante registrado!</h3>
          <p class="muted" style="margin:8px 0 16px">Su código QR único está listo para usarse.</p>
          <div class="wristband"><img src="${qr}" alt="QR de ${esc(student.name)}" />
            <div><p class="eyebrow">Código único</p><strong>${esc(student.code)}</strong><div class="muted">Salón ${esc(student.classroom)}</div></div></div>
          <div class="form-actions"><a class="btn btn-outline" href="#/students/${student.id}">Ver perfil</a>
            <a class="btn btn-primary" href="#/students/new" onclick="location.reload()">Registrar otro</a></div>`;
        e.target.reset();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  },
};
