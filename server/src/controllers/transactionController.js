/*
 * Transaction HTTP controller.
 *
 * The controller keeps request and response handling thin. Validation,
 * ownership checks, pagination decisions, and persistence belong to the
 * transaction service and repository layers.
 */
import { listTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction } from '../services/transactionService.js';

export const getTransactions = async (req, res, next) => {
  try {
    const result = await listTransactions(req.user.id, req.query, req.query.page, req.query.limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const result = await getTransactionById(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const result = await createTransaction(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const result = await updateTransaction(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await deleteTransaction(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
