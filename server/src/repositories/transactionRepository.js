import prisma from '../lib/prisma.js';

const transactionWithCategory = { category: { select: { id: true, name: true, type: true } } };

// Transaction repositories contain Prisma queries only. Pagination and validation remain service decisions.
export const countTransactions = (where) => prisma.transaction.count({ where });
// The service has already decided the filters, sort order, and page size.
// This function simply asks Prisma for those rows and includes category names
// needed by the transaction table.
export const findTransactions = ({ where, orderBy, skip, take }) => prisma.transaction.findMany({ where, include: transactionWithCategory, orderBy, skip, take });
export const findTransactionById = (id) => prisma.transaction.findUnique({ where: { id }, include: transactionWithCategory });
export const findTransactionRecords = (where) => prisma.transaction.findMany({ where, select: { amount: true, type: true, categoryId: true } });
// Upcoming expenses include their category label because the planner displays
// description, category, amount, and due date together.
export const findUpcomingExpenses = (where) => prisma.transaction.findMany({ where, include: { category: { select: { name: true } } }, orderBy: { transactionDate: 'asc' } });
export const createTransaction = (data) => prisma.transaction.create({ data, include: transactionWithCategory });
export const updateTransaction = (id, data) => prisma.transaction.update({ where: { id }, data, include: transactionWithCategory });
export const deleteTransaction = (id) => prisma.transaction.delete({ where: { id } });