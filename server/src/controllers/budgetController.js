/*
 * Budget controller.
 *
 * Category-budget CRUD and the monthly planner share this HTTP boundary, but
 * their business logic remains in budgetService and budgetPlannerService.
 */
import { listBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService.js';
import { getBudgetPlanner, saveMonthlyBudget } from '../services/budgetPlannerService.js';

export const getPlanner = async (req, res, next) => {
  try {
    res.json(await getBudgetPlanner(req.user.id, req.query.year, req.query.month));
  } catch (error) {
    next(error);
  }
};

export const saveMonthly = async (req, res, next) => {
  try {
    res.json(await saveMonthlyBudget(req.user.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (req, res, next) => {
  try {
    const budgets = await listBudgets(req.user.id);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const budget = await createBudget(req.user.id, req.body);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const budget = await updateBudget(req.user.id, req.params.id, req.body);
    res.json(budget);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await deleteBudget(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
