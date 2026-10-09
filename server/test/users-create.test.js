import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startApi } from './helpers/api.js';

const { request, createUser } = await startApi();

describe('POST /api/users', () => {
  it('creates a user, normalizing name, email and country', async () => {
    const res = await request('POST', '/api/users', {
      name: '  Ada Lovelace ',
      email: ' Ada@Example.COM ',
      role: 'admin',
      country: ' gb ',
    });

    assert.equal(res.status, 201);
    assert.equal(res.headers.get('location'), `/api/users/${res.body.data.id}`);
    const { createdAt, updatedAt, ...fields } = res.body.data;
    assert.deepEqual(fields, {
      id: 1,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'admin',
      country: 'GB',
    });
    assert.match(createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.equal(updatedAt, createdAt);

    // The Location header points at the stored row.
    const fetched = await request('GET', res.headers.get('location'));
    assert.deepEqual(fetched.body.data, res.body.data);
  });

  it('defaults role to member', async () => {
    const res = await request('POST', '/api/users', {
      name: 'Alan Turing',
      email: 'alan@example.com',
      country: 'GB',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.role, 'member');
  });

  it('rejects missing fields with per-field details', async () => {
    const res = await request('POST', '/api/users', {});

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.deepEqual(Object.keys(res.body.details).sort(), ['country', 'email', 'name']);
  });

  it('rejects invalid values with per-field details', async () => {
    const res = await request('POST', '/api/users', {
      name: 'x'.repeat(121),
      email: 'not-an-email',
      role: 'owner',
      country: 'XX',
    });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body.details, {
      name: 'Name must be 120 characters or fewer',
      email: 'Email must be a valid address',
      role: 'Role must be one of: admin, member, viewer',
      country: 'Country must be a valid ISO 3166 country code',
    });

    const list = await request('GET', '/api/users');
    assert.equal(list.body.meta.total, 0, 'a rejected payload must not be stored');
  });

  it('rejects an email already in use, ignoring case', async () => {
    await createUser({ email: 'ada@example.com' });

    for (const email of ['ada@example.com', 'ADA@Example.com']) {
      const res = await request('POST', '/api/users', {
        name: 'Impostor',
        email,
        country: 'US',
      });
      assert.equal(res.status, 409, email);
      assert.equal(res.body.error, 'A user with that email already exists');
    }

    const list = await request('GET', '/api/users');
    assert.equal(list.body.meta.total, 1);
  });
});
