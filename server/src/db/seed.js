import { db, migrate, DB_PATH } from './index.js';

migrate();

const SAMPLE = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin', country: 'GB' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'admin', country: 'US' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'member', country: 'GB' },
  { name: 'Katherine Johnson', email: 'katherine@example.com', role: 'member', country: 'US' },
  { name: 'Radia Perlman', email: 'radia@example.com', role: 'viewer', country: 'US' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, role, country) VALUES (?, ?, ?, ?)',
);

let added = 0;
for (const { name, email, role, country } of SAMPLE) {
  added += insert.run(name, email, role, country).changes;
}

console.log(`Seeded ${added} new user(s) into ${DB_PATH}`);
db.close();
