import { Router } from 'express';
import {
  listUsers,
  getUser,
  findByEmail,
  createUser,
  updateUser,
  deleteUser,
} from '../db/users.js';
import { ApiError } from '../middleware/errors.js';
import { validateCreate, validateUpdate, parseId } from '../middleware/validate.js';

export const usersRouter = Router();

// Wraps an async handler so rejected promises reach the error middleware.
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function clamp(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

// GET /api/users?search=&limit=&offset=
usersRouter.get(
  '/',
  handle((req, res) => {
    const search = (req.query.search ?? '').toString().trim();
    const limit = clamp(req.query.limit, 50, 1, 200);
    const offset = clamp(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

    const { rows, total } = listUsers({ search, limit, offset });
    res.json({ data: rows, meta: { total, limit, offset, search } });
  }),
);

// GET /api/users/:id
usersRouter.get(
  '/:id',
  handle((req, res) => {
    const user = getUser(parseId(req.params.id));
    if (!user) throw ApiError.notFound('User not found');
    res.json({ data: user });
  }),
);

// POST /api/users
usersRouter.post(
  '/',
  handle((req, res) => {
    const payload = validateCreate(req.body);
    const user = createUser(payload);
    res.status(201).location(`/api/users/${user.id}`).json({ data: user });
  }),
);

// PATCH /api/users/:id
usersRouter.patch(
  '/:id',
  handle((req, res) => {
    const id = parseId(req.params.id);
    if (!getUser(id)) throw ApiError.notFound('User not found');

    const patch = validateUpdate(req.body);

    // Checked up front so a self-update to the same address isn't a conflict.
    if (patch.email) {
      const owner = findByEmail(patch.email);
      if (owner && owner.id !== id) {
        throw ApiError.conflict('A user with that email already exists');
      }
    }

    res.json({ data: updateUser(id, patch) });
  }),
);

// PUT /api/users/:id — full replacement; all fields required.
usersRouter.put(
  '/:id',
  handle((req, res) => {
    const id = parseId(req.params.id);
    if (!getUser(id)) throw ApiError.notFound('User not found');

    const payload = validateCreate(req.body);
    const owner = findByEmail(payload.email);
    if (owner && owner.id !== id) {
      throw ApiError.conflict('A user with that email already exists');
    }

    res.json({ data: updateUser(id, payload) });
  }),
);

// DELETE /api/users/:id
usersRouter.delete(
  '/:id',
  handle((req, res) => {
    if (!deleteUser(parseId(req.params.id))) throw ApiError.notFound('User not found');
    res.status(204).end();
  }),
);
