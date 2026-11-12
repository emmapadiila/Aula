import { buildWorkbook } from '../services/excel.service.js';
import * as Reports from '../services/report.service.js';
import { todayISO } from '../utils/time.js';

const scope = (req) => (req.user.role === 'teacher' ? req.user.id : undefined);
const daysAgo = (n) => todayISO(new Date(Date.now() - n * 86_400_000));

export const ReportController = {
  summary: async (req, res) => res.json(await Reports.daySummary({ date: req.query.date || undefined, teacherId: scope(req) })),

  byClassroom: async (req, res) =>
    res.json(await Reports.byClassroom({ from: req.query.from, to: req.query.to, teacherId: scope(req) })),

  daily: async (req, res) =>
    res.json(await Reports.daily({ from: req.query.from || daysAgo(6), to: req.query.to || todayISO(), teacherId: scope(req) })),

  distribution: async (req, res) =>
    res.json(await Reports.statusDistribution({ from: req.query.from, to: req.query.to, teacherId: scope(req) })),

  async excel(req, res) {
    const buffer = await buildWorkbook({ from: req.query.from, to: req.query.to, teacherId: scope(req) });
    res
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .attachment('REGISTRO GENERAL DE ASISTENCIA.xlsx')
      .send(Buffer.from(buffer));
  },
};
