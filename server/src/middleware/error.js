import { logger } from '../utils/logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  }
  res.status(status).json({
    error: err.message || 'Server error',
    ...(err.details ? { details: err.details } : {}),
  });
}
