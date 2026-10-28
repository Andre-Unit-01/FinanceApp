/*
 * Central error response middleware.
 *
 * Controllers pass rejected operations here with next(error). Known AppError
 * values become readable API responses; unexpected errors stay generic so
 * database or implementation details are not shown to the browser.
 */
import AppError from '../utils/AppError.js';

export const notFound = (req, res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  // If another middleware already started the response, Express must finish
  // handling the original error instead of writing a second response.
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err instanceof AppError ? err.message : 'Something went wrong';

  const response = {
    error: {
      code,
      message,
    },
  };

  if (err instanceof AppError && Object.keys(err.details || {}).length > 0) {
    response.error.fields = err.details;
  }

  res.status(statusCode).json(response);
};
