/*
 * Authentication controller.
 *
 * Controllers adapt HTTP requests to service calls. They read input from
 * req.body or req.user, return the service result, and pass failures to the
 * shared error middleware.
 */
import { registerUser, loginUser, getCurrentUser } from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    // The service validates and stores the credentials; this controller only
    // translates the result into an HTTP 201 response.
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req, res) => {
  // Tokens are removed by the browser. The server endpoint confirms the UI
  // action without storing a server-side session.
  res.json({ message: 'Logged out successfully' });
};
