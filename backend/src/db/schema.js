/** Esquema de la base de datos (SQLite / Turso). Se aplica al arrancar; es idempotente. */
export const SCHEMA = `
-- Usuarios del sistema: administradores y profesores
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('admin', 'teacher')),
  subject       TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Salones / grupos (6, 9, 11, ...)
CREATE TABLE IF NOT EXISTS classrooms (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  grade       TEXT    NOT NULL,
  teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Estudiantes. qr_token es un identificador opaco: el QR NO contiene datos personales.
CREATE TABLE IF NOT EXISTS students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  document      TEXT    UNIQUE,
  email         TEXT,
  classroom_id  INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
  entry_time    TEXT,
  qr_token      TEXT    NOT NULL UNIQUE,
  photo_url     TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Jornadas / clases programadas (horario semanal)
CREATE TABLE IF NOT EXISTS schedules (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  classroom_id   INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject        TEXT    NOT NULL,
  weekday        INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time     TEXT    NOT NULL,
  end_time       TEXT    NOT NULL,
  on_time_margin INTEGER,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Registros de asistencia (uno por estudiante, jornada y día)
CREATE TABLE IF NOT EXISTS attendance (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  schedule_id    INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date           TEXT    NOT NULL,
  scheduled_time TEXT    NOT NULL,
  arrival_time   TEXT,
  status         TEXT    NOT NULL CHECK (status IN ('Temprano', 'Puntual', 'Tarde', 'Inasistencia')),
  recorded_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, schedule_id, date)
);

-- Copias de seguridad automáticas (p. ej. antes de restaurar un respaldo)
CREATE TABLE IF NOT EXISTS snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT    NOT NULL,
  data        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON attendance(schedule_id, date);
CREATE INDEX IF NOT EXISTS idx_students_classroom  ON students(classroom_id);
`;
