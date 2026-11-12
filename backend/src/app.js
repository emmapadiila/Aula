import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import { backupAfterWrites } from './services/backup.service.js';

export const app = express();

app.disable('x-powered-by');
// JSON de hasta 2 MB; la restauración de respaldos usa su propio límite (50 MB) en routes/index.js
const json = express.json({ limit: '2mb' });
app.use((req, res, next) => (req.path === '/api/backup/restore' ? next() : json(req, res, next)));

// API REST
app.use('/api', backupAfterWrites, routes);
app.use('/api', notFoundHandler);

// Frontend estático (HTML/CSS/JS) servido por el mismo servidor
app.use(express.static(env.frontendDir, { extensions: ['html'] }));

app.use(errorHandler);
