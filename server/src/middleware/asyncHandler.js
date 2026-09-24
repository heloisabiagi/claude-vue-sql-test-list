/**
 * Wraps a route handler so thrown errors and rejected promises reach the
 * error middleware instead of escaping as unhandled rejections.
 */
export const handle =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
