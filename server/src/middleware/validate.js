import { ApiError } from './errors.js';

export const ROLES = ['admin', 'member', 'viewer'];

// Deliberately permissive: enough to catch typos without rejecting valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkName(value, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (value.trim().length > 120) {
    errors.name = 'Name must be 120 characters or fewer';
  }
}

function checkEmail(value, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_RE.test(value.trim())) {
    errors.email = 'Email must be a valid address';
  }
}

function checkRole(value, errors) {
  if (!ROLES.includes(value)) {
    errors.role = `Role must be one of: ${ROLES.join(', ')}`;
  }
}

/** Validates a full user payload for POST, returning normalized values. */
export function validateCreate(body = {}) {
  const errors = {};
  const { name, email } = body;
  const role = body.role ?? 'member';

  checkName(name, errors);
  checkEmail(email, errors);
  checkRole(role, errors);

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }

  return { name: name.trim(), email: email.trim().toLowerCase(), role };
}

/** Validates a partial payload for PATCH; only supplied fields are checked. */
export function validateUpdate(body = {}) {
  const errors = {};
  const patch = {};

  if (body.name !== undefined) {
    checkName(body.name, errors);
    patch.name = typeof body.name === 'string' ? body.name.trim() : body.name;
  }
  if (body.email !== undefined) {
    checkEmail(body.email, errors);
    patch.email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
  }
  if (body.role !== undefined) {
    checkRole(body.role, errors);
    patch.role = body.role;
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
  if (Object.keys(patch).length === 0) {
    throw ApiError.badRequest('Provide at least one of: name, email, role');
  }

  return patch;
}

/** Rejects ids that are not positive integers before they reach the database. */
export function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest('User id must be a positive integer');
  }
  return id;
}
