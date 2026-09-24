const BASE = '/api';

/** Raised for non-2xx responses; carries the API's per-field validation details. */
export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.status = status;
    this.details = details ?? {};
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      ...options,
    });
  } catch {
    throw new ApiError('Cannot reach the API. Is the server running?');
  }

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(payload.error || `Request failed (${res.status})`, {
      status: res.status,
      details: payload.details,
    });
  }
  return payload;
}

export const api = {
  list: ({ search = '', limit = 50, offset = 0 } = {}) => {
    const qs = new URLSearchParams({ limit, offset });
    if (search) qs.set('search', search);
    return request(`/users?${qs}`);
  },
  create: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id, patch) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};
