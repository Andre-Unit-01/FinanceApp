import prisma from '../lib/prisma.js';

// Analytics queries return raw database facts. Services turn those facts into financial meaning.
export const sumTransactions = (where) => prisma.transaction.aggregate({ where, _sum: { amount: true } });
// groupBy returns one raw total per category. The analytics service converts
// those database facts into the dashboard's readable response.
export const groupExpensesByCategory = (where) => prisma.transaction.groupBy({ by: ['categoryId'], where, _sum: { amount: true } });
export const findCategories = (userId, type) => prisma.category.findMany({ where: { userId, ...(type ? { type } : {}) }, select: { id: true, name: true, type: true }, orderBy: { name: 'asc' } });
export const findBudgetsForMonth = (userId, month, year) => prisma.budget.findMany({ where: { userId, month, year }, include: { category: { select: { id: true, name: true } } } });