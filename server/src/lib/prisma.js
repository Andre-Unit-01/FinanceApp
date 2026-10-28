/*
 * Shared database client.
 *
 * Every repository imports this single PrismaClient instance. Keeping one
 * client avoids making a new database connection for every request.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
