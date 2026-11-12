/** Servidor local (desarrollo o uso en un PC del colegio). En Vercel se usa api/index.js. */
import { app } from './app.js';
import { env } from './config/env.js';
import { DB_KIND, init } from './db/database.js';
import { BACKUP_FILE, writeBackup } from './services/backup.service.js';

await init();
app.listen(env.port, () => {
  console.log(`✔ Servidor listo en http://localhost:${env.port}`);
  console.log(`  Base de datos: ${DB_KIND === 'turso' ? 'Turso (nube)' : 'archivo local'}`);
  writeBackup();
  console.log(`  Respaldo: ${BACKUP_FILE}`);
});
