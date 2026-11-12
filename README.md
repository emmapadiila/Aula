# Asistencia QR · Colegio María Montessori

Sistema de control de asistencia escolar con códigos QR, basado en el diseño de Figma
(https://chomp-notch-76368352.figma.site/).

- **Frontend:** HTML + CSS + JavaScript (sin frameworks, módulos ES nativos)
- **Backend:** Node.js + Express (JavaScript), API REST con JWT
- **Base de datos:** SQLite (archivo local en desarrollo) o Turso, que es SQLite en la nube, en Vercel. Ambos con `@libsql/client`

## Arrancar

```bash
npm install
npm run seed      # crea todo desde cero: admin + salones 6, 9 y 11 (¡borra historial y QR!)
npm run sync      # agrega salones/estudiantes nuevos de src/db/estudiantes.js sin borrar nada
npm run dev       # http://localhost:3100
```

Cuenta de acceso (contraseña inicial `cambiar123`). Jornada: lunes a viernes, 12:30 a 18:00, margen de 10 min:

| Rol | Correo |
|---|---|
| Administrador | admin@colegio.edu.co |

## Arquitectura

```
yore/
├── backend/                     API REST + servidor de archivos estáticos
│   ├── .env                     configuración local (puerto, secreto JWT, margen puntual)
│   ├── data/asistencia.db       base SQLite (se crea sola)
│   └── src/
│       ├── server.js            arranca el servidor
│       ├── app.js               Express: /api + sirve ../frontend
│       ├── config/env.js        variables de entorno
│       ├── db/
│       │   ├── schema.sql       tablas: users, classrooms, students, schedules, attendance
│       │   ├── database.js      conexión + transacciones
│       │   └── seed.js          carga inicial: cuentas + salón 11 + listado de estudiantes
│       ├── middlewares/
│       │   ├── auth.js          authenticate (JWT) + authorize('admin')
│       │   └── errorHandler.js  errores → JSON { error: { code, message } }
│       ├── routes/index.js      todas las rutas /api
│       ├── controllers/         leen req, llaman servicios/modelos, responden
│       ├── services/            lógica de negocio
│       │   ├── attendance.service.js   clasificación de llegada, escaneo, cierre de clase
│       │   ├── qr.service.js           tokens opacos y generación de imágenes QR
│       │   ├── report.service.js       estadísticas
│       │   ├── excel.service.js        .xlsx con una hoja por salón
│       │   └── auth.service.js         login, hash de contraseñas, JWT
│       ├── models/              consultas SQL por entidad
│       └── utils/               errores HTTP, fechas
│
└── frontend/
    ├── index.html               login (botones de acceso demo por rol)
    ├── app.html                 shell: sidebar + topbar + <main id="view">
    ├── css/
    │   ├── tokens.css           colores y medidas del diseño de Figma
    │   ├── base.css             reset y tipografía (Inter)
    │   ├── layout.css           sidebar, topbar, grids, responsive
    │   └── components.css       botones, tarjetas, tablas, badges, escáner, modal
    └── js/
        ├── app.js               registra rutas y monta el shell
        ├── core/
        │   ├── api.js           fetch + token + errores
        │   ├── session.js       sesión en localStorage
        │   ├── router.js        router por hash (#/students/12)
        │   ├── ui.js            helpers (esc, toast, modal, badges, tarjetas)
        │   └── icons.js         íconos SVG
        ├── components/sidebar.js  menú según rol
        ├── pages/login.js
        └── views/               una vista por pantalla
            dashboard-admin.js · dashboard-teacher.js · students.js · student-form.js
            student-detail.js · teachers.js · classrooms.js · schedules.js · qr-codes.js
            attendance.js · scan.js · reports.js · excel.js · settings.js
```

### Flujo de una petición

```
Vista (js/views) → core/api.js ──HTTP+JWT──▶ routes → middlewares/auth → controller → service → model → SQLite
```

### Cómo agregar una pantalla nueva

1. Crea `frontend/js/views/mi-vista.js` con `export default { title, async render(root, ctx) {...} }`.
2. Regístrala en `frontend/js/app.js` con `register('/mi-ruta', () => import('./views/mi-vista.js'))`.
3. Agrégala al menú del rol en `frontend/js/components/sidebar.js`.
4. Si necesita datos nuevos, crea el modelo, el servicio, el controlador y la ruta en `backend/src/`.

## Reglas de negocio

- **Clasificación de la llegada** (`attendance.service.js`):
  - **Temprano:** antes de la hora programada.
  - **Puntual:** hasta la hora programada más el margen (10 min por defecto, configurable por clase).
  - **Tarde:** después del margen.
  - **Inasistencia:** el estudiante no se registró cuando el profesor finaliza la clase.
- La hora de entrada individual del estudiante (`entry_time`), si existe, tiene prioridad sobre la de la clase.
- **El QR no lleva datos personales:** solo contiene `ASQR:<token aleatorio>`, y el servidor lo traduce al estudiante.
- Un estudiante solo puede registrarse una vez por clase y día.
- Un profesor solo ve y escanea sus propias clases. Crear, editar o borrar es exclusivo del administrador.

## API

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | todos |
| GET/POST/PUT/DELETE | `/api/students[/:id]` | GET todos · escritura admin |
| GET | `/api/students/:id/qr[?format=png]` | todos |
| GET/POST/PUT/DELETE | `/api/teachers[/:id]` | admin |
| GET/POST/PUT/DELETE | `/api/classrooms[/:id]` | GET todos · escritura admin |
| GET/POST/PUT/DELETE | `/api/schedules[/:id]` | GET todos · escritura admin |
| GET | `/api/schedules/today` | todos |
| GET | `/api/attendance?date&from&to&classroomId&status&search` | todos |
| POST | `/api/attendance/scan` `{ qr, scheduleId }` | todos |
| POST | `/api/attendance/close/:scheduleId` | todos |
| PATCH | `/api/attendance/:id` `{ status }` | admin |
| GET | `/api/reports/summary` · `/by-classroom` · `/daily` · `/distribution` | todos |
| GET | `/api/reports/excel?from&to` | todos |

## Antes de producción

- Cambiar `JWT_SECRET` en `backend/.env`.
- Servir con HTTPS: los navegadores solo permiten la cámara en HTTPS o en `localhost`.
- Implementar la recuperación de contraseña. "¿Olvidaste tu contraseña?" todavía no hace nada.



## Respaldo

Cada cambio (crear, editar, borrar, escanear) reescribe `backend/data/respaldo.json` con todos los datos:
usuarios (sin contraseñas), salones, horarios, estudiantes con su QR y asistencias. Además guarda una copia por día en
`backend/data/respaldos/AAAA-MM-DD.json`. También se puede descargar desde **Configuración → Descargar respaldo JSON**.
Conviene copiar de vez en cuando la carpeta `backend/data/` a una USB o a la nube.

### Restaurar

En **Configuración → Restaurar desde un respaldo** eliges un archivo `.json` generado por el sistema. La app lo revisa,
muestra lo que contiene y pide confirmación antes de reemplazar salones, horarios, estudiantes (con sus mismos QR) y asistencias.
No toca las cuentas ni las contraseñas. Antes de reemplazar guarda una copia de lo que había en
`backend/data/respaldos/antes-de-restaurar-*.json`, así que siempre se puede deshacer restaurando esa copia.

**Pasar todo a otro computador:** instala el proyecto allí (`npm install` y `npm run seed`), entra como administrador
y restaura el último `respaldo.json`.

## Publicar en Vercel

- **`api/index.js`** expone la app de Express como función de Vercel. El frontend se sirve como archivos estáticos desde `frontend/` (ver `vercel.json`).
- **Variables de entorno en Vercel:**
  - `JWT_SECRET`, la clave de las sesiones (ya configurada).
  - `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, que se crean solas al conectar Turso desde Vercel: Storage → Turso.
- **Hora:** el servidor usa siempre la hora de Colombia (`APP_TIMEZONE`, por defecto `America/Bogota`), aunque Vercel corra en UTC.
- **Pasar los datos locales a Turso:** `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run db:push`. Reemplaza lo que haya en Turso.
- **Publicar:** `vercel deploy --prod`.
