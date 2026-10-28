/*
 * Authentication middleware.
 *
 * Protected routes use this function before their controllers. It verifies
 * the JWT, loads the current user through the user repository, and places a
 * small user object on req.user for the next layer.
 */
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import { findUserById } from '../repositories/userRepository.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Verifying the token proves that it was created by this application and
    // also gives us the user ID needed to load the current account.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local-dev-secret');
    const userRecord = await findUserById(decoded.id);
    const user = userRecord ? { id: userRecord.id, email: userRecord.email } : null;

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    req.user = user;
    next();
  } catch (error) {
    // JWT libraries use their own error classes. Convert them to the same
    // friendly 401 response used for a missing or unknown user.
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
      return;
    }

    next(error);
  }
};

export default authMiddleware;
