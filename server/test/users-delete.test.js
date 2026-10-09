import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startApi } from './helpers/api.js';

const { request, createUser } = await startApi();

describe('DELETE /api/users/:id', () => {
  it('deletes the user, then 404s on a second delete', async () => {
    const user = await createUser();
    const other = await createUser();

    const res = await request('DELETE', `/api/users/${user.id}`);
    assert.equal(res.status, 204);
    assert.equal(res.body, null);

    const gone = await request('GET', `/api/users/${user.id}`);
    assert.equal(gone.status, 404);

    const again = await request('DELETE', `/api/users/${user.id}`);
    assert.equal(again.status, 404);
    assert.equal(again.body.error, 'User not found');

    // Only the targeted row is removed.
    const list = await request('GET', '/api/users');
    assert.deepEqual(list.body.data.map((u) => u.id), [other.id]);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request('DELETE', '/api/users/abc');

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'User id must be a positive integer');
  });
});
