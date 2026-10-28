/*
 * Category business logic.
 *
 * Categories belong to one user and are referenced by transactions and
 * budgets. This service validates names and types, checks ownership, and then
 * asks the repository to perform the storage operation.
 */
import AppError from '../utils/AppError.js';
import { listCategories as listCategoryRecords, findCategoryById, findCategoryByName, createCategory as saveCategory, updateCategory as saveCategoryChanges, countTransactionsForCategory, deleteCategory as removeCategory } from '../repositories/categoryRepository.js';

export const listCategories = async (userId) => {
  return listCategoryRecords(userId);
};

export const createCategory = async (userId, input) => {
  const name = String(input.name || '').trim();
  const type = input.type;

  if (!name) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { name: 'Category name is required' });
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { type: 'Type must be INCOME or EXPENSE' });
  }

  const existing = await findCategoryByName(userId, name);
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A category with this name already exists');
  }

  return saveCategory({ userId, name, type });
};

export const updateCategory = async (userId, id, input) => {
  const category = await findCategoryById(id);
  if (!category || category.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this category');
  }

  const name = input.name !== undefined ? String(input.name).trim() : category.name;
  if (!name) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { name: 'Category name is required' });
  }

  if (input.type && !['INCOME', 'EXPENSE'].includes(input.type)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { type: 'Type must be INCOME or EXPENSE' });
  }

  return saveCategoryChanges(id, {
      ...(input.name !== undefined ? { name } : {}),
      ...(input.type ? { type: input.type } : {}),
  });
};

export const deleteCategory = async (userId, id) => {
  const category = await findCategoryById(id);
  if (!category || category.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this category');
  }

  const linkedTransactions = await countTransactionsForCategory(id);
  if (linkedTransactions > 0) {
    throw new AppError(409, 'CONFLICT', 'Cannot delete category with existing transactions');
  }

  await removeCategory(id);
  return { success: true };
};
