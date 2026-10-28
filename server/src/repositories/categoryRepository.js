import prisma from '../lib/prisma.js';

// Category data access stays here so category services can focus on rules such as ownership.
export const listCategories = (userId, type) => prisma.category.findMany({ where: { userId, ...(type ? { type } : {}) }, orderBy: { name: 'asc' } });
// Services use this lookup before creating transactions or budgets so they
// can confirm that the referenced category belongs to the current user.
export const findCategoryById = (id) => prisma.category.findUnique({ where: { id } });
export const findCategoryByName = (userId, name) => prisma.category.findFirst({ where: { userId, name } });
export const createCategory = (data) => prisma.category.create({ data });
export const updateCategory = (id, data) => prisma.category.update({ where: { id }, data });
export const countTransactionsForCategory = (categoryId) => prisma.transaction.count({ where: { categoryId } });
export const deleteCategory = (id) => prisma.category.delete({ where: { id } });