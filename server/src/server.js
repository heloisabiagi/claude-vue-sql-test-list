import { createApp } from './app.js';
import { db, DB_PATH } from './db/index.js';

const PORT = Number(process.env.PORT) || 3000;

const server = createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`SQLite database: ${DB_PATH}`);
});

// Close the database cleanly so WAL contents are checkpointed on exit.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
