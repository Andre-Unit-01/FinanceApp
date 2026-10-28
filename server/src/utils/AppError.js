// AppError carries an HTTP status, stable error code, and optional field
// details from a service to Express's central error handler.
class AppError extends Error {
  constructor(statusCode, code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export default AppError;
