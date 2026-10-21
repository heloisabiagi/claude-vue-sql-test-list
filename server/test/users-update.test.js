import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startApi } from './helpers/api.js';

const { db, request, createUser } = await startApi();

describe('PATCH /api/users/:id', () => {
  it('changes only the supplied fields', async () => {
    const user = await createUser({ name: 'Ada', email: 'ada@example.com', role: 'admin', country: 'GB' });

    const res = await request('PATCH', `/api/users/${user.id}`, { name: '  Ada Lovelace ' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Ada Lovelace');
    assert.equal(res.body.data.email, 'ada@example.com');
    assert.equal(res.body.data.role, 'admin');
    assert.equal(res.body.data.country, 'GB');

    const stored = await request('GET', `/api/users/${user.id}`);
    assert.deepEqual(stored.body.data, res.body.data);
  });

  it('normalizes email and country', async () => {
    const user = await createUser();

    const res = await request('PATCH', `/api/users/${user.id}`, {
      email: ' New@Example.COM ',
      country: ' us ',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'new@example.com');
    assert.equal(res.body.data.country, 'US');
  });

  it('lets a user keep their own email, in any case', async () => {
    const user = await createUser({ email: 'ada@example.com' });

    const res = await request('PATCH', `/api/users/${user.id}`, { email: 'ADA@example.com' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'ada@example.com');
  });

  it("rejects another user's email, ignoring case", async () => {
    await createUser({ email: 'ada@example.com' });
    const grace = await createUser({ email: 'grace@example.com' });

    const res = await request('PATCH', `/api/users/${grace.id}`, { email: 'Ada@Example.com' });

    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'A user with that email already exists');

    const stored = await request('GET', `/api/users/${grace.id}`);
    assert.equal(stored.body.data.email, 'grace@example.com');
  });

  it('rejects an empty body', async () => {
    const user = await createUser();

    const res = await request('PATCH', `/api/users/${user.id}`, {});

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Provide at least one of: name, email, role, country');
  });

  it('rejects a body with only unknown fields', async () => {
    const user = await createUser();

    const res = await request('PATCH', `/api/users/${user.id}`, { nickname: 'Countess' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Provide at least one of: name, email, role, country');
  });

  it('rejects invalid values and leaves the user unchanged', async () => {
    const user = await createUser();

    const res = await request('PATCH', `/api/users/${user.id}`, { name: '', role: 'owner' });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body.details, {
      name: 'Name is required',
      role: 'Role must be one of: admin, member, viewer',
    });

    const stored = await request('GET', `/api/users/${user.id}`);
    assert.deepEqual(stored.body.data, user);
  });

  it('bumps updatedAt and keeps createdAt', async () => {
    const user = await createUser();
    const old = '2020-01-01 00:00:00';
    db.prepare('UPDATE users SET created_at = ?, updated_at = ? WHERE id = ?').run(old, old, user.id);

    const res = await request('PATCH', `/api/users/${user.id}`, { role: 'viewer' });

    assert.equal(res.body.data.createdAt, old);
    assert.ok(res.body.data.updatedAt > old, `updatedAt ${res.body.data.updatedAt} was not bumped`);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request('PATCH', '/api/users/999', { name: 'Nobody' });

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'User not found');
  });
});

describe('PUT /api/users/:id', () => {
  it('replaces every field', async () => {
    const user = await createUser({ name: 'Ada', email: 'ada@example.com', role: 'admin', country: 'GB' });

    const res = await request('PUT', `/api/users/${user.id}`, {
      name: 'Grace Hopper',
      email: 'Grace@Example.com',
      role: 'viewer',
      country: 'us',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, user.id);
    assert.equal(res.body.data.name, 'Grace Hopper');
    assert.equal(res.body.data.email, 'grace@example.com');
    assert.equal(res.body.data.role, 'viewer');
    assert.equal(res.body.data.country, 'US');
    assert.equal(res.body.data.createdAt, user.createdAt);
  });

  it('rejects a payload with missing fields', async () => {
    const user = await createUser();

    const res = await request('PUT', `/api/users/${user.id}`, { name: 'Only a name' });

    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ['country', 'email']);
  });

  it('lets a user keep their own email', async () => {
    const user = await createUser({ email: 'ada@example.com' });

    const res = await request('PUT', `/api/users/${user.id}`, {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'admin',
      country: 'GB',
    });

    assert.equal(res.status, 200);
  });

  it("rejects another user's email", async () => {
    await createUser({ email: 'ada@example.com' });
    const grace = await createUser({ email: 'grace@example.com' });

    const res = await request('PUT', `/api/users/${grace.id}`, {
      name: 'Grace Hopper',
      email: 'ada@example.com',
      role: 'admin',
      country: 'US',
    });

    assert.equal(res.status, 409);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request('PUT', '/api/users/999', {
      name: 'Nobody',
      email: 'nobody@example.com',
      role: 'member',
      country: 'BR',
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'User not found');
  });
});
