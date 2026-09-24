import { getUser, findByEmail } from '../../db/users.js';
import { ApiError } from '../../middleware/errors.js';

/** Loads a user by id, raising a 404 when there is no such row. */
export function loadUserOr404(id) {
  const user = getUser(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/**
 * Rejects an email already taken by a different user. Checked before the write
 * so the API can return a clean 409, and so a user keeping their own address is
 * not treated as a conflict. The unique index is still the real guarantee.
 */
export function assertEmailAvailable(email, selfId) {
  const owner = findByEmail(email);
  if (owner && owner.id !== selfId) {
    throw ApiError.conflict('A user with that email already exists');
  }
}
