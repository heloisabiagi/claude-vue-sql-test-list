import { db } from './index.js';

const COLUMNS = 'id, name, email, role, created_at AS createdAt, updated_at AS updatedAt';

/**
 * Lists users with optional case-insensitive search over name and email.
 * Returns a page of rows plus the total matching count for the client's pager.
 */
export function listUsers({ search = '', limit = 50, offset = 0 } = {}) {
  const where = search ? `WHERE name LIKE :q OR email LIKE :q` : '';
  const params = search ? { q: `%${search}%` } : {};

  const rows = db
    .prepare(
      `SELECT ${COLUMNS} FROM users ${where}
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT :limit OFFSET :offset`,
    )
    .all({ ...params, limit, offset });

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM users ${where}`)
    .get(params);

  return { rows, total };
}

export function getUser(id) {
  return db.prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id);
}

export function findByEmail(email) {
  return db
    .prepare(`SELECT ${COLUMNS} FROM users WHERE lower(email) = lower(?)`)
    .get(email);
}

export function createUser({ name, email, role }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)')
    .run(name, email, role);

  return getUser(lastInsertRowid);
}

/**
 * Applies a partial update. Callers pass only the fields they want changed;
 * anything omitted keeps its current value.
 */
export function updateUser(id, fields) {
  const assignments = [];
  const values = [];

  for (const key of ['name', 'email', 'role']) {
    if (fields[key] !== undefined) {
      assignments.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (assignments.length === 0) return getUser(id);

  assignments.push(`updated_at = datetime('now')`);
  db.prepare(`UPDATE users SET ${assignments.join(', ')} WHERE id = ?`).run(...values, id);

  return getUser(id);
}

export function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}
