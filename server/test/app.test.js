import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startApi } from './helpers/api.js';

const { request } = await startApi();

describe('app', () => {
  it('reports health', async () => {
    const res = await request('GET', '/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(typeof res.body.uptime, 'number');
  });

  it('returns 400 for a body that is not valid JSON', async () => {
    const res = await request('POST', '/api/users', '{"name": "Ada",');

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Request body is not valid JSON');
  });

  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request('GET', '/api/nope');

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'No route for GET /api/nope');
  });
});
