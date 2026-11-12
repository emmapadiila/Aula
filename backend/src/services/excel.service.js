import ExcelJS from 'exceljs';
import { ClassroomModel } from '../models/classroom.model.js';
import { AttendanceModel } from '../models/attendance.model.js';

const COLUMNS = [
  { header: 'FECHA', key: 'date', width: 13 },
  { header: 'ESTUDIANTE', key: 'student', width: 28 },
  { header: 'IDENTIFICACIÓN', key: 'code', width: 15 },
  { header: 'SALÓN', key: 'classroom', width: 9 },
  { header: 'MATERIA', key: 'subject', width: 16 },
  { header: 'PROFESOR', key: 'teacher', width: 22 },
  { header: 'HORA PROGRAMADA', key: 'scheduled_time', width: 17 },
  { header: 'HORA LLEGADA', key: 'arrival_time', width: 14 },
  { header: 'ESTADO', key: 'status', width: 14 },
];

const STATUS_FILL = { Temprano: 'FFE5F6F6', Puntual: 'FFE5F8EE', Tarde: 'FFFDF0E6', Inasistencia: 'FFFDE8EA' };

/**
 * "REGISTRO GENERAL DE ASISTENCIA.xlsx": una hoja por cada salón activo,
 * con la misma estructura de columnas en todas.
 */
export async function buildWorkbook(filters = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Asistencia QR';
  wb.created = new Date();

  const records = AttendanceModel.all(filters);
  for (const room of ClassroomModel.list()) {
    const ws = wb.addWorksheet(`Salón ${room.name}`);
    ws.columns = COLUMNS;
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF142B4F' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    for (const r of records.filter((x) => x.classroom === room.name)) {
      const row = ws.addRow({ ...r, arrival_time: r.arrival_time ?? '—' });
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_FILL[r.status] } };
    }
    ws.autoFilter = { from: 'A1', to: 'I1' };
  }
  return wb.xlsx.writeBuffer();
}
