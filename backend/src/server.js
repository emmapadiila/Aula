import { app } from './app.js';
import { env } from './config/env.js';
import { BACKUP_FILE, writeBackup } from './services/backup.service.js';

app.listen(env.port, () => {
  console.log(`✔ Servidor listo en http://localhost:${env.port}`);
  console.log(`  API:      http://localhost:${env.port}/api/health`);
  writeBackup();
  console.log(`  Respaldo: ${BACKUP_FILE}`);
});
