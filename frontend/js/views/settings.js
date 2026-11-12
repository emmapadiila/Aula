import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, pageHead, toast } from '../core/ui.js';

export default {
  title: 'Configuración',
  async render(root, { user }) {
    root.innerHTML = `
      ${pageHead('Configuración', 'Administra tu perfil, notificaciones y preferencias.')}
      <div class="grid grid-2">
        <section class="card">
          <h2 style="margin-bottom:8px">Respaldo de datos</h2>
          <p class="muted" style="margin-bottom:16px">Todo se guarda automáticamente en la base de datos. Descarga un respaldo
            JSON completo (estudiantes, QR, salones, horarios y asistencias) de vez en cuando y guárdalo en tu PC o en la nube.</p>
          <div class="filters">
            <button class="btn btn-primary" id="backup">${icon('download')} Descargar respaldo JSON</button>
            <a class="btn btn-outline" href="#/excel">${icon('file-spreadsheet')} Exportar a Excel</a>
          </div>

          <h3 style="margin:24px 0 8px">Restaurar desde un respaldo</h3>
          <p class="muted" style="margin-bottom:12px">Reemplaza salones, horarios, estudiantes y asistencias por los del archivo.
            Las manillas impresas siguen funcionando. Antes de reemplazar se guarda automáticamente una copia de lo que hay ahora.</p>
          <input type="file" id="restore-file" accept=".json,application/json" class="hidden" />
          <button class="btn btn-outline" id="restore">${icon('refresh-cw')} Elegir archivo JSON…</button>
          <div id="restore-info" style="margin-top:12px"></div>
        </section>
        <form class="card" id="f">
          <h2 style="margin-bottom:16px">Preferencias de cuenta</h2>
          <div class="form-grid">
            <div class="field"><label>Nombre</label><input class="input" value="${esc(user.name)}" disabled /></div>
            <div class="field"><label>Correo</label><input class="input" value="${esc(user.email)}" disabled /></div>
          </div>
          <div class="form-actions"><button class="btn btn-primary">Guardar cambios</button></div>
        </form>
      </div>`;

    root.querySelector('#backup').addEventListener('click', async () => {
      try {
        await api.download('/backup', {}, `respaldo-asistencia-${new Date().toISOString().slice(0, 10)}.json`);
        toast('Respaldo descargado');
      } catch (err) { toast(err.message, 'error'); }
    });
    // ── Restaurar ───────────────────────────────────────
    const fileInput = root.querySelector('#restore-file');
    const info = root.querySelector('#restore-info');
    root.querySelector('#restore').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch {
        info.innerHTML = `<p style="color:var(--red)">El archivo "${esc(file.name)}" no es un JSON válido.</p>`;
        return;
      }
      try {
        // 1) Revisar sin cambiar nada
        const r = await api.post('/backup/restore?check=1', data);
        const fecha = r.generado ? new Date(r.generado).toLocaleString('es-CO') : 'fecha desconocida';
        info.innerHTML = `
          <div class="card" style="box-shadow:none;background:var(--bg)">
            <p><strong>${esc(file.name)}</strong> · respaldo del ${esc(fecha)}</p>
            <p class="muted" style="margin:6px 0 12px">${r.salones} salones · ${r.horarios} horarios ·
              ${r.estudiantes} estudiantes · ${r.asistencias} asistencias</p>
            <div class="filters"><button class="btn btn-danger" id="do-restore">Reemplazar todo con este respaldo</button>
              <button class="btn btn-outline" id="cancel-restore">Cancelar</button></div>
          </div>`;
        info.querySelector('#cancel-restore').addEventListener('click', () => { info.innerHTML = ''; });
        info.querySelector('#do-restore').addEventListener('click', async (e) => {
          if (!confirm(`Se reemplazarán TODOS los estudiantes, salones, horarios y asistencias actuales por los de "${file.name}". ¿Continuar?`)) return;
          e.target.disabled = true;
          try {
            // 2) Restaurar de verdad
            const done = await api.post('/backup/restore', data);
            info.innerHTML = `<p style="color:var(--green)"><strong>Restauración completa:</strong> ${done.estudiantes} estudiantes,
              ${done.salones} salones, ${done.asistencias - done.asistencias_omitidas} asistencias.</p>
              ${done.asistencias_omitidas ? `<p class="muted">${done.asistencias_omitidas} asistencias no se pudieron ubicar y se omitieron.</p>` : ''}
              <button class="btn btn-outline btn-sm" id="dl-prev">${icon('download')} Descargar copia de lo que había antes</button>`;
            info.querySelector('#dl-prev').addEventListener('click', () =>
              api.download(`/backup/snapshots/${done.copia_previa}`, {}, `copia-antes-de-restaurar-${done.copia_previa}.json`));
            toast('Respaldo restaurado');
          } catch (err) {
            e.target.disabled = false;
            toast(err.message, 'error');
          }
        });
      } catch (err) {
        info.innerHTML = `<p style="color:var(--red)">${esc(err.message)}</p>`;
      }
    });

    root.querySelector('#f').addEventListener('submit', (e) => { e.preventDefault(); toast('Cambios guardados'); });
  },
};
