import { updateUser } from '../../db/users.js';
import { handle } from '../../middleware/asyncHandler.js';
import { validateCreate, parseId } from '../../middleware/validate.js';
import { loadUserOr404, assertEmailAvailable } from './shared.js';

/** PUT /api/users/:id — full replacement; every field is required. */
export const replace = handle((req, res) => {
  const id = parseId(req.params.id);
  loadUserOr404(id);

  const payload = validateCreate(req.body);
  assertEmailAvailable(payload.email, id);

  res.json({ data: updateUser(id, payload) });
});
