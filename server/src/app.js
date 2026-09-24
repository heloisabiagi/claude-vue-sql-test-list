import express from 'express';
import cors from 'cors';
import { migrate } from './db/index.js';
import { usersRouter } from './routes/users.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export function createApp() {
  migrate();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
