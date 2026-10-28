/*
 * Authentication business logic.
 *
 * Input comes from authController. This service normalizes and validates
 * credentials, asks the user repository for records, hashes passwords, and
 * returns a token that the client stores for later protected requests.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import { findUserByEmail, createUser, findUserProfileById } from '../repositories/userRepository.js';

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const buildToken = (user) => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'local-dev-secret', { expiresIn: '7d' });

export const registerUser = async ({ email, password }) => {
  // Normalizing here means registration and login treat casing and whitespace
  // consistently before looking up the user repository record.
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { email: 'Please provide a valid email address' });
  }

  if (!password || password.length < 6) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { password: 'Password must be at least 6 characters long' });
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(409, 'CONFLICT', 'A user with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ email: normalizedEmail, passwordHash });

  return {
    token: buildToken(user),
    user: { id: user.id, email: user.email },
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { email: 'Please provide a valid email address' });
  }

  if (!password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { password: 'Password is required' });
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // The plain password is never stored. bcrypt compares it with the saved
  // hash and returns only whether the credentials match.
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  return {
    token: buildToken(user),
    user: { id: user.id, email: user.email },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserProfileById(userId);

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  return user;
};
