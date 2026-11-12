import { Router } from 'express';
import { AttendanceController as Att } from '../controllers/attendance.controller.js';
import { AuthController as Auth } from '../controllers/auth.controller.js';
import { ClassroomController as Cls } from '../controllers/classroom.controller.js';
import { ReportController as Rep } from '../controllers/report.controller.js';
import { ScheduleController as Sch } from '../controllers/schedule.controller.js';
import { StudentController as Stu } from '../controllers/student.controller.js';
import { TeacherController as Tea } from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import express from 'express';
import { DB_KIND } from '../db/database.js';
import { buildBackup, getSnapshot, listSnapshots } from '../services/backup.service.js';
import { restoreBackup, validateBackup } from '../services/restore.service.js';
import { asyncHandler as h, notFound } from '../utils/errors.js';
import { nowHHMM, todayISO, TZ } from '../utils/time.js';

const r = Router();
const admin = authorize('admin');
const backupName = (suffix = '') => `respaldo-asistencia-${todayISO()}${suffix}.json`;

// ── Público ─────────────────────────────────────────
r.get('/health', (_req, res) => res.json({ ok: true, storage: DB_KIND, timezone: TZ, today: todayISO(), now: nowHHMM() }));
r.post('/auth/login', h(Auth.login));

// ── Autenticado (admin y profesor) ──────────────────
r.use(authenticate);
r.get('/auth/me', h(Auth.me));

r.get('/students', h(Stu.list));
r.get('/students/:id', h(Stu.get));
r.get('/students/:id/qr', h(Stu.qr));
r.post('/students/:id/qr/regenerate', admin, h(Stu.regenerateQr));
r.post('/students', admin, h(Stu.create));
r.put('/students/:id', admin, h(Stu.update));
r.delete('/students/:id', admin, h(Stu.remove));

r.get('/teachers', admin, h(Tea.list));
r.post('/teachers', admin, h(Tea.create));
r.put('/teachers/:id', admin, h(Tea.update));
r.delete('/teachers/:id', admin, h(Tea.remove));

r.get('/classrooms', h(Cls.list));
r.post('/classrooms', admin, h(Cls.create));
r.put('/classrooms/:id', admin, h(Cls.update));
r.delete('/classrooms/:id', admin, h(Cls.remove));

r.get('/schedules', h(Sch.list));
r.get('/schedules/today', h(Sch.today));
r.post('/schedules', admin, h(Sch.create));
r.put('/schedules/:id', admin, h(Sch.update));
r.delete('/schedules/:id', admin, h(Sch.remove));

r.get('/attendance', h(Att.list));
r.post('/attendance/scan', h(Att.scan));
r.post('/attendance/close/:scheduleId', h(Att.close));
r.patch('/attendance/:id', admin, h(Att.updateStatus));

r.get('/reports/summary', h(Rep.summary));
r.get('/reports/by-classroom', h(Rep.byClassroom));
r.get('/reports/daily', h(Rep.daily));
r.get('/reports/distribution', h(Rep.distribution));
r.get('/reports/excel', h(Rep.excel));

// Respaldo completo en JSON (descarga)
r.get('/backup', admin, h(async (_req, res) => res.attachment(backupName()).json(await buildBackup())));
// Restaurar: primero se valida (?check=1 solo revisa y devuelve el resumen), luego se reemplaza todo
r.post('/backup/restore', admin, express.json({ limit: '4mb' }), h(async (req, res) =>
  res.json(req.query.check ? validateBackup(req.body) : await restoreBackup(req.body))));
// Copias automáticas hechas antes de cada restauración
r.get('/backup/snapshots', admin, h(async (_req, res) => res.json(await listSnapshots())));
r.get('/backup/snapshots/:id', admin, h(async (req, res) => {
  const data = await getSnapshot(Number(req.params.id));
  if (!data) throw notFound('Copia no encontrada');
  res.attachment(backupName(`-copia-${req.params.id}`)).json(data);
}));

export default r;
