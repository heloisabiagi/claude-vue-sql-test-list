import { db, migrate, DB_PATH } from './index.js';

migrate();

const SAMPLE = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'admin' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
  { name: 'Katherine Johnson', email: 'katherine@example.com', role: 'member' },
  { name: 'Radia Perlman', email: 'radia@example.com', role: 'viewer' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, role) VALUES (?, ?, ?)',
);

let added = 0;
for (const { name, email, role } of SAMPLE) {
  added += insert.run(name, email, role).changes;
}

console.log(`Seeded ${added} new user(s) into ${DB_PATH}`);
db.close();
