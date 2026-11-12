/**
 * Escanear asistencia (profesor).
 * Usa la cámara con html5-qrcode y envía el contenido a POST /api/attendance/scan.
 * Incluye entrada manual y botones de simulación para probar sin cámara.
 */
import { api } from '../core/api.js';
import { icon } from '../core/icons.js';
import { badge, esc, options, toast } from '../core/ui.js';

export default {
  title: 'Escanear asistencia',
  async render(root, { params }) {
    const classes = await api.get('/schedules/today');
    let scheduleId = params.scheduleId || classes[0]?.id || '';
    let scanner = null;
    let busy = false;

    root.innerHTML = `
      <div class="page-head"><div><h1>Escanear asistencia</h1><p>Acerca la cámara al código QR de la manilla.</p></div>
        <select class="select" id="cls" style="width:auto">${options(classes.map((c) => ({ id: c.id, label: `${c.subject} · Salón ${c.classroom} · ${c.start_time}` })), 'id', 'label', scheduleId, classes.length ? undefined : 'No tienes clases hoy')}</select>
      </div>
      <div class="scanner">
        <div class="card" style="padding:12px">
          <div class="scanner-box" id="box"><div id="reader"></div>
            <div id="idle"><p>${icon('camera')}</p><p>Listo para escanear</p>
              <button class="btn btn-primary" id="start" style="margin-top:12px">Activar cámara</button></div></div>
        </div>
        <div class="card" id="result" style="margin-top:16px"><p class="muted" style="text-align:center">Buscando código QR…</p></div>
        <details class="card" style="margin-top:16px"><summary><strong>Pruebas sin cámara</strong></summary>
          <div class="filters" style="margin-top:12px">
            <input class="input" id="manual" placeholder="Pega el contenido del QR (ASQR:...)" style="flex:1" />
            <button class="btn btn-outline" id="send">Registrar</button>
            <button class="btn btn-outline" id="sim-bad">Simular QR inválido</button>
            <button class="btn btn-outline" id="sim-404">Simular estudiante no encontrado</button>
          </div></details>
        <div class="form-actions"><button class="btn btn-outline" id="close">Finalizar clase y generar inasistencias</button></div>
      </div>`;

    const $ = (s) => root.querySelector(s);
    const result = $('#result');

    const show = (kind, title, body) => {
      const tone = { ok: ['var(--green-50)', 'var(--green)', 'check'], warn: ['var(--orange-50)', 'var(--orange)', 'circle-alert'], err: ['var(--red-50)', 'var(--red)', 'circle-alert'] }[kind];
      result.innerHTML = `<div class="scan-result"><div class="big-ico" style="background:${tone[0]};color:${tone[1]}">${icon(tone[2])}</div>
        <h2>${esc(title)}</h2>${body}</div>`;
    };

    async function submit(qr) {
      if (busy || !scheduleId) return;
      busy = true;
      try {
        const { student, record } = await api.post('/attendance/scan', { qr, scheduleId });
        show('ok', 'Asistencia registrada', `<strong>${esc(student.name)}</strong>
          <p class="muted">${esc(student.code)} · Salón ${esc(student.classroom)}</p>
          <p>Programada ${esc(record.scheduled_time)} · Llegada <strong>${esc(record.arrival_time)}</strong></p>${badge(record.status)}`);
      } catch (err) {
        const titles = { INVALID_QR: 'Código QR inválido', STUDENT_NOT_IN_CLASS: 'Estudiante no encontrado', ALREADY_REGISTERED: 'Ya registrado' };
        show(err.code === 'ALREADY_REGISTERED' ? 'warn' : 'err', titles[err.code] || 'Error', `<p class="muted">${esc(err.message)}</p>`);
      } finally {
        setTimeout(() => { busy = false; }, 1500); // evita lecturas duplicadas
      }
    }

    $('#cls').addEventListener('change', (e) => { scheduleId = e.target.value; });
    $('#send').addEventListener('click', () => submit($('#manual').value));
    $('#sim-bad').addEventListener('click', () => submit('codigo-cualquiera'));
    $('#sim-404').addEventListener('click', () => submit(`ASQR:${'0'.repeat(32)}`));
    $('#close').addEventListener('click', async () => {
      if (!scheduleId || !confirm('Los estudiantes sin registro quedarán como Inasistencia. ¿Continuar?')) return;
      const r = await api.post(`/attendance/close/${scheduleId}`);
      toast(`Clase finalizada · ${r.absences} inasistencias generadas`);
    });

    $('#start').addEventListener('click', async () => {
      if (!window.Html5Qrcode) return toast('No se pudo cargar el lector de QR', 'error');
      $('#idle').classList.add('hidden');
      scanner = new window.Html5Qrcode('reader');
      try {
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (text) => submit(text));
      } catch (err) {
        $('#idle').classList.remove('hidden');
        toast(`No se pudo abrir la cámara: ${err}`, 'error');
      }
    });

    // cleanup al salir de la vista: apagar la cámara
    return () => scanner?.isScanning && scanner.stop().catch(() => {});
  },
};
