import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { esc, pageHead, statCard } from '../core/ui.js';

const iso = (d) => d.toISOString().slice(0, 10);

export default {
  title: 'Reportes',
  async render(root, { isAdmin }) {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    root.innerHTML = `
      ${pageHead(isAdmin ? 'Reportes de asistencia' : 'Reportes de clase', 'Indicadores claros para tomar mejores decisiones.',
        `<input class="input" type="date" id="from" value="${iso(from)}" /><input class="input" type="date" id="to" value="${iso(to)}" />
         <button class="btn btn-outline" id="apply">${icon('refresh-cw')} Actualizar</button>`)}
      <div id="body"><p class="loading">Cargando…</p></div>`;

    const body = root.querySelector('#body');
    const load = async () => {
      const q = { from: root.querySelector('#from').value, to: root.querySelector('#to').value };
      const [dist, rooms] = await Promise.all([api.get('/reports/distribution', q), api.get('/reports/by-classroom', q)]);
      const pct = (n) => (dist.total ? Math.round((n / dist.total) * 100) : 0);
      body.innerHTML = `
        <div class="grid grid-4">
          ${statCard({ label: 'Asistencia general', value: `${dist.rate}%`, tone: 'blue', ico: 'trending-up' })}
          ${statCard({ label: 'Registros', value: dist.total.toLocaleString('es-CO'), tone: 'purple', ico: 'file-spreadsheet' })}
          ${statCard({ label: 'Llegadas tarde', value: dist.Tarde, tone: 'orange', ico: 'clock-3' })}
          ${statCard({ label: 'Inasistencias', value: dist.Inasistencia, tone: 'red', ico: 'circle-alert' })}
        </div>
        <div class="grid grid-2" style="margin-top:16px">
          <section class="card"><div class="card-head"><h2>Distribución de estados</h2></div>
            ${['Temprano', 'Puntual', 'Tarde', 'Inasistencia'].map((s) => `
              <div class="bar-row" style="grid-template-columns:110px 1fr 48px"><span class="badge badge-${s}">${s}</span>
              <div class="bar"><span style="width:${pct(dist[s])}%"></span></div><span>${pct(dist[s])}%</span></div>`).join('')}
          </section>
          <section class="card"><div class="card-head"><h2>Comparación entre salones</h2></div>
            <div class="table-wrap"><table><thead><tr><th>Salón</th><th>Registros</th><th>Tarde</th><th>Inasist.</th><th>% Asist.</th></tr></thead>
            <tbody>${rooms.map((r) => `<tr><td><strong>${esc(r.classroom)}</strong></td><td>${r.total}</td><td>${r.late ?? 0}</td>
              <td>${r.absent ?? 0}</td><td>${r.rate}%</td></tr>`).join('')}</tbody></table></div>
          </section>
        </div>`;
    };
    root.querySelector('#apply').addEventListener('click', load);
    await load();
  },
};
