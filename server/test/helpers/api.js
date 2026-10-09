import { mkdtempSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach } from 'node:test';

/**
 * Starts the real app on a random port, backed by a throwaway SQLite file.
 *
 * The database connection opens when src/db/index.js is first imported, so
 * DATABASE_PATH must be set before the dynamic imports below. node --test runs
 * each test file in its own process, so every file gets its own database.
 * The table is emptied before each test.
 */
export async function startApi() {
  const dir = mkdtempSync(join(tmpdir(), 'users-api-test-'));
  process.env.DATABASE_PATH = join(dir, 'users.db');

  const { createApp } = await import('../../src/app.js');
  const { db } = await import('../../src/db/index.js');

  const server = createApp().listen(0);
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  beforeEach(() => {
    db.exec(`DELETE FROM users; DELETE FROM sqlite_sequence WHERE name = 'users';`);
  });

  after(async () => {
    // fetch keeps connections alive, which would otherwise hold close() open.
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /**
   * Sends a request and parses the JSON reply. A string body is sent as-is
   * (for malformed-JSON tests); anything else is JSON-encoded.
   */
  async function request(method, path, body) {
    const init = { method };
    if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${path}`, init);
    const text = await res.text();
    return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
  }

  let counter = 0;

  /** Creates a user through the API, filling in valid defaults for omitted fields. */
  async function createUser(fields = {}) {
    counter += 1;
    const res = await request('POST', '/api/users', {
      name: `User ${counter}`,
      email: `user${counter}@example.com`,
      role: 'member',
      country: 'BR',
      ...fields,
    });
    if (res.status !== 201) {
      throw new Error(`createUser failed with ${res.status}: ${JSON.stringify(res.body)}`);
    }
    return res.body.data;
  }

  return { db, request, createUser };
}
