import { handle } from '../../middleware/asyncHandler.js';
import { parseId } from '../../middleware/validate.js';
import { loadUserOr404 } from './shared.js';

/** GET /api/users/:id */
export const get = handle((req, res) => {
  const user = loadUserOr404(parseId(req.params.id));
  res.json({ data: user });
});
