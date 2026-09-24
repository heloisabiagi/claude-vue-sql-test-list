import { deleteUser } from '../../db/users.js';
import { handle } from '../../middleware/asyncHandler.js';
import { parseId } from '../../middleware/validate.js';
import { ApiError } from '../../middleware/errors.js';

/** DELETE /api/users/:id */
export const remove = handle((req, res) => {
  const deleted = deleteUser(parseId(req.params.id));
  if (!deleted) throw ApiError.notFound('User not found');

  res.status(204).end();
});
