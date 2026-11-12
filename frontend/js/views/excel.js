import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, pageHead, toast } from '../core/ui.js';

const COLS = ['FECHA', 'ESTUDIANTE', 'IDENTIFICACIÓN', 'SALÓN', 'MATERIA', 'PROFESOR', 'HORA PROGRAMADA', 'HORA LLEGADA', 'ESTADO'];

export default {
  title: 'Exportar a Excel',
  async render(root) {
    const rooms = await api.get('/classrooms');
    root.innerHTML = `
      ${pageHead('Exportar a Excel', 'Tus registros organizados y respaldados automáticamente.')}
      <div class="grid grid-2-1">
        <section class="card">
          <div class="card-head"><div class="person"><div class="stat tone-green"><div class="ico">${icon('file-spreadsheet')}</div></div>
            <div><strong>REGISTRO GENERAL DE ASISTENCIA.xlsx</strong><div class="muted">${rooms.length} hojas · Una hoja por cada salón activo</div></div></div></div>
          <h3 style="margin:8px 0">Organización del archivo</h3>
          <div class="filters" style="margin-bottom:16px">${rooms.map((r) => `<span class="badge badge-Activo">Salón ${esc(r.name)}</span>`).join('')}</div>
          <h3 style="margin:8px 0">Vista previa de columnas</h3>
          <p class="muted" style="margin-bottom:8px">Estructura aplicada a todas las hojas</p>
          <div class="table-wrap"><table><thead><tr>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr></thead></table></div>
        </section>
        <aside class="card">
          <h3>Rango de fechas</h3>
          <div class="field" style="margin-top:12px"><label>Desde</label><input class="input" type="date" id="from" /></div>
          <div class="field" style="margin-top:10px"><label>Hasta</label><input class="input" type="date" id="to" /></div>
          <button class="btn btn-primary btn-block" id="dl" style="margin-top:16px">${icon('download')} Descargar Excel</button>
        </aside>
      </div>`;

    root.querySelector('#dl').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        await api.download('/reports/excel', { from: root.querySelector('#from').value, to: root.querySelector('#to').value }, 'REGISTRO GENERAL DE ASISTENCIA.xlsx');
        toast('Excel generado');
      } catch (err) { toast(err.message, 'error'); }
      e.target.disabled = false;
    });
  },
};
