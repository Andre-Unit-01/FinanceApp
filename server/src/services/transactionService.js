/*
 * Transaction business logic.
 *
 * This service receives form data from the controller, validates financial
 * fields and ownership, builds database filters for paging/sorting, and uses
 * the transaction repository for persistence. Decimal values are converted to
 * regular numbers before the API sends them to the browser.
 */
import AppError from '../utils/AppError.js';
import { countTransactions, findTransactions, findTransactionById, createTransaction as saveTransaction, updateTransaction as saveTransactionChanges, deleteTransaction as removeTransaction } from '../repositories/transactionRepository.js';
import { findCategoryById } from '../repositories/categoryRepository.js';

const normalizeWhere = (userId, filters = {}) => {
  // Start every query with the authenticated user. This prevents a caller
  // from using filters to read another user's transactions.
  const where = { userId, ...(filters.type ? { type: filters.type } : {}), ...(filters.categoryId ? { categoryId: filters.categoryId } : {}) };

  if (filters.startDate || filters.endDate) {
    where.transactionDate = {};
    if (filters.startDate) where.transactionDate.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.transactionDate.lte = end;
    }
  }

  return where;
};

export const listTransactions = async (userId, filters = {}, page = 1, limit = 20) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;
  const where = normalizeWhere(userId, filters);
  const sortBy = ['transactionDate', 'amount', 'description', 'createdAt'].includes(filters.sortBy) ? filters.sortBy : 'transactionDate';
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

  // Count and fetch the current page together. Promise.all allows both
  // independent database operations to run before the response is built.
  const [total, data] = await Promise.all([
    countTransactions(where),
    findTransactions({ where, orderBy: { [sortBy]: sortOrder }, skip: (safePage - 1) * safeLimit, take: safeLimit }),
  ]);

  return {
    data: data.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
};

export const getTransactionById = async (userId, id) => {
  const transaction = await findTransactionById(id);

  if (!transaction) {
    throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
  }

  if (transaction.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this transaction');
  }

  return { ...transaction, amount: Number(transaction.amount) };
};

export const createTransaction = async (userId, input) => {
  const { amount, type, categoryId, description, transactionDate } = input;

  if (!amount || Number(amount) <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { amount: 'Amount must be greater than zero' });
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { type: 'Type must be INCOME or EXPENSE' });
  }

  if (!categoryId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category is required' });
  }

  if (!description || !description.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { description: 'Description is required' });
  }

  if (!transactionDate) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { transactionDate: 'Transaction date is required' });
  }

  // Categories are shared references for transactions, so verify ownership
  // before allowing this user's transaction to point at one.
  const category = await findCategoryById(categoryId);
  if (!category || category.userId !== userId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category does not belong to this user' });
  }

  const entry = await saveTransaction({
      userId,
      categoryId,
      amount,
      type,
      description: description.trim(),
      transactionDate: new Date(transactionDate),
  });

  return { ...entry, amount: Number(entry.amount) };
};

export const updateTransaction = async (userId, id, input) => {
  const existing = await findTransactionById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
  }

  if (existing.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this transaction');
  }

  if (input.categoryId) {
    const category = await findCategoryById(input.categoryId);
    if (!category || category.userId !== userId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request', { categoryId: 'Category does not belong to this user' });
    }
  }

  // Only fields supplied by the edit form are changed. Unsent fields keep
  // their existing database values.
  const updated = await saveTransactionChanges(id, {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.transactionDate ? { transactionDate: new Date(input.transactionDate) } : {}),
  });

  return { ...updated, amount: Number(updated.amount) };
};

export const deleteTransaction = async (userId, id) => {
  const existing = await findTransactionById(id);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
  }

  if (existing.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this transaction');
  }

  await removeTransaction(id);
  return { success: true };
};
