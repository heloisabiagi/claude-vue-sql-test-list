import { updateUser } from '../../db/users.js';
import { handle } from '../../middleware/asyncHandler.js';
import { validateUpdate, parseId } from '../../middleware/validate.js';
import { loadUserOr404, assertEmailAvailable } from './shared.js';

/** PATCH /api/users/:id — partial update of name, email and/or role. */
export const update = handle((req, res) => {
  const id = parseId(req.params.id);
  loadUserOr404(id);

  const patch = validateUpdate(req.body);
  if (patch.email) assertEmailAvailable(patch.email, id);

  res.json({ data: updateUser(id, patch) });
});
