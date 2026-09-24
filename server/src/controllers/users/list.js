import { listUsers } from '../../db/users.js';
import { handle } from '../../middleware/asyncHandler.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Coerces a query param to an integer inside [min, max], falling back if unusable. */
function clamp(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/** GET /api/users?search=&limit=&offset= */
export const list = handle((req, res) => {
  const search = (req.query.search ?? '').toString().trim();
  const limit = clamp(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clamp(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);

  const { rows, total } = listUsers({ search, limit, offset });
  res.json({ data: rows, meta: { total, limit, offset, search } });
});
