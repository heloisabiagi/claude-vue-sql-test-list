import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startApi } from './helpers/api.js';

const { db, request, createUser } = await startApi();

const ids = (res) => res.body.data.map((u) => u.id);

describe('GET /api/users/:id', () => {
  it('returns the user', async () => {
    const user = await createUser({ name: 'Grace Hopper' });

    const res = await request('GET', `/api/users/${user.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, user);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request('GET', '/api/users/999');

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'User not found');
  });

  for (const id of ['0', '-1', 'abc', '1.5']) {
    it(`returns 400 for the malformed id "${id}"`, async () => {
      const res = await request('GET', `/api/users/${id}`);

      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'User id must be a positive integer');
    });
  }
});

describe('GET /api/users', () => {
  it('returns an empty page when there are no users', async () => {
    const res = await request('GET', '/api/users');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { data: [], meta: { total: 0, limit: 50, offset: 0, search: '' } });
  });

  it('searches name and email, and counts only the matches', async () => {
    const ada = await createUser({ name: 'Ada Lovelace', email: 'ada@example.com' });
    const grace = await createUser({ name: 'Grace Hopper', email: 'grace@navy.mil' });
    const alan = await createUser({ name: 'Alan Turing', email: 'alan@example.com' });

    const byName = await request('GET', '/api/users?search=lovelace');
    assert.deepEqual(ids(byName), [ada.id]);
    assert.equal(byName.body.meta.total, 1);

    const byEmail = await request('GET', '/api/users?search=navy.mil');
    assert.deepEqual(ids(byEmail), [grace.id]);

    // total reflects every match, not just the page returned.
    const paged = await request('GET', '/api/users?search=example&limit=1');
    assert.equal(paged.body.data.length, 1);
    assert.equal(paged.body.meta.total, 2);
    assert.equal(paged.body.meta.search, 'example');
    assert.ok([ada.id, alan.id].includes(paged.body.data[0].id));
  });

  it('trims the search term', async () => {
    await createUser({ name: 'Ada Lovelace' });

    const res = await request('GET', '/api/users?search=%20%20ada%20');

    assert.equal(res.body.meta.search, 'ada');
    assert.equal(res.body.meta.total, 1);
  });

  it('orders newest first, breaking same-second ties by id', async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();

    // Pin timestamps so the test does not depend on the clock: b and c share a
    // second, and a is the newest despite having the lowest id.
    const setCreated = db.prepare('UPDATE users SET created_at = ? WHERE id = ?');
    setCreated.run('2026-01-03 00:00:00', a.id);
    setCreated.run('2026-01-01 00:00:00', b.id);
    setCreated.run('2026-01-01 00:00:00', c.id);

    const res = await request('GET', '/api/users');

    assert.deepEqual(ids(res), [a.id, c.id, b.id]);
  });

  it('pages through results with limit and offset', async () => {
    const [u1, u2, u3] = [await createUser(), await createUser(), await createUser()];

    const first = await request('GET', '/api/users?limit=2&offset=0');
    assert.deepEqual(ids(first), [u3.id, u2.id]);
    assert.equal(first.body.meta.total, 3);

    const second = await request('GET', '/api/users?limit=2&offset=2');
    assert.deepEqual(ids(second), [u1.id]);

    const beyond = await request('GET', '/api/users?limit=2&offset=10');
    assert.deepEqual(beyond.body.data, []);
    assert.equal(beyond.body.meta.total, 3);
  });

  const clampCases = [
    { query: 'limit=0', limit: 1, offset: 0 },
    { query: 'limit=1000', limit: 200, offset: 0 },
    { query: 'limit=abc', limit: 50, offset: 0 },
    { query: 'limit=2.9', limit: 2, offset: 0 },
    { query: 'offset=-5', limit: 50, offset: 0 },
    { query: 'offset=abc', limit: 50, offset: 0 },
  ];

  for (const { query, limit, offset } of clampCases) {
    it(`clamps "${query}" to limit=${limit}, offset=${offset}`, async () => {
      const res = await request('GET', `/api/users?${query}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.meta.limit, limit);
      assert.equal(res.body.meta.offset, offset);
    });
  }
});
