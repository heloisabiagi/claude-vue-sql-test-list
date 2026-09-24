import { createUser } from '../../db/users.js';
import { handle } from '../../middleware/asyncHandler.js';
import { validateCreate } from '../../middleware/validate.js';

/** POST /api/users */
export const create = handle((req, res) => {
  const payload = validateCreate(req.body);
  const user = createUser(payload);

  res.status(201).location(`/api/users/${user.id}`).json({ data: user });
});
