PRAGMA foreign_keys = ON;

-- Usuarios del sistema: administradores y profesores
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('admin', 'teacher')),
  subject       TEXT,                       -- materia principal (profesores)
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Salones / grupos (6A, 7A, ...)
CREATE TABLE IF NOT EXISTS classrooms (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,      -- "7A"
  grade       TEXT    NOT NULL,             -- "7°"
  teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL, -- director de grupo
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Estudiantes. qr_token es un identificador opaco: el QR NO contiene datos personales.
CREATE TABLE IF NOT EXISTS students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT    NOT NULL UNIQUE,    -- "EST-24031"
  name          TEXT    NOT NULL,
  document      TEXT    UNIQUE,             -- identificación (opcional)
  email         TEXT,
  classroom_id  INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
  entry_time    TEXT,                       -- hora de entrada individual (HH:MM), opcional
  qr_token      TEXT    NOT NULL UNIQUE,
  photo_url     TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Clases programadas (horario semanal)
CREATE TABLE IF NOT EXISTS schedules (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  classroom_id   INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject        TEXT    NOT NULL,          -- "Matemáticas"
  weekday        INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- 1 = lunes
  start_time     TEXT    NOT NULL,          -- "07:00"
  end_time       TEXT    NOT NULL,          -- "08:30"
  on_time_margin INTEGER,                   -- minutos; NULL = valor global
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Registros de asistencia (uno por estudiante, clase y día)
CREATE TABLE IF NOT EXISTS attendance (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  schedule_id    INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  date           TEXT    NOT NULL,          -- "2025-05-22"
  scheduled_time TEXT    NOT NULL,          -- "07:00"
  arrival_time   TEXT,                      -- "06:57" (NULL si inasistencia)
  status         TEXT    NOT NULL CHECK (status IN ('Temprano', 'Puntual', 'Tarde', 'Inasistencia')),
  recorded_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, schedule_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON attendance(schedule_id, date);
CREATE INDEX IF NOT EXISTS idx_students_classroom  ON students(classroom_id);
