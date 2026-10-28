import prisma from '../lib/prisma.js';

// Budget repositories provide storage operations. They do not decide whether an amount is valid.
export const listBudgets = (userId, month, year) => prisma.budget.findMany({ where: { userId, ...(month ? { month } : {}), ...(year ? { year } : {}) }, include: { category: { select: { id: true, name: true, type: true } } }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
// A category can have one budget for a user in a particular month and year.
// The service validates the request; this repository performs the lookup.
export const findBudget = (id) => prisma.budget.findUnique({ where: { id } });
export const findBudgetForCategory = (userId, categoryId, month, year) => prisma.budget.findFirst({ where: { userId, categoryId, month, year } });
export const createBudget = (data) => prisma.budget.create({ data, include: { category: { select: { id: true, name: true, type: true } } } });
export const updateBudget = (id, data) => prisma.budget.update({ where: { id }, data, include: { category: { select: { id: true, name: true, type: true } } } });
export const deleteBudget = (id) => prisma.budget.delete({ where: { id } });
export const findMonthlyBudget = (userId, month, year) => prisma.monthlyBudget.findUnique({ where: { userId_month_year: { userId, month, year } } });
export const saveMonthlyBudget = (userId, month, year, data) => prisma.monthlyBudget.upsert({ where: { userId_month_year: { userId, month, year } }, create: { userId, month, year, ...data }, update: data });