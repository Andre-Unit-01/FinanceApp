/*
 * Monthly budget planner business logic.
 *
 * This service combines three kinds of data for one month: saved targets,
 * planned category budgets, and actual transactions. It is the single place
 * that calculates progress, remaining money, unassigned money, and statuses.
 */
import AppError from '../utils/AppError.js';
import { findMonthlyBudget, listBudgets, saveMonthlyBudget as saveMonthlyBudgetRecord } from '../repositories/budgetRepository.js';
import { listCategories as findCategories } from '../repositories/categoryRepository.js';
import { findTransactionRecords, findUpcomingExpenses } from '../repositories/transactionRepository.js';

export const BUDGET_STATUS_THRESHOLDS = Object.freeze({ nearLimit: 80, overBudget: 100 });

const getPeriod = (year, month) => {
  const targetYear = Number(year || new Date().getFullYear());
  const targetMonth = Number(month || new Date().getMonth() + 1);
  if (!Number.isInteger(targetYear) || targetYear < 2000 || !Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid month or year');
  }
  // UTC boundaries make a calendar month consistent even when the server and
  // database use different local time zones.
  return {
    year: targetYear,
    month: targetMonth,
    start: new Date(Date.UTC(targetYear, targetMonth - 1, 1)),
    end: new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999)),
  };
};

const money = (value) => Number(Number(value || 0).toFixed(2));

export const calculateBudgetStatus = (percentageUsed) => {
  if (percentageUsed >= BUDGET_STATUS_THRESHOLDS.overBudget) return 'Over Budget';
  if (percentageUsed >= BUDGET_STATUS_THRESHOLDS.nearLimit) return 'Near Limit';
  return 'On Track';
};

const transactionType = (item) => String(item.type || '').toUpperCase();
export const calculateMonthlyIncome = (transactions) => money(transactions.filter((item) => transactionType(item) === 'INCOME').reduce((sum, item) => sum + Number(item.amount), 0));
export const calculateMonthlyExpenses = (transactions) => money(transactions.filter((item) => transactionType(item) === 'EXPENSE').reduce((sum, item) => sum + Number(item.amount), 0));
export const calculateCategorySpending = (transactions) => transactions
  .filter((item) => transactionType(item) === 'EXPENSE')
  .reduce((result, item) => ({ ...result, [item.categoryId]: money((result[item.categoryId] || 0) + Number(item.amount)) }), {});
export const calculateBudgetPercentage = (spent, budget) => (budget > 0 ? Math.round((spent / budget) * 100) : spent > 0 ? 100 : 0);
export const calculateUnassignedMoney = (income, assigned) => money(income - assigned);
export const calculateAvailableToSpend = (currentBalance, upcomingBills) => money(currentBalance - upcomingBills);

export const getBudgetPlanner = async (userId, year, month) => {
  const period = getPeriod(year, month);
  const [monthlyBudget, budgets, categories, transactions, upcomingTransactions] = await Promise.all([
    findMonthlyBudget(userId, period.month, period.year),
    listBudgets(userId, period.month, period.year),
    findCategories(userId, 'EXPENSE'),
    findTransactionRecords({ userId, transactionDate: { gte: period.start, lte: period.end } }),
    findUpcomingExpenses({ userId, type: 'EXPENSE', transactionDate: { gt: new Date(), lte: period.end } }),
  ]);

  // Actual spending comes from expense transactions, not from a copied field
  // on the budget. This keeps the planner accurate after create, edit, or
  // delete operations on the transaction page.
  const spending = calculateCategorySpending(transactions);
  const budgetByCategory = Object.fromEntries(budgets.map((item) => [item.categoryId, item]));
  const categoryRows = categories.map((category) => {
    const budget = money(budgetByCategory[category.id]?.amount);
    const spent = money(spending[category.id]);
    // A negative remaining value is useful: it tells the user exactly how far
    // the category is over its plan instead of hiding the overspend.
    const percentageUsed = calculateBudgetPercentage(spent, budget);
    return { id: budgetByCategory[category.id]?.id || null, categoryId: category.id, category: category.name, budget, spent, remaining: money(budget - spent), percentageUsed, status: calculateBudgetStatus(percentageUsed) };
  });

  const totalIncome = calculateMonthlyIncome(transactions);
  const totalExpenses = calculateMonthlyExpenses(transactions);
  const savingsTarget = money(monthlyBudget?.savingsTarget);
  const incomeTarget = money(monthlyBudget?.incomeTarget);
  // Assigned money includes category plans and the savings target. Any income
  // target left after this total is shown as unassigned money.
  const totalAssigned = money(categoryRows.reduce((sum, item) => sum + item.budget, 0) + savingsTarget);
  const currentBalance = money(totalIncome - totalExpenses);
  const upcomingBills = money(upcomingTransactions.reduce((sum, item) => sum + Number(item.amount), 0));
  const statusValues = categoryRows.map((item) => item.status);
  const healthStatus = statusValues.includes('Over Budget') ? 'Over Budget' : statusValues.includes('Near Limit') ? 'Near Limit' : 'On Track';

  return {
    year: period.year,
    month: period.month,
    monthKey: `${period.year}-${String(period.month).padStart(2, '0')}`,
    incomeTarget,
    savingsTarget,
    totalIncome,
    totalExpenses,
    totalSavings: savingsTarget,
    remaining: money(totalIncome - totalExpenses - savingsTarget),
    totalAssigned,
    unassigned: calculateUnassignedMoney(incomeTarget || totalIncome, totalAssigned),
    currentBalance,
    upcomingBills,
    availableToSpend: calculateAvailableToSpend(currentBalance, upcomingBills),
    healthStatus,
    categories: categoryRows,
    upcomingTransactions: upcomingTransactions.map((item) => ({ description: item.description, category: item.category.name, amount: money(item.amount), dueDate: item.transactionDate })),
  };
};

export const saveMonthlyBudget = async (userId, input) => {
  const period = getPeriod(input.year, input.month);
  const incomeTarget = Number(input.incomeTarget ?? 0);
  const savingsTarget = Number(input.savingsTarget ?? 0);
  if (!Number.isFinite(incomeTarget) || incomeTarget < 0 || !Number.isFinite(savingsTarget) || savingsTarget < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Income and savings must be zero or greater');
  }
  return saveMonthlyBudgetRecord(userId, period.month, period.year, { incomeTarget, savingsTarget });
};