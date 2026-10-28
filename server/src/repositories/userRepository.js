import prisma from '../lib/prisma.js';

// Repositories are the only layer that knows how User records are stored.
// Services call these small methods instead of writing Prisma queries themselves.
export const findUserByEmail = (email) => prisma.user.findUnique({ where: { email } });
export const findUserById = (id) => prisma.user.findUnique({ where: { id } });
// Registration returns only safe profile fields. The password hash is needed
// during login but is not sent back to the browser.
export const createUser = (data) => prisma.user.create({ data, select: { id: true, email: true, createdAt: true } });
export const findUserProfileById = (id) => prisma.user.findUnique({ where: { id }, select: { id: true, email: true, createdAt: true } });