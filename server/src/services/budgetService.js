/*
 * Category-budget business logic.
 *
 * A Budget row stores what the user plans to spend for one category, month,
 * and year. Actual spending is intentionally calculated elsewhere from
 * transactions, so this service never stores duplicate spent totals.
 */
import AppError from '../utils/AppError.js';
import { listBudgets as listBudgetRecords, findBudget, findBudgetForCategory, createBudget as saveBudget, updateBudget as saveBudgetChanges, deleteBudget as removeBudget } from '../repositories/budgetRepository.js';
import { findCategoryById } from '../repositories/categoryRepository.js';

export const listBudgets = async (userId) => {
  return listBudgetRecords(userId);
};

export const createBudget = async (userId, input) => {
  const { categoryId, month, year, amount } = input;

  if (!categoryId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category is required' });
  }
  if (!Number.isInteger(Number(month)) || Number(month) < 1 || Number(month) > 12) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { month: 'Month must be between 1 and 12' });
  }
  if (!Number.isInteger(Number(year)) || Number(year) < 2000) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { year: 'Year is required' });
  }
  if (!amount || Number(amount) <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { amount: 'Amount must be greater than zero' });
  }

  const category = await findCategoryById(categoryId);
  if (!category || category.userId !== userId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category does not belong to this user' });
  }

  const existing = await findBudgetForCategory(userId, categoryId, Number(month), Number(year));
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A budget already exists for this category and month');
  }

  return saveBudget({ userId, categoryId, month: Number(month), year: Number(year), amount });
};

export const updateBudget = async (userId, id, input) => {
  const budget = await findBudget(id);
  if (!budget || budget.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this budget');
  }

  if (input.amount !== undefined && (!input.amount || Number(input.amount) <= 0)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { amount: 'Amount must be greater than zero' });
  }

  if (input.categoryId) {
    const category = await findCategoryById(input.categoryId);
    if (!category || category.userId !== userId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category does not belong to this user' });
    }
  }

  return saveBudgetChanges(id, {
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.month !== undefined ? { month: Number(input.month) } : {}),
      ...(input.year !== undefined ? { year: Number(input.year) } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
  });
};

export const deleteBudget = async (userId, id) => {
  const budget = await findBudget(id);
  if (!budget || budget.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this budget');
  }

  await removeBudget(id);
  return { success: true };
};
